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
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Referee Registration ─────────────────────────────────────────────────

  async registerReferee(dto: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ message: string; refereeCode: string }> {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase().trim() }).exec();
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const refereeCode = await this.generateUniqueRefereeCode();
    const refereeStoreSlug = await this.generateUniqueRefereeSlug(dto.name);

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
      status: 'active',
    });

    // Fire-and-forget welcome SMS (no WhatsApp link)
    if (dto.phone) {
      this.smsService
        .sendRefereeWelcomeSms(dto.phone, refereeCode, dto.name)
        .catch((err) => this.logger.error(`Referee welcome SMS failed: ${err.message}`));
    }

    this.logger.log(`New referee registered: ${dto.email} — code: ${refereeCode}`);
    return { message: 'Account created successfully!', refereeCode };
  }

  // ─── Referee Store (products from opted-in vendors) ──────────────────────

  async getRefereeStore(refereeId: string): Promise<{ products: any[]; hiddenIds: string[] }> {
    const referee = await this.userModel.findById(refereeId).exec();
    if (!referee || referee.role !== 'referee') {
      throw new ForbiddenException('Only referee accounts can access the referral store.');
    }

    const hiddenIds = referee.refereeHiddenProducts || [];

    // Find all vendors with acceptReferrals: true
    const optedInVendors = await this.userModel
      .find({ role: 'vendor', acceptReferrals: true, status: 'active' })
      .select('_id')
      .exec();
    const vendorIds = optedInVendors.map((v) => (v as any)._id);

    if (!vendorIds.length) return { products: [], hiddenIds };

    const products = await this.productModel
      .find({
        vendorId: { $in: vendorIds },
        isActive: true,
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return { products, hiddenIds };
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

    const hiddenIds = (referee as any).refereeHiddenProducts || [];

    const optedInVendors = await this.userModel
      .find({ role: 'vendor', acceptReferrals: true, status: 'active' })
      .select('_id')
      .exec();
    const vendorIds = optedInVendors.map((v) => (v as any)._id);

    let products: any[] = [];
    if (vendorIds.length) {
      products = await this.productModel
        .find({
          vendorId: { $in: vendorIds },
          isActive: true,
          _id: { $nin: hiddenIds.map((id: string) => new Types.ObjectId(id)) },
        })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    }

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

    // Credit wallet
    await this.userModel.findByIdAndUpdate(order.refereeId, {
      $inc: {
        refereeWalletBalance: commission,
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
