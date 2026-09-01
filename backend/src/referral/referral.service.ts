import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { ReferralEarning, ReferralEarningDocument } from './referral-earning.schema';
import {
  RefereeProductSelection,
  RefereeProductSelectionDocument,
} from './referee-product-selection.schema';
import { SmsService } from '../common/sms.service';
import { ConfigService } from '@nestjs/config';
import { slugifyShopName, slugCandidates } from '../common/slug.util';
import { FLA_CONSTANTS } from '../common/constants';
import { getFrontendBaseUrl } from '../common/frontend-url.util';

const BCRYPT_ROUNDS = 8;

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ReferralEarning.name) private referralEarningModel: Model<ReferralEarningDocument>,
    @InjectModel(RefereeProductSelection.name)
    private refereeProductSelectionModel: Model<RefereeProductSelectionDocument>,
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Referee Registration ─────────────────────────────────────────────────

  async registerReferee(dto: {
    name: string;
    email: string;
    phone: string;
    password: string;
    region?: string;
    tiktokLink?: string;
    snapchatLink?: string;
    paymentMethod?: { network: string; accountNumber: string; accountName: string };
    ghanaCardFront?: string;
    ghanaCardBack?: string;
    selfie?: string;
  }): Promise<{ message: string; refereeCode: string }> {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase().trim() }).exec();
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const refereeCode = await this.generateUniqueRefereeCode();
    const refereeStoreSlug = await this.generateUniqueRefereeSlug(dto.name);
    // Ghana Card is no longer collected at signup — a selfie alone marks KYC as submitted.
    const hasKycDocs = !!dto.selfie;

    const referee = await this.userModel.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase().trim(),
      phone: dto.phone.trim(),
      password: hashedPassword,
      role: 'referee',
      refereeCode,
      refereeStoreSlug,
      refereeWalletBalance: 0,
      refereeLifetimeEarnings: 0,
      refereeHiddenProducts: [],
      status: 'pending',
      region: dto.region,
      tiktokLink: dto.tiktokLink,
      snapchatLink: dto.snapchatLink,
      paymentMethods: dto.paymentMethod ? [dto.paymentMethod] : [],
      ghanaCardFront: dto.ghanaCardFront,
      ghanaCardBack: dto.ghanaCardBack,
      selfie: dto.selfie,
      ...(hasKycDocs && { kycSubmittedAt: new Date(), verificationStatus: 'submitted' }),
    });

    // Fire-and-forget welcome SMS (no WhatsApp link)
    if (dto.phone) {
      this.smsService
        .sendRefereeWelcomeSms(dto.phone, refereeCode, dto.name)
        .catch((err) => this.logger.error(`Referee welcome SMS failed: ${err.message}`));
    }

    this.logger.log(`New referee registered: ${dto.email} — code: ${refereeCode} — pending review`);
    return {
      message: 'Application submitted! Your account is under review — we will notify you once approved.',
      refereeCode,
    };
  }

  // ─── Referral Markup Pricing ───────────────────────────────────────────────

  /** Min/max flat GHS markup a referee may add on top of a product's vendor price. */
  private markupBounds(vendorPrice: number): { min: number; max: number } {
    const min = FLA_CONSTANTS.MIN_REFERRAL_MARKUP_GHS;
    const max = Math.max(min, Math.round(vendorPrice * (FLA_CONSTANTS.MAX_REFERRAL_MARKUP_PERCENT / 100)));
    return { min, max };
  }

  private assertMarkupInBounds(vendorPrice: number, markupGhs: number): void {
    const { min, max } = this.markupBounds(vendorPrice);
    if (typeof markupGhs !== 'number' || Number.isNaN(markupGhs)) {
      throw new BadRequestException('Please enter a markup amount.');
    }
    if (markupGhs < min || markupGhs > max) {
      throw new BadRequestException(
        `Markup must be between GHS ${min} and GHS ${max} for this product.`,
      );
    }
  }

  // ─── Referee Store (curated selections, capped at 50, 10 auto-filled) ────

  /**
   * Every active vendor's products are eligible for referral — no per-vendor opt-in.
   * Returns string IDs (not ObjectId instances): Product.vendorId is stored as a plain
   * string in this database, and Mongo's $in does not match ObjectId query values against
   * string-typed stored fields — only same-type comparisons match.
   */
  private async optedInVendorIds(): Promise<string[]> {
    const activeVendors = await this.userModel
      .find({ role: 'vendor', status: 'active' })
      .select('_id')
      .exec();
    return activeVendors.map((v) => String((v as any)._id));
  }

  /** Spreads a candidate pool across vendors (round-robin) instead of taking whichever
   * vendor's products happen to sort first — a vendor with many listings would
   * otherwise fill every auto-slot on its own. */
  private roundRobinByVendor(pool: any[]): any[] {
    const byVendor = new Map<string, any[]>();
    for (const p of pool) {
      const key = String((p as any).vendorId);
      if (!byVendor.has(key)) byVendor.set(key, []);
      byVendor.get(key)!.push(p);
    }
    const vendorGroups = Array.from(byVendor.values());
    const ordered: any[] = [];
    let round = 0;
    while (vendorGroups.some((g) => round < g.length)) {
      for (const group of vendorGroups) {
        if (round < group.length) ordered.push(group[round]);
      }
      round++;
    }
    return ordered;
  }

  /**
   * Tops up a referee's auto-assigned slots (up to REFEREE_AUTO_FILL_COUNT).
   * Prefers the referee's own region, but guarantees exposure across at least
   * REFEREE_AUTO_FILL_MIN_VENDORS distinct vendors — widening beyond the region
   * when it doesn't have enough vendor variety — so every vendor keeps getting
   * a shot at sales as more referees join, not just whichever ones a region
   * happens to be dominated by.
   */
  async autoFillRefereeStore(refereeId: string): Promise<void> {
    const referee = await this.userModel.findById(refereeId).select('region').exec();
    if (!referee?.region) return;

    const currentAutoCount = await this.refereeProductSelectionModel.countDocuments({
      refereeId: new Types.ObjectId(refereeId),
      source: 'auto',
    });
    const slotsToFill = FLA_CONSTANTS.REFEREE_AUTO_FILL_COUNT - currentAutoCount;
    if (slotsToFill <= 0) return;

    const vendorIds = await this.optedInVendorIds();
    if (!vendorIds.length) return;

    const alreadyPicked = await this.refereeProductSelectionModel.distinct('productId');

    const regionPool = await this.productModel
      .find({ vendorId: { $in: vendorIds }, region: referee.region, isActive: true, _id: { $nin: alreadyPicked } })
      .select('_id vendorId price')
      .sort({ createdAt: -1 })
      .limit(300)
      .exec();

    const regionVendorCount = new Set(regionPool.map((p: any) => String(p.vendorId))).size;

    // If the region doesn't have enough distinct vendors, use a nationwide pool
    // instead — round-robinning a few vendors' full catalogs would otherwise
    // fill every slot from just those vendors before ever reaching the rest.
    let pool = regionPool;
    if (regionVendorCount < FLA_CONSTANTS.REFEREE_AUTO_FILL_MIN_VENDORS) {
      pool = await this.productModel
        .find({ vendorId: { $in: vendorIds }, isActive: true, _id: { $nin: alreadyPicked } })
        .select('_id vendorId price')
        .sort({ createdAt: -1 })
        .limit(300)
        .exec();
    }

    const picked = this.roundRobinByVendor(pool).slice(0, slotsToFill);
    if (!picked.length) return;

    await this.refereeProductSelectionModel.insertMany(
      picked.map((p: any) => ({
        refereeId: new Types.ObjectId(refereeId),
        productId: p._id,
        source: 'auto',
        // Auto-filled at the minimum markup — the referee can raise it anytime from their store.
        markupGhs: this.markupBounds(p.price || 0).min,
      })),
      { ordered: false },
    ).catch(() => {
      // Ignore duplicate-key races (another concurrent auto-fill already claimed one).
    });
  }

  async getRefereeStore(refereeId: string): Promise<{ products: any[]; hiddenIds: string[]; cap: number; autoFillCount: number }> {
    const referee = await this.userModel.findById(refereeId).exec();
    if (!referee || referee.role !== 'referee') {
      throw new ForbiddenException('Only referee accounts can access the referral store.');
    }

    await this.autoFillRefereeStore(refereeId).catch((err) =>
      this.logger.error(`Auto-fill failed for referee ${refereeId}: ${err.message}`),
    );

    const hiddenIds = referee.refereeHiddenProducts || [];

    const selections = await this.refereeProductSelectionModel
      .find({ refereeId: new Types.ObjectId(refereeId) })
      .populate('productId')
      .sort({ selectedAt: -1 })
      .lean()
      .exec();

    const products = selections
      .filter((s: any) => s.productId)
      .map((s: any) => {
        const vendorPrice = s.productId.price || 0;
        const markupGhs = s.markupGhs ?? this.markupBounds(vendorPrice).min;
        return {
          ...s.productId,
          vendorPrice,
          markupGhs,
          sellPrice: vendorPrice + markupGhs,
          markupBounds: this.markupBounds(vendorPrice),
          selectionSource: s.source,
          selectedAt: s.selectedAt,
        };
      });

    return { products, hiddenIds, cap: FLA_CONSTANTS.REFEREE_STORE_CAP, autoFillCount: FLA_CONSTANTS.REFEREE_AUTO_FILL_COUNT };
  }

  async toggleHideProduct(refereeId: string, productId: string): Promise<{ hidden: boolean }> {
    const referee = await this.userModel.findById(refereeId).exec();
    if (!referee || referee.role !== 'referee') {
      throw new ForbiddenException('Only referee accounts can manage their store.');
    }

    const hiddenProducts = referee.refereeHiddenProducts || [];
    const isHidden = hiddenProducts.includes(productId);

    if (isHidden) {
      // Unhide
      await this.userModel.findByIdAndUpdate(refereeId, {
        $pull: { refereeHiddenProducts: productId },
      });
      return { hidden: false };
    } else {
      // Hide
      await this.userModel.findByIdAndUpdate(refereeId, {
        $addToSet: { refereeHiddenProducts: productId },
      });
      return { hidden: true };
    }
  }

  // ─── Product Picker ────────────────────────────────────────────────────────

  async browseProducts(
    refereeId: string,
    opts: { region?: string; search?: string; category?: string; page?: number; limit?: number },
  ): Promise<{ products: any[]; total: number; page: number; totalPages: number; selectedIds: string[] }> {
    const referee = await this.userModel.findById(refereeId).exec();
    if (!referee || referee.role !== 'referee') {
      throw new ForbiddenException('Only referee accounts can browse products.');
    }

    const vendorIds = await this.optedInVendorIds();
    const filter: Record<string, unknown> = { isActive: true };
    if (vendorIds.length) {
      filter.vendorId = { $in: vendorIds };
    } else {
      return { products: [], total: 0, page: 1, totalPages: 0, selectedIds: [] };
    }
    if (opts.region) filter.region = opts.region;
    if (opts.category && opts.category !== 'All Product') filter.category = opts.category;
    if (opts.search) {
      const q = opts.search.trim();
      (filter as any).$or = [
        { name: { $regex: q, $options: 'i' } },
        { vendorName: { $regex: q, $options: 'i' } },
      ];
    }

    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(48, Math.max(1, opts.limit || 24));

    const [products, total, mySelections] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments(filter),
      this.refereeProductSelectionModel
        .find({ refereeId: new Types.ObjectId(refereeId) })
        .select('productId markupGhs')
        .lean()
        .exec(),
    ]);

    const markupByProductId = new Map<string, number>(
      mySelections.map((s: any) => [String(s.productId), s.markupGhs]),
    );
    const productsWithMarkup = products.map((p: any) => {
      const bounds = this.markupBounds(p.price || 0);
      return {
        ...p,
        markupBounds: bounds,
        defaultMarkupGhs: bounds.min,
        currentMarkupGhs: markupByProductId.get(String(p._id)) ?? null,
      };
    });

    return {
      products: productsWithMarkup,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      selectedIds: mySelections.map((s: any) => String(s.productId)),
    };
  }

  async selectProduct(
    refereeId: string,
    productId: string,
    markupGhs: number,
  ): Promise<{ selected: boolean; count: number; markupGhs: number }> {
    const referee = await this.userModel.findById(refereeId).exec();
    if (!referee || referee.role !== 'referee') {
      throw new ForbiddenException('Only referee accounts can select products.');
    }

    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    this.assertMarkupInBounds(product.price || 0, markupGhs);

    const count = await this.refereeProductSelectionModel.countDocuments({
      refereeId: new Types.ObjectId(refereeId),
    });
    if (count >= FLA_CONSTANTS.REFEREE_STORE_CAP) {
      throw new BadRequestException(
        `Your store is full (${FLA_CONSTANTS.REFEREE_STORE_CAP} products max). Remove a product before adding another.`,
      );
    }

    try {
      await this.refereeProductSelectionModel.create({
        refereeId: new Types.ObjectId(refereeId),
        productId: new Types.ObjectId(productId),
        source: 'manual',
        markupGhs,
      });
    } catch (err: any) {
      if (err.code !== 11000) throw err; // ignore duplicate-select races
    }

    const newCount = await this.refereeProductSelectionModel.countDocuments({
      refereeId: new Types.ObjectId(refereeId),
    });
    return { selected: true, count: newCount, markupGhs };
  }

  /** Referee adjusts their markup on a product already in their store. */
  async updateProductMarkup(
    refereeId: string,
    productId: string,
    markupGhs: number,
  ): Promise<{ markupGhs: number; sellPrice: number }> {
    const referee = await this.userModel.findById(refereeId).exec();
    if (!referee || referee.role !== 'referee') {
      throw new ForbiddenException('Only referee accounts can manage their store.');
    }

    const product = await this.productModel.findById(productId).select('price').exec();
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    this.assertMarkupInBounds(product.price || 0, markupGhs);

    const selection = await this.refereeProductSelectionModel.findOneAndUpdate(
      { refereeId: new Types.ObjectId(refereeId), productId: new Types.ObjectId(productId) },
      { $set: { markupGhs } },
      { new: true },
    );
    if (!selection) {
      throw new NotFoundException('This product is not in your store.');
    }

    return { markupGhs, sellPrice: (product.price || 0) + markupGhs };
  }

  async unselectProduct(refereeId: string, productId: string): Promise<{ selected: boolean; count: number }> {
    const referee = await this.userModel.findById(refereeId).exec();
    if (!referee || referee.role !== 'referee') {
      throw new ForbiddenException('Only referee accounts can manage their store.');
    }

    await this.refereeProductSelectionModel.deleteOne({
      refereeId: new Types.ObjectId(refereeId),
      productId: new Types.ObjectId(productId),
    });

    const newCount = await this.refereeProductSelectionModel.countDocuments({
      refereeId: new Types.ObjectId(refereeId),
    });
    return { selected: false, count: newCount };
  }

  // ─── Vendor: Who Selected My Product ──────────────────────────────────────

  async getProductSelectors(vendorId: string, productId: string): Promise<any[]> {
    const product = await this.productModel.findById(productId).select('vendorId').exec();
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    if (String(product.vendorId) !== String(vendorId)) {
      throw new ForbiddenException('You can only view referees for your own products.');
    }

    const selections = await this.refereeProductSelectionModel
      .find({ productId: new Types.ObjectId(productId) })
      .populate('refereeId', 'name refereeCode phone tiktokLink snapchatLink')
      .sort({ selectedAt: -1 })
      .lean()
      .exec();

    return selections
      .filter((s: any) => s.refereeId)
      .map((s: any) => ({
        _id: s.refereeId._id,
        name: s.refereeId.name,
        refereeCode: s.refereeId.refereeCode,
        phone: s.refereeId.phone,
        tiktokLink: s.refereeId.tiktokLink,
        snapchatLink: s.refereeId.snapchatLink,
        markupGhs: s.markupGhs,
        selectedAt: s.selectedAt,
      }));
  }

  /** How many referees have picked each of this vendor's products — for a badge count on the product card. */
  async getProductSelectorCounts(vendorId: string): Promise<Record<string, number>> {
    const products = await this.productModel.find({ vendorId }).select('_id').lean().exec();
    const productIds = products.map((p: any) => p._id);
    if (!productIds.length) return {};

    const counts = await this.refereeProductSelectionModel.aggregate([
      { $match: { productId: { $in: productIds } } },
      { $group: { _id: '$productId', count: { $sum: 1 } } },
    ]);

    const result: Record<string, number> = {};
    counts.forEach((c: any) => {
      result[String(c._id)] = c.count;
    });
    return result;
  }

  // ─── Public Referee Storefront ────────────────────────────────────────────

  async getPublicRefereeStore(slug: string): Promise<{
    referee: any;
    products: any[];
  }> {
    const referee = await this.userModel
      .findOne({ refereeStoreSlug: slug, role: 'referee', status: 'active' })
      .select('name refereeCode refereeStoreSlug profileImage refereeHiddenProducts')
      .lean()
      .exec();

    if (!referee) {
      throw new NotFoundException('Referee store not found.');
    }

    const hiddenIds = ((referee as any).refereeHiddenProducts || []).map((id: string) => String(id));

    const selections = await this.refereeProductSelectionModel
      .find({ refereeId: (referee as any)._id })
      .populate('productId')
      .sort({ selectedAt: -1 })
      .lean()
      .exec();

    const products = selections
      .filter((s: any) => s.productId && s.productId.isActive && !hiddenIds.includes(String(s.productId._id)))
      .map((s: any) => {
        const vendorPrice = s.productId.price || 0;
        const markupGhs = s.markupGhs ?? this.markupBounds(vendorPrice).min;
        // Buyers on a referral storefront see (and pay) the vendor price plus this
        // referee's markup — `price` is overwritten so every existing price display
        // works unchanged; `vendorPrice` is kept alongside for reference.
        return { ...s.productId, vendorPrice, markupGhs, price: vendorPrice + markupGhs };
      });

    return { referee, products };
  }

  /**
   * Resolves the price a buyer actually pays for one product via a specific referee's
   * link — vendor price + that referee's markup. Returns null if this referee hasn't
   * added the product to their store (no markup applies; the product page falls back
   * to the vendor's plain price with no referral attribution for that item).
   */
  async getReferralProductPrice(
    refereeCode: string,
    productId: string,
  ): Promise<{ vendorPrice: number; markupGhs: number; sellPrice: number } | null> {
    const referee = await this.resolveRefereeByCode(refereeCode);
    if (!referee) return null;

    const [selection, product] = await Promise.all([
      this.refereeProductSelectionModel
        .findOne({ refereeId: (referee as any)._id, productId: new Types.ObjectId(productId) })
        .lean()
        .exec(),
      this.productModel.findById(productId).select('price').lean().exec(),
    ]);
    if (!selection || !product) return null;

    const vendorPrice = (product as any).price || 0;
    const markupGhs = (selection as any).markupGhs ?? this.markupBounds(vendorPrice).min;
    return { vendorPrice, markupGhs, sellPrice: vendorPrice + markupGhs };
  }

  /**
   * Same lookup as getReferralProductPrice, but by referee ID (already resolved) instead of
   * code — used at checkout to authoritatively price each referred cart item server-side.
   * Returns null when this referee hasn't added the product to their store, meaning no
   * markup or commission applies to that specific item.
   */
  async getSelectionMarkup(
    refereeId: string,
    productId: string,
  ): Promise<{ vendorPrice: number; markupGhs: number } | null> {
    const [selection, product] = await Promise.all([
      this.refereeProductSelectionModel
        .findOne({ refereeId: new Types.ObjectId(refereeId), productId: new Types.ObjectId(productId) })
        .lean()
        .exec(),
      this.productModel.findById(productId).select('price').lean().exec(),
    ]);
    if (!selection || !product) return null;

    const vendorPrice = (product as any).price || 0;
    const markupGhs = (selection as any).markupGhs ?? this.markupBounds(vendorPrice).min;
    return { vendorPrice, markupGhs };
  }

  // ─── Referral Link Builder ────────────────────────────────────────────────

  buildReferralLink(productId: string, refereeCode: string): string {
    const base = getFrontendBaseUrl();
    return `${base}/product/${productId}?ref=${refereeCode}`;
  }

  async getReferralLinkForProduct(refereeId: string, productId: string): Promise<{ link: string }> {
    const referee = await this.userModel.findById(refereeId).select('refereeCode role').exec();
    if (!referee || referee.role !== 'referee') {
      throw new ForbiddenException('Only referee accounts can generate referral links.');
    }
    const link = this.buildReferralLink(productId, referee.refereeCode!);
    return { link };
  }

  // ─── Resolve Referee From Code ────────────────────────────────────────────

  async resolveRefereeByCode(code: string): Promise<UserDocument | null> {
    if (!code) return null;
    return this.userModel.findOne({ refereeCode: code, role: 'referee', status: 'active' }).exec();
  }

  /** Safe public lookup — only name + storefront slug, used to build "back to X's store" links. */
  async resolvePublicRefereeInfo(code: string): Promise<{ name: string; refereeStoreSlug: string } | null> {
    const referee = await this.userModel
      .findOne({ refereeCode: code, role: 'referee', status: 'active' })
      .select('name refereeStoreSlug')
      .lean()
      .exec();
    if (!referee) return null;
    return { name: (referee as any).name, refereeStoreSlug: (referee as any).refereeStoreSlug };
  }

  // ─── Credit Commission on Sale ────────────────────────────────────────────

  async creditRefereeCommission(order: OrderDocument): Promise<void> {
    if (!order.refereeId || order.refereeCommissionPaid) return;

    const commission = order.refereeCommission || 0;
    if (commission <= 0) return;

    // Idempotency: skip if already have an earning for this order
    const existingEarning = await this.referralEarningModel
      .findOne({ orderId: order._id })
      .exec();
    if (existingEarning) {
      this.logger.warn(`Referee commission already credited for order ${order._id}`);
      return;
    }

    const productNames = (order.items || []).map((item: any) => item.name).filter(Boolean);
    const paidViaSplit = !!order.refereePaidViaSplit;

    // Wallet is only credited as a fallback — if Paystack already auto-paid the referee
    // via a transaction split, crediting the wallet too would double-pay them.
    await this.userModel.findByIdAndUpdate(order.refereeId, {
      $inc: {
        ...(paidViaSplit ? {} : { refereeWalletBalance: commission }),
        refereeLifetimeEarnings: commission,
      },
    });

    // Create earning record
    await this.referralEarningModel.create({
      refereeId: order.refereeId,
      orderId: order._id,
      vendorId: order.vendorId,
      vendorName: order.vendorName,
      productNames,
      saleAmount: order.totalProductAmount || order.totalAmount,
      commission,
      status: 'credited',
      creditedAt: new Date(),
    });

    // Mark order commission as paid
    await order.updateOne({ refereeCommissionPaid: true });

    // Fire-and-forget SMS to referee
    const referee = await this.userModel.findById(order.refereeId).select('phone').exec();
    if (referee?.phone) {
      this.smsService
        .sendRefereeSaleSms(
          referee.phone,
          commission,
          order.totalProductAmount || order.totalAmount,
          order._id.toString(),
        )
        .catch((err) => this.logger.error(`Referee sale SMS failed: ${err.message}`));
    }

    this.logger.log(
      `Referee commission of GHS ${commission} credited for order ${order._id} to referee ${order.refereeId}`,
    );
  }

  // ─── Referee Dashboard Earnings ───────────────────────────────────────────

  async getRefereeDashboard(refereeId: string): Promise<{
    todayEarnings: number;
    monthEarnings: number;
    lifetimeEarnings: number;
    walletBalance: number;
    refereeCode: string;
    refereeStoreSlug: string;
    storeUrl: string;
    history: any[];
  }> {
    const referee = await this.userModel
      .findById(refereeId)
      .select('refereeCode refereeStoreSlug refereeWalletBalance refereeLifetimeEarnings role')
      .exec();

    if (!referee || referee.role !== 'referee') {
      throw new ForbiddenException('Only referee accounts can view their dashboard.');
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayResult, monthResult, history] = await Promise.all([
      this.referralEarningModel.aggregate([
        {
          $match: {
            refereeId: new Types.ObjectId(refereeId),
            creditedAt: { $gte: startOfToday },
          },
        },
        { $group: { _id: null, total: { $sum: '$commission' } } },
      ]),
      this.referralEarningModel.aggregate([
        {
          $match: {
            refereeId: new Types.ObjectId(refereeId),
            creditedAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$commission' } } },
      ]),
      this.referralEarningModel
        .find({ refereeId: new Types.ObjectId(refereeId) })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
        .exec(),
    ]);

    const base = getFrontendBaseUrl();

    return {
      todayEarnings: todayResult[0]?.total || 0,
      monthEarnings: monthResult[0]?.total || 0,
      lifetimeEarnings: referee.refereeLifetimeEarnings || 0,
      walletBalance: referee.refereeWalletBalance || 0,
      refereeCode: referee.refereeCode!,
      refereeStoreSlug: referee.refereeStoreSlug!,
      storeUrl: `${base}/ref/${referee.refereeStoreSlug}`,
      history,
    };
  }


  // ─── Private Helpers ──────────────────────────────────────────────────────

  private async generateUniqueRefereeCode(): Promise<string> {
    for (let attempts = 0; attempts < 10; attempts++) {
      const code = 'REF-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      const exists = await this.userModel.findOne({ refereeCode: code }).exec();
      if (!exists) return code;
    }
    throw new Error('Could not generate a unique referee code — please retry.');
  }

  private async generateUniqueRefereeSlug(name: string): Promise<string> {
    const base = slugifyShopName(name);
    const candidates = slugCandidates(`ref-${base}`);
    for (const candidate of candidates) {
      const taken = await this.userModel.findOne({ refereeStoreSlug: candidate }).exec();
      if (!taken) return candidate;
    }
    const fallback = `ref-${crypto.randomBytes(4).toString('hex')}`;
    return fallback;
  }
}
