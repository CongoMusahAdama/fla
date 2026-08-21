import { Injectable, ConflictException, InternalServerErrorException, NotFoundException, BadRequestException, Inject, forwardRef, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { OrdersService } from '../orders/orders.service';
import { PaystackService } from '../common/paystack.service';
import { ShuftiService } from '../common/shufti.service';
import { EmailService } from '../email/email.service';
import { TempVerification } from '../common/schemas/temp-verification.schema';
import { SmsService } from '../common/sms.service';
import { SettingsService } from '../settings/settings.service';
import {
  paystackMainAccountPercentage,
  resolveCommissionRate,
} from '../common/paystack-split.util';
import { slugifyShopName, slugCandidates } from '../common/slug.util';
import {
  agreementPdfFilename,
  buildVendorAgreementPdfBuffer,
} from './vendor-agreement-pdf.util';
import {
  introSubscriptionFields,
  pendingApprovalSubscriptionFields,
  isSubscriptionActive,
  amountDueForRenewal,
  daysUntilSubscriptionEnd,
  startOfDayIsoDate,
  addDays,
  planFieldsAfterPayment,
} from './vendor-subscription.util';
import { FLA_CONSTANTS } from '../common/constants';
import { getFrontendBaseUrl } from '../common/frontend-url.util';

import * as crypto from 'crypto';

// Rounds=8: ~25ms (vs 10 rounds=~100ms). Both are cryptographically secure.
const BCRYPT_ROUNDS = 8;

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(TempVerification.name) private tempVerificationModel: Model<TempVerification>,
    @Inject(forwardRef(() => OrdersService)) private ordersService: OrdersService,
    private readonly paystackService: PaystackService,
    private readonly shuftiService: ShuftiService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly settingsService: SettingsService,
  ) { }

  async onModuleInit() {
    this.backfillMissingStoreSlugs().catch((err) =>
      this.logger.error(`Store slug backfill failed: ${err.message}`),
    );
    this.backfillLegacyVendorAccess().catch((err) =>
      this.logger.error(`Legacy vendor access backfill failed: ${err.message}`),
    );
  }

  /**
   * Existing active vendors (already selling before soft-onboarding / subscriptions)
   * may lack kycApprovedAt. Grant it so product uploads stay unlocked.
   * Does NOT touch Paystack subaccounts or split percentages.
   */
  async backfillLegacyVendorAccess(): Promise<{ kycBackfilled: number }> {
    const result = await this.userModel.updateMany(
      {
        role: 'vendor',
        status: 'active',
        $or: [{ kycApprovedAt: { $exists: false } }, { kycApprovedAt: null }],
      },
      { $set: { kycApprovedAt: new Date() } },
    );
    const kycBackfilled = result.modifiedCount || 0;
    if (kycBackfilled > 0) {
      this.logger.log(
        `Backfilled kycApprovedAt for ${kycBackfilled} existing active vendors (Paystack splits unchanged)`,
      );
    }
    return { kycBackfilled };
  }

  private async getPlatformCommissionRate(): Promise<number> {
    const value = await this.settingsService.getSetting('platform_commission');
    return resolveCommissionRate(value);
  }

  /**
   * Assign a unique storeSlug from shopName (or name). Idempotent if already set
   * unless forceRegen is true (e.g. shopName changed).
   */
  async ensureStoreSlug(
    userId: string,
    preferredName?: string,
    options?: { forceRegen?: boolean },
  ): Promise<string | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || user.role !== 'vendor') return null;

    if (user.storeSlug && !options?.forceRegen) {
      return user.storeSlug;
    }

    const source =
      preferredName?.trim() ||
      user.shopName?.trim() ||
      user.businessName?.trim() ||
      user.name?.trim() ||
      `vendor-${user.uniqueVendorId || userId.slice(-6)}`;

    const base = slugifyShopName(source);
    const candidates = slugCandidates(base);

    for (const candidate of candidates) {
      const taken = await this.userModel
        .findOne({ storeSlug: candidate, _id: { $ne: user._id } })
        .select('_id')
        .lean()
        .exec();
      if (!taken) {
        user.storeSlug = candidate;
        await user.save();
        this.logger.log(`Assigned storeSlug "${candidate}" to vendor ${userId}`);
        return candidate;
      }
    }

    const fallback = `${base}-${crypto.randomBytes(2).toString('hex')}`;
    user.storeSlug = fallback;
    await user.save();
    return fallback;
  }

  async backfillMissingStoreSlugs(): Promise<{ updated: number }> {
    const vendors = await this.userModel
      .find({
        role: 'vendor',
        $or: [{ storeSlug: { $exists: false } }, { storeSlug: null }, { storeSlug: '' }],
      })
      .select('_id shopName')
      .exec();

    let updated = 0;
    for (const v of vendors) {
      const slug = await this.ensureStoreSlug(v._id.toString());
      if (slug) updated++;
    }
    if (updated > 0) {
      this.logger.log(`Backfilled storeSlug for ${updated} vendors`);
    }
    return { updated };
  }

  async getStoreBySlug(slug: string) {
    const normalized = (slug || '').toLowerCase().trim();
    if (!normalized) {
      throw new NotFoundException('Store not found');
    }

    const user = await this.userModel
      .findOne({
        storeSlug: normalized,
        role: 'vendor',
        $or: [
          { status: 'active' },
          { kycApprovedAt: { $exists: true, $ne: null } },
        ],
      })
      .select(
        '-password -paymentMethods -withdrawalHistory -resetPasswordToken -resetPasswordExpires -ghanaCardFront -ghanaCardBack -selfie -utilityBill -momoNumber -accountName -paystackSubaccountCode -paystackBankCode',
      )
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('Store not found');
    }

    const vendorId = (user as any)._id.toString();
    let stats: Record<string, unknown> = {};
    try {
      stats = (await this.ordersService.getVendorStats(vendorId)) as any;
    } catch (err: any) {
      this.logger.warn(`Store stats unavailable for ${vendorId}: ${err.message}`);
    }
    return { vendor: user, stats };
  }

  private async applyPaystackSplitToSubaccount(subaccountCode: string): Promise<void> {
    const rate = await this.getPlatformCommissionRate();
    await this.paystackService.updateSubaccount(subaccountCode, { percentage_charge: rate });
    this.logger.log(
      `Paystack split for ${subaccountCode}: ${rate}% platform (admin), ${100 - rate}% vendor`,
    );
  }

  /** Fire-and-forget safe: logs mNotify errors but never throws (user already saved). */
  private sendRegistrationSms(phone: string, message: string, context: string): void {
    this.smsService.sendSms(phone, message).then((sent) => {
      if (!sent) {
        this.logger.error(
          `[${context}] SMS not delivered to ${phone}: ${this.smsService.lastError || 'unknown'}`,
        );
      }
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { email, password, role: inputRole, name, phone, location } = createUserDto;
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const role = inputRole || 'customer';
      const uniqueVendorId = role === 'vendor'
        ? `FLA-V-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
        : undefined;

      const vendorTier =
        role === 'vendor' && createUserDto.businessRegistration?.trim() ? 'high' : 'low';

      // Check for pending Shufti verification
      const tempVerification = await this.tempVerificationModel.findOne({ email: email.toLowerCase().trim() }).exec();
      let verificationStatus = 'pending';
      let isVerified = false;
      let verificationDate: Date | null = null;
      let verificationDeclineReason = null;

      if (tempVerification) {
        verificationStatus = tempVerification.status;
        isVerified = tempVerification.status === 'verified';
        if (isVerified) verificationDate = new Date();
        else verificationDeclineReason = tempVerification.payload?.declined_reason;
      }

      let kycSubmittedAt: Date | undefined = undefined;
      if (role === 'vendor' && createUserDto.ghanaCardFront && createUserDto.selfie) {
        kycSubmittedAt = new Date();
        verificationStatus = 'submitted';
      }

      const createdUser = new this.userModel({
        ...createUserDto,
        // Store email lowercase for consistent fast index lookups
        email: email.toLowerCase().trim(),
        role,
        password: hashedPassword,
        uniqueVendorId,
        vendorTier,
        verificationStatus,
        isVerified,
        verificationDate,
        verificationDeclineReason,
        isIdentityVerified: isVerified,
        isEmailVerified: true,
        // Vendors get dashboard access immediately; selling stays locked until KYC is approved (free, no payment).
        status: 'active',
        kycSubmittedAt,
        ...(role === 'vendor' ? pendingApprovalSubscriptionFields() : {}),
      });
      const savedUser = await createdUser.save();

      // Post-save work must never fail registration (user is already persisted)
      try {
        if (savedUser.phone) {
          const namePart = savedUser.shopName || savedUser.name?.split(' ')[0] || 'partner';
          if (role === 'customer') {
            const welcomeMsg = `Welcome to FLA, ${namePart}! Your account has been successfully created. Enjoy shopping exactly what you've ordered!`;
            this.sendRegistrationSms(savedUser.phone, welcomeMsg, 'customer-register');
          } else if (role === 'vendor') {
            // Registration received (same message as before). OTP code SMS is sent separately from AuthService.
            const vendorMsg = `Welcome to FLA, ${namePart}! Your vendor application is under review. We'll notify you once approved.`;
            this.sendRegistrationSms(savedUser.phone, vendorMsg, 'vendor-register');

            // Notify admin about the new vendor creation
            const adminMsg = `New vendor account created: Shop Name: "${savedUser.shopName || 'N/A'}", Owner Name: "${savedUser.name}", Phone: ${savedUser.phone || 'N/A'}. Please review.`;
            this.smsService.sendAdminNotification(adminMsg).catch((err) => {
              this.logger.error(`Failed to send admin notification for new vendor: ${err.message}`);
            });
          }
        }

        if (tempVerification) {
          await this.tempVerificationModel.deleteOne({ _id: tempVerification._id }).exec();
        }

        if (role === 'vendor') {
          if (createUserDto.ghanaCardFront && createUserDto.selfie && this.shuftiService.isConfigured()) {
            this.logger.log(`Triggering Shufti background verification for vendor: ${savedUser.email}`);
            this.shuftiService
              .verifyImages(savedUser._id.toString(), {
                email: savedUser.email,
                ghanaCardFront: createUserDto.ghanaCardFront,
                ghanaCardBack: createUserDto.ghanaCardBack || '',
                selfie: createUserDto.selfie,
              })
              .then(async () => {
                await this.userModel.findByIdAndUpdate(savedUser._id, {
                  $set: { verificationStatus: 'submitted' },
                });
              })
              .catch(err =>
                this.logger.error(`Shufti background submission failed for ${savedUser.email}: ${err.message}`),
              );
          } else if (role === 'vendor' && createUserDto.ghanaCardFront && createUserDto.selfie) {
            this.logger.warn(`Shufti keys missing — KYC documents saved but not sent for ${savedUser.email}`);
          }
        }
      } catch (postSaveError: any) {
        this.logger.error(
          `Post-registration side effects failed for ${savedUser.email}: ${postSaveError.message}`,
        );
      }

      return savedUser;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('Email address already exists');
      }
      throw new InternalServerErrorException(error.message || 'Error creating user');
    }
  }

  async findOne(email: string): Promise<UserDocument | null> {
    // Fast exact-match index lookup (no regex = no collection scan)
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  /** Match vendor/customer by Ghana phone (0XXXXXXXXX or 233XXXXXXXXX in DB) */
  async findByPhone(phone: string): Promise<UserDocument | null> {
    let cleaned = (phone || '').replace(/\D/g, '');
    if (cleaned.startsWith('233') && cleaned.length >= 12) {
      cleaned = '0' + cleaned.slice(3);
    } else if (cleaned.length === 9) {
      cleaned = '0' + cleaned;
    }
    if (!cleaned.startsWith('0') || cleaned.length !== 10) {
      return null;
    }
    const intl = '233' + cleaned.slice(1);
    return this.userModel
      .findOne({
        $or: [
          { phone: cleaned },
          { phone: intl },
          { phone: `+${intl}` },
        ],
      })
      .exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().lean().exec() as unknown as User[];
  }

  async countAll(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }

  async countByRole(role: string): Promise<number> {
    return this.userModel.countDocuments({ role }).exec();
  }

  async findOneById(id: string): Promise<User | null> {
    return this.userModel.findById(id).lean().exec() as unknown as User;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const updateData: any = { ...updateUserDto };
    // System-managed fields — ignore client attempts
    delete updateData.storeSlug;
    delete updateData.kycApprovedAt;
    delete updateData.mustChangePassword;
    delete updateData.subscriptionPlan;
    delete updateData.subscriptionLabel;
    delete updateData.subscriptionPriceText;
    delete updateData.subscriptionStartsAt;
    delete updateData.subscriptionEndsAt;
    delete updateData.subscriptionPaymentRequired;
    delete updateData.kycSubmittedAt;

    if (updateData.paymentMethods?.length) {
      const primary = updateData.paymentMethods[0];
      if (primary?.accountNumber) updateData.momoNumber = primary.accountNumber;
      if (primary?.accountName) updateData.accountName = primary.accountName;
    }

    // Auto-promote to high tier if business registration is provided
    if (updateData.businessRegistration?.trim()) {
      updateData.vendorTier = 'high';
    }

    const existing = await this.userModel
      .findById(id)
      .select(
        'role shopName status storeSlug kycApprovedAt ghanaCardFront selfie businessRegistration kycSubmittedAt',
      )
      .lean()
      .exec();
    const shopNameChanging =
      typeof updateData.shopName === 'string' &&
      updateData.shopName.trim() &&
      updateData.shopName.trim() !== (existing as any)?.shopName;

    // Detect KYC document submission → waiting for admin (4–5 hours messaging on frontend)
    if ((existing as any)?.role === 'vendor' && !(existing as any)?.kycApprovedAt) {
      const nextFront = updateData.ghanaCardFront ?? (existing as any)?.ghanaCardFront;
      const nextSelfie = updateData.selfie ?? (existing as any)?.selfie;
      const docsReady = Boolean(nextFront && nextSelfie);
      if (docsReady) {
        updateData.kycSubmittedAt = new Date();
        updateData.verificationStatus = 'submitted';
      }
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean().exec() as unknown as User;
    
    // Do NOT sync Paystack subaccounts on vendor self-serve profile/KYC saves.
    // Subaccounts are created only when admin approves the vendor (approveVendorKycForSelling).

    if (existing?.role === 'vendor') {
      const becameActive = updateData.status === 'active' || (updatedUser as any)?.status === 'active';
      if (becameActive || shopNameChanging) {
        await this.ensureStoreSlug(id, updateData.shopName, {
          forceRegen: Boolean(shopNameChanging && (updatedUser as any)?.status === 'active'),
        }).catch((err) => this.logger.error(`ensureStoreSlug on update failed: ${err.message}`));
        // Re-fetch so caller gets storeSlug
        return this.userModel.findById(id).lean().exec() as unknown as User;
      }
    }

    return updatedUser;
  }

  async syncVendorSubaccount(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || user.role !== 'vendor') return;

    if (user.paystackSubaccountCode) {
      // Already linked — do not update Paystack (avoids re-approval / duplicate pending accounts).
      this.logger.log(
        `Vendor ${userId} already has Paystack subaccount ${user.paystackSubaccountCode}; skipping sync`,
      );
      return;
    }

    const primaryMethod = user.paymentMethods?.[0];
    if (!primaryMethod || !primaryMethod.accountNumber) {
        this.logger.warn(`No primary payment method found for vendor ${userId}. Cannot sync subaccount.`);
        return;
    }

    try {
      const commissionRate = await this.getPlatformCommissionRate();
      const bankMapping: Record<string, string> = {
        'MTN': 'MTN',
        'Vodafone': 'VOD',
        'AirtelTigo': 'ATL',
        'GCB': '040100',
        'ECO': '030100',
        'ZEN': '060101',
        'ABS': '020100',
        'FID': '070101',
        'STA': '010100',
        'CAL': '050100',
        'ACC': '090101',
        'GTB': '080100',
        'UBA': '100100'
      };

      const bankCode = bankMapping[primaryMethod.network] || primaryMethod.network;

      this.logger.log(`Creating Paystack subaccount for vendor: ${user.shopName || user.name}...`);
      
      const subaccount = await this.paystackService.createSubaccount({
        business_name: user.shopName || user.name,
        settlement_bank: bankCode,
        account_number: primaryMethod.accountNumber,
        percentage_charge: paystackMainAccountPercentage(commissionRate),
      });

      if (subaccount && subaccount.subaccount_code) {
        await this.userModel.findByIdAndUpdate(userId, {
          paystackSubaccountCode: subaccount.subaccount_code,
          paystackBankCode: bankCode
        });
        this.logger.log(`Successfully synced Paystack subaccount ${subaccount.subaccount_code} for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Paystack Subaccount Sync Error for user ${userId}: ${error.response?.data?.message || error.message}`);
    }
  }

  /** Creates a referee's Paystack payout subaccount once approved (mirrors syncVendorSubaccount). */
  async syncRefereeSubaccount(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || user.role !== 'referee') return;

    if (user.paystackSubaccountCode) {
      this.logger.log(
        `Referee ${userId} already has Paystack subaccount ${user.paystackSubaccountCode}; skipping sync`,
      );
      return;
    }

    const primaryMethod = user.paymentMethods?.[0];
    if (!primaryMethod || !primaryMethod.accountNumber) {
      this.logger.warn(`No payout method found for referee ${userId}. Cannot sync subaccount.`);
      return;
    }

    try {
      const bankMapping: Record<string, string> = {
        MTN: 'MTN',
        Vodafone: 'VOD',
        AirtelTigo: 'ATL',
        GCB: '040100',
        ECO: '030100',
        ZEN: '060101',
        ABS: '020100',
        FID: '070101',
        STA: '010100',
        CAL: '050100',
        ACC: '090101',
        GTB: '080100',
        UBA: '100100',
      };
      const bankCode = bankMapping[primaryMethod.network] || primaryMethod.network;

      this.logger.log(`Creating Paystack subaccount for referee: ${user.name}...`);

      // percentage_charge is irrelevant here — the referee's share is set per-transaction
      // by the dynamic Transaction Split created at order time, not by this subaccount's own rate.
      const subaccount = await this.paystackService.createSubaccount({
        business_name: user.name,
        settlement_bank: bankCode,
        account_number: primaryMethod.accountNumber,
        percentage_charge: 0,
      });

      if (subaccount && subaccount.subaccount_code) {
        await this.userModel.findByIdAndUpdate(userId, {
          paystackSubaccountCode: subaccount.subaccount_code,
          paystackBankCode: bankCode,
        });
        this.logger.log(`Successfully synced Paystack subaccount ${subaccount.subaccount_code} for referee ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Paystack Subaccount Sync Error for referee ${userId}: ${error.response?.data?.message || error.message}`);
    }
  }

  async approveRefereeForPayouts(id: string): Promise<User | null> {
    const existing = await this.userModel.findById(id).exec();
    if (!existing || existing.role !== 'referee') {
      throw new NotFoundException('Referee not found');
    }

    if (!existing.ghanaCardFront?.trim() || !existing.selfie?.trim()) {
      throw new BadRequestException(
        'Referee has not uploaded a Ghana Card and selfie. They cannot be approved without identity documents.',
      );
    }

    const user = (await this.userModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'active',
            kycApprovedAt: new Date(),
            verificationStatus: 'verified',
            isIdentityVerified: true,
            isVerified: true,
          },
        },
        { new: true },
      )
      .lean()
      .exec()) as unknown as User;

    // Only admin approval creates/links the referee's Paystack payout subaccount
    this.syncRefereeSubaccount(id).catch((err) =>
      this.logger.error(`Paystack sync on referee approve: ${err.message}`),
    );

    if ((user as any)?.phone) {
      const loginUrl = getFrontendBaseUrl();
      const slug = (user as any).refereeStoreSlug;
      const storeBit = slug ? ` Your store: ${loginUrl}/ref/${slug}` : '';
      this.sendRegistrationSms(
        (user as any).phone,
        `Great news ${(user as any).name}! Your FLA referee application is approved.${storeBit} Start picking products to earn commission.`,
        'referee-kyc-approved',
      );
    }

    return this.userModel.findById(id).lean().exec() as unknown as User;
  }

  async findPendingReferees(): Promise<User[]> {
    const referees = await this.userModel
      .find({
        role: 'referee',
        $or: [
          { status: 'pending' },
          {
            kycSubmittedAt: { $exists: true, $ne: null },
            $or: [{ kycApprovedAt: { $exists: false } }, { kycApprovedAt: null }],
          },
        ],
      })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .lean()
      .exec();
    return referees.map((v) => this.mapVendorKycRecord(v));
  }

  async findKycReferees(status?: 'pending' | 'active' | 'rejected' | 'banned' | 'all'): Promise<User[]> {
    const filter: Record<string, unknown> = { role: 'referee' };
    if (status === 'pending') {
      filter.$or = [
        { status: 'pending' },
        {
          kycSubmittedAt: { $exists: true, $ne: null },
          $or: [{ kycApprovedAt: { $exists: false } }, { kycApprovedAt: null }],
        },
      ];
    } else if (status === 'active') {
      filter.kycApprovedAt = { $exists: true, $ne: null };
      filter.status = 'active';
    } else if (status && status !== 'all') {
      filter.status = status;
    }
    const referees = await this.userModel
      .find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return referees.map((v) => this.mapVendorKycRecord(v));
  }

  /** Fix existing Paystack subaccounts that were created with 0% platform / 100% vendor split. */
  async resyncAllVendorPaystackSplits(): Promise<{
    total: number;
    updated: number;
    skipped: number;
    failed: Array<{ vendorId: string; code: string; error: string }>;
  }> {
    const rate = await this.getPlatformCommissionRate();
    const vendors = await this.userModel
      .find({ role: 'vendor', paystackSubaccountCode: { $exists: true, $ne: null } })
      .select('_id paystackSubaccountCode shopName')
      .exec();

    let updated = 0;
    let skipped = 0;
    const failed: Array<{ vendorId: string; code: string; error: string }> = [];

    for (const vendor of vendors) {
      const code = vendor.paystackSubaccountCode;
      if (!code) {
        skipped++;
        continue;
      }
      try {
        await this.paystackService.updateSubaccount(code, { percentage_charge: rate });
        updated++;
      } catch (error: any) {
        failed.push({
          vendorId: vendor._id.toString(),
          code,
          error: error.response?.data?.message || error.message,
        });
      }
    }

    this.logger.log(
      `Paystack split resync (${rate}% admin): ${updated} updated, ${skipped} skipped, ${failed.length} failed`,
    );

    return { total: vendors.length, updated, skipped, failed };
  }

  async findByUniqueVendorId(vendorId: string): Promise<User | null> {
    return this.userModel.findOne({ uniqueVendorId: vendorId }).lean().exec() as unknown as User;
  }

  async remove(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    }).exec();
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { password: hashedPassword },
      $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
    }).exec();
  }

  async clearKycApproval(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $unset: { kycApprovedAt: 1 },
      $set: { verificationStatus: 'pending', isIdentityVerified: false },
    }).exec();
  }

  async setMustChangePassword(userId: string, value: boolean): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $set: { mustChangePassword: value } }).exec();
  }

  async applyVendorSubscription(
    userId: string,
    data: {
      status?: string;
      isEmailVerified?: boolean;
      subscriptionPlan?: string;
      subscriptionLabel?: string;
      subscriptionPriceText?: string;
      subscriptionPriceGhs?: number;
      subscriptionStartsAt?: Date;
      subscriptionEndsAt?: Date | null;
      subscriptionPaymentRequired?: boolean;
      verificationStatus?: string;
      isIdentityVerified?: boolean;
    },
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $set: data }).exec();
  }

  async renewVendorSubscription(
    vendorId: string,
    opts?: { months?: number; amountGhs?: number; note?: string },
  ) {
    const existing = await this.userModel.findById(vendorId).exec();
    if (!existing || existing.role !== 'vendor') {
      throw new NotFoundException('Vendor not found');
    }

    const months = Math.max(1, Math.min(12, Number(opts?.months) || 1));
    const now = new Date();
    const currentEnds = existing.subscriptionEndsAt
      ? new Date(existing.subscriptionEndsAt)
      : now;
    const base = currentEnds.getTime() > now.getTime() ? currentEnds : now;
    let endsAt = base;
    for (let i = 0; i < months; i++) {
      endsAt = addDays(endsAt, FLA_CONSTANTS.SUBSCRIPTION_PERIOD_DAYS);
    }

    const amount =
      typeof opts?.amountGhs === 'number' && opts.amountGhs > 0
        ? opts.amountGhs
        : FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS * months;

    const update = {
      subscriptionPlan: 'monthly',
      subscriptionLabel: 'Monthly sales plan',
      subscriptionPriceText: `GHS ${FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS} / month`,
      subscriptionPriceGhs: FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS,
      subscriptionEndsAt: endsAt,
      subscriptionLastPaidAt: now,
      subscriptionLastPaidAmount: amount,
      subscriptionPaymentRequired: false,
      ...(opts?.note ? { subscriptionLastPaidNote: opts.note } : {}),
    };

    const user = await this.userModel
      .findByIdAndUpdate(
        vendorId,
        { $set: update, $unset: { lastSubscriptionReminderDate: 1 } },
        { new: true },
      )
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .lean()
      .exec();

    if ((user as any)?.phone) {
      const shop = (user as any).shopName || (user as any).name;
      this.sendRegistrationSms(
        (user as any).phone,
        `FLA: Subscription renewed for ${shop}. Valid until ${endsAt.toLocaleDateString()}. Thank you.`,
        'vendor-subscription-renewed',
      );
    }

    return {
      renewed: true,
      subscriptionEndsAt: endsAt,
      amountPaid: amount,
      vendor: user,
    };
  }

  /** Daily cron: remind vendors in the last N days before subscription ends. */
  async sendSubscriptionReminders(): Promise<{ reminded: number }> {
    const now = new Date();
    const today = startOfDayIsoDate(now);
    const windowEnd = addDays(now, FLA_CONSTANTS.SUBSCRIPTION_REMINDER_DAYS);

    const vendors = await this.userModel
      .find({
        role: 'vendor',
        status: 'active',
        subscriptionEndsAt: { $gt: now, $lte: windowEnd },
        $or: [
          { lastSubscriptionReminderDate: { $exists: false } },
          { lastSubscriptionReminderDate: null },
          { lastSubscriptionReminderDate: { $ne: today } },
        ],
      })
      .select(
        'name shopName email phone subscriptionEndsAt subscriptionPlan subscriptionPriceGhs subscriptionPriceText lastSubscriptionReminderDate',
      )
      .lean()
      .exec();

    let reminded = 0;
    for (const v of vendors) {
      const daysLeft = daysUntilSubscriptionEnd(v as any, now);
      if (daysLeft == null || daysLeft < 1 || daysLeft > FLA_CONSTANTS.SUBSCRIPTION_REMINDER_DAYS) {
        continue;
      }
      const amount = amountDueForRenewal(v as any);
      const shop = (v as any).shopName || (v as any).name || 'Vendor';
      const payBit = ` Pay GHS ${amount} via Paystack in your vendor dashboard to renew.`;
      const msg = `FLA reminder: ${shop} subscription ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.${payBit} After due date you cannot upload new products.`;

      if ((v as any).phone) {
        await this.smsService.sendSms((v as any).phone, msg).catch((err) =>
          this.logger.error(`Subscription SMS failed: ${err.message}`),
        );
      }
      if ((v as any).email) {
        await this.emailService
          .sendGenericNotification(
            (v as any).email,
            (v as any).name || shop,
            `FLA subscription reminder — ${daysLeft} day(s) left`,
            msg,
          )
          .catch((err) => this.logger.error(`Subscription email failed: ${err.message}`));
      }

      await this.userModel
        .findByIdAndUpdate((v as any)._id, {
          $set: { lastSubscriptionReminderDate: today },
        })
        .exec();
      reminded += 1;
    }

    // One-time expired notice: ended in last 24h and not reminded today
    const yesterday = addDays(now, -1);
    const expired = await this.userModel
      .find({
        role: 'vendor',
        status: 'active',
        subscriptionEndsAt: { $gt: yesterday, $lte: now },
        $or: [
          { lastSubscriptionReminderDate: { $exists: false } },
          { lastSubscriptionReminderDate: null },
          { lastSubscriptionReminderDate: { $ne: today } },
        ],
      })
      .select('name shopName email phone subscriptionPlan subscriptionPriceGhs')
      .lean()
      .exec();

    for (const v of expired) {
      const amount = FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS;
      const shop = (v as any).shopName || (v as any).name || 'Vendor';
      const payBit = ` Pay GHS ${amount} via Paystack in your vendor dashboard to unlock uploads.`;
      const msg = `FLA: ${shop} subscription has ended. You can still sell existing products but cannot upload new ones until renewed.${payBit}`;

      if ((v as any).phone) {
        await this.smsService.sendSms((v as any).phone, msg).catch((err) =>
          this.logger.error(`Expired sub SMS failed: ${err.message}`),
        );
      }
      if ((v as any).email) {
        await this.emailService
          .sendGenericNotification(
            (v as any).email,
            (v as any).name || shop,
            'FLA subscription ended — renew to upload products',
            msg,
          )
          .catch((err) => this.logger.error(`Expired sub email failed: ${err.message}`));
      }
      await this.userModel
        .findByIdAndUpdate((v as any)._id, {
          $set: { lastSubscriptionReminderDate: today },
        })
        .exec();
      reminded += 1;
    }

    if (reminded > 0) {
      this.logger.log(`Subscription reminders sent: ${reminded}`);
    }
    return { reminded };
  }

  async getAgreementLetterData(vendorId: string) {
    const user = await this.userModel
      .findById(vendorId)
      .select('-password -paymentMethods -withdrawalHistory -resetPasswordToken -resetPasswordExpires')
      .lean()
      .exec();
    if (!user || (user as any).role !== 'vendor') {
      throw new NotFoundException('Vendor not found');
    }
    return {
      vendor: user,
      generatedAt: new Date().toISOString(),
      platform: {
        name: 'FLA Purchase',
        legalName: 'FLA Logistics',
        website: getFrontendBaseUrl(),
      },
    };
  }

  async generateAgreementPdf(vendorId: string): Promise<{ buffer: Buffer; filename: string; data: any }> {
    const data = await this.getAgreementLetterData(vendorId);
    const buffer = await buildVendorAgreementPdfBuffer(data);
    const filename = agreementPdfFilename(data.vendor);
    return { buffer, filename, data };
  }

  async sendAgreementPdfToVendor(vendorId: string): Promise<{ sent: boolean; email: string; filename: string }> {
    const { buffer, filename, data } = await this.generateAgreementPdf(vendorId);
    const vendor = data.vendor;
    if (!vendor?.email) {
      throw new NotFoundException('Vendor email not found');
    }
    await this.emailService.sendVendorAgreementEmail(
      vendor.email,
      vendor.name || 'Vendor',
      vendor.shopName || vendor.name || 'FLA Studio',
      buffer,
      filename,
    );
    return { sent: true, email: vendor.email, filename };
  }

  async approveVendorKycForSelling(id: string): Promise<User | null> {
    const existing = await this.userModel.findById(id).exec();
    if (!existing || existing.role !== 'vendor') {
      throw new NotFoundException('Vendor not found');
    }

    if (!existing.businessRegistration?.trim()) {
      throw new BadRequestException(
        'Vendor has not uploaded a Business Registration Certificate. They cannot be cleared to sell without business registration documents.',
      );
    }

    const update: Record<string, unknown> = {
      status: 'active',
      kycApprovedAt: new Date(),
      verificationStatus: 'verified',
      isIdentityVerified: true,
      isVerified: true,
    };
    if (existing.businessRegistration?.trim()) {
      update.vendorTier = 'high';
    }
    // Free entry — approval grants full, permanent selling access immediately.
    Object.assign(update, introSubscriptionFields());

    const user = (await this.userModel
      .findByIdAndUpdate(
        id,
        {
          $set: update,
          $unset: { subscriptionEndsAt: 1, subscriptionStartsAt: 1 },
        },
        { new: true },
      )
      .lean()
      .exec()) as unknown as User;

    await this.ensureStoreSlug(id, (user as any)?.shopName || (user as any)?.name).catch((err) =>
      this.logger.error(`storeSlug on KYC approve: ${err.message}`),
    );
    // Only admin approve creates/links the Paystack payout subaccount
    this.syncVendorSubaccount(id).catch((err) =>
      this.logger.error(`Paystack sync on KYC approve: ${err.message}`),
    );

    if ((user as any)?.phone) {
      const loginUrl = getFrontendBaseUrl();
      const shop = (user as any).shopName || (user as any).name;
      const slug = (user as any).storeSlug;
      const storeBit = slug ? ` Your store: ${loginUrl}/store/${slug}` : '';
      this.sendRegistrationSms(
        (user as any).phone,
        `Great news ${shop}! Your FLA documents are approved — you can upload products and start selling now, free of charge.${storeBit}`,
        'vendor-kyc-approved-sell',
      );
    }

    return this.userModel.findById(id).lean().exec() as unknown as User;
  }

  /** Activate/extend subscription after successful Paystack payment (webhook or verify). */
  async activateSubscriptionFromPayment(
    vendorId: string,
    opts?: { amountGhs?: number; reference?: string },
  ) {
    const existing = await this.userModel.findById(vendorId).exec();
    if (!existing || existing.role !== 'vendor') {
      throw new NotFoundException('Vendor not found');
    }

    if (
      opts?.reference &&
      existing.subscriptionLastPaidNote &&
      String(existing.subscriptionLastPaidNote).includes(opts.reference)
    ) {
      const already = existing.toObject();
      return {
        activated: true,
        alreadyProcessed: true,
        subscriptionEndsAt: already.subscriptionEndsAt,
        amountPaid: already.subscriptionLastPaidAmount,
        vendor: { ...already, id: already._id?.toString?.() || vendorId },
      };
    }

    const fields = planFieldsAfterPayment(existing as any);
    if (typeof opts?.amountGhs === 'number' && opts.amountGhs > 0) {
      (fields as any).subscriptionLastPaidAmount = opts.amountGhs;
    }
    if (opts?.reference) {
      (fields as any).subscriptionLastPaidNote = `Paystack ${opts.reference}`;
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        vendorId,
        { $set: fields, $unset: { lastSubscriptionReminderDate: 1 } },
        { new: true },
      )
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .lean()
      .exec();

    if ((user as any)?.phone) {
      const shop = (user as any).shopName || (user as any).name;
      const ends = (user as any).subscriptionEndsAt
        ? new Date((user as any).subscriptionEndsAt).toLocaleDateString()
        : '';
      this.sendRegistrationSms(
        (user as any).phone,
        `FLA: Subscription active for ${shop}${ends ? ` until ${ends}` : ''}. You can upload products now.`,
        'vendor-subscription-paystack',
      );
    }

    return {
      activated: true,
      subscriptionEndsAt: (user as any)?.subscriptionEndsAt,
      amountPaid: (fields as any).subscriptionLastPaidAmount,
      vendor: { ...(user as any), id: (user as any)?._id?.toString?.() || vendorId },
    };
  }

  async getPublicVendorProfile(vendorId: string) {
    const user = await this.userModel.findById(vendorId)
      .select('-password -paymentMethods -withdrawalHistory')
      .exec();
    if (!user) {
      throw new NotFoundException('Vendor not found');
    }

    if (user.role === 'vendor' && !user.uniqueVendorId) {
      const uniqueId = `FLA-V-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      user.uniqueVendorId = uniqueId;
      await this.userModel.findByIdAndUpdate(vendorId, { uniqueVendorId: uniqueId });
    }

    if (user.role === 'vendor' && user.status === 'active' && !user.storeSlug) {
      await this.ensureStoreSlug(vendorId, user.shopName || user.name);
      const refreshed = await this.userModel.findById(vendorId)
        .select('-password -paymentMethods -withdrawalHistory')
        .exec();
      const stats = await this.ordersService.getVendorStats(vendorId);
      return { vendor: refreshed || user, stats };
    }

    const stats = await this.ordersService.getVendorStats(vendorId);
    return { vendor: user, stats };
  }

  private mapVendorKycRecord(v: any): User {
    return {
      ...v,
      isIdentityVerified: Boolean(
        v.ghanaCardFront &&
          v.selfie &&
          v.verificationStatus === 'verified' &&
          (v.isVerified || v.isIdentityVerified),
      ),
    } as unknown as User;
  }

  async findPendingVendors(): Promise<User[]> {
    const vendors = await this.userModel
      .find({
        role: 'vendor',
        $or: [
          { status: 'pending' },
          {
            kycSubmittedAt: { $exists: true, $ne: null },
            $or: [{ kycApprovedAt: { $exists: false } }, { kycApprovedAt: null }],
          },
        ],
      })
      .lean()
      .exec();
    return vendors.map((v) => this.mapVendorKycRecord(v));
  }

  async findKycVendors(status?: 'pending' | 'active' | 'rejected' | 'banned' | 'all'): Promise<User[]> {
    const filter: Record<string, unknown> = { role: 'vendor' };
    if (status === 'pending') {
      filter.$or = [
        { status: 'pending' },
        {
          kycSubmittedAt: { $exists: true, $ne: null },
          $or: [{ kycApprovedAt: { $exists: false } }, { kycApprovedAt: null }],
        },
      ];
    } else if (status === 'active') {
      // Cleared to sell
      filter.kycApprovedAt = { $exists: true, $ne: null };
      filter.status = 'active';
    } else if (status && status !== 'all') {
      filter.status = status;
    }
    const vendors = await this.userModel
      .find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return vendors.map((v) => this.mapVendorKycRecord(v));
  }

  async updateStatus(id: string, status: 'active' | 'rejected' | 'pending' | 'banned'): Promise<User | null> {
    if (status === 'active') {
      const target = await this.userModel.findById(id).select('role').lean().exec();
      if ((target as any)?.role === 'referee') {
        return this.approveRefereeForPayouts(id);
      }
      // Approving shop = unlock selling + start-selling SMS
      return this.approveVendorKycForSelling(id);
    }

    const existing = await this.userModel.findById(id).exec();
    const update: Record<string, unknown> = { status };
    if (existing?.role === 'vendor' && existing.businessRegistration?.trim()) {
      update.vendorTier = 'high';
    }
    const user = await this.userModel.findByIdAndUpdate(id, { $set: update }, { new: true }).lean().exec() as unknown as User;

    if (user) {
        try {
            if (status === 'rejected' && (user.role === 'vendor' || user.role === 'referee')) {
                if (user.email) {
                    this.emailService.sendGenericNotification(
                        user.email,
                        user.name,
                        'Studio Verification Update',
                        'We regret to inform you that your studio application has been declined. Please ensure your KYC documents are clear and valid before trying again.'
                    ).catch(err => this.logger.error(err.message));
                }
            } else if (status === 'banned') {
                if (user.email) {
                    this.emailService.sendGenericNotification(
                        user.email,
                        user.name,
                        'Account Status Update',
                        'Your account has been suspended due to a violation of our platform policies. Please contact support if you believe this is an error.'
                    ).catch(err => this.logger.error(err.message));
                }
            }
        } catch (error) {
            this.logger.error(`Failed to send status update notification: ${error.message}`);
        }
    }
    
    return user;
  }
}
