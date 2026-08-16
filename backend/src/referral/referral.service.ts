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
    socialMediaLinks?: string[];
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
    const hasKycDocs = !!(dto.ghanaCardFront && dto.selfie);

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
      socialMediaLinks: dto.socialMediaLinks || [],
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

  // ─── Referee Store (curated selections, capped at 50, 10 auto-filled) ────

  private async optedInVendorIds(): Promise<Types.ObjectId[]> {
    const optedInVendors = await this.userModel
      .find({ role: 'vendor', acceptReferrals: true, status: 'active' })
      .select('_id')
      .exec();
    return optedInVendors.map((v) => (v as any)._id);
  }

  /** Tops up a referee's auto-assigned slots (up to REFEREE_AUTO_FILL_COUNT) from their region. */
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

    const candidates = await this.productModel
      .find({
        vendorId: { $in: vendorIds },
        region: referee.region,
        isActive: true,
        _id: { $nin: alreadyPicked },
      })
      .select('_id')
      .limit(slotsToFill)
      .exec();

    if (!candidates.length) return;

    await this.refereeProductSelectionModel.insertMany(
      candidates.map((p) => ({
        refereeId: new Types.ObjectId(refereeId),
        productId: (p as any)._id,
        source: 'auto',
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
      .map((s: any) => ({ ...s.productId, selectionSource: s.source, selectedAt: s.selectedAt }));

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
        .select('productId')
        .lean()
        .exec(),
    ]);

    return {
      products,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      selectedIds: mySelections.map((s: any) => String(s.productId)),
    };
  }

  async selectProduct(refereeId: string, productId: string): Promise<{ selected: boolean; count: number }> {
    const referee = await this.userModel.findById(refereeId).exec();
    if (!referee || referee.role !== 'referee') {
      throw new ForbiddenException('Only referee accounts can select products.');
    }

    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

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
      });
    } catch (err: any) {
      if (err.code !== 11000) throw err; // ignore duplicate-select races
    }

    const newCount = await this.refereeProductSelectionModel.countDocuments({
      refereeId: new Types.ObjectId(refereeId),
    });
    return { selected: true, count: newCount };
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
      .populate('refereeId', 'name refereeCode phone socialMediaLinks')
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
        socialMediaLinks: s.refereeId.socialMediaLinks || [],
        selectedAt: s.selectedAt,
      }));
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
      .map((s: any) => s.productId);

    return { referee, products };
  }

  // ─── Referral Link Builder ────────────────────────────────────────────────

  buildReferralLink(productId: string, refereeCode: string): string {
    const base =
      this.configService.get<string>('FRONTEND_URL')?.replace(/\/$/, '') ||
      'https://flamingo-store1.com';
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

    const base =
      this.configService.get<string>('FRONTEND_URL')?.replace(/\/$/, '') ||
      'https://flamingo-store1.com';

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

  // ─── Vendor Referral Toggle ───────────────────────────────────────────────

  async setVendorReferralAcceptance(vendorId: string, accept: boolean): Promise<{ acceptReferrals: boolean }> {
    const vendor = await this.userModel.findById(vendorId).exec();
    if (!vendor || vendor.role !== 'vendor') {
      throw new ForbiddenException('Only vendor accounts can toggle referral acceptance.');
    }
    await this.userModel.findByIdAndUpdate(vendorId, { acceptReferrals: accept });
    this.logger.log(`Vendor ${vendorId} set acceptReferrals=${accept}`);
    return { acceptReferrals: accept };
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
