import { Injectable, ConflictException, InternalServerErrorException, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
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

import * as crypto from 'crypto';

// Rounds=8: ~25ms (vs 10 rounds=~100ms). Both are cryptographically secure.
const BCRYPT_ROUNDS = 8;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(TempVerification.name) private tempVerificationModel: Model<TempVerification>,
    @Inject(forwardRef(() => OrdersService)) private ordersService: OrdersService,
    private readonly paystackService: PaystackService,
    private readonly shuftiService: ShuftiService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) { }

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

      const vendorTier = (role === 'vendor' && createUserDto.businessRegistration) ? 'high' : 'low';

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
        isEmailVerified: role !== 'vendor',
        status: role === 'vendor' ? 'pending' : 'active'
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
          }
        }

        if (tempVerification) {
          await this.tempVerificationModel.deleteOne({ _id: tempVerification._id }).exec();
        }

        if (role === 'vendor') {
          this.syncVendorSubaccount(savedUser._id.toString()).catch(err => this.logger.error(err));

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

  async findOneById(id: string): Promise<User | null> {
    return this.userModel.findById(id).lean().exec() as unknown as User;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const updateData: any = { ...updateUserDto };
    
    // Auto-promote to high tier if business registration is provided
    if (updateData.businessRegistration) {
      updateData.vendorTier = 'high';
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean().exec() as unknown as User;
    
    // If payment methods were updated for a vendor, sync with Paystack
    if (updateData.paymentMethods && id) {
      this.syncVendorSubaccount(id).catch(err => this.logger.error(err));
    }

    return updatedUser;
  }

  async syncVendorSubaccount(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || user.role !== 'vendor') return;

    // Skip if subaccount already exists
    if (user.paystackSubaccountCode) {
        this.logger.log(`User ${userId} already has a Paystack subaccount: ${user.paystackSubaccountCode}. Skipping.`);
        return;
    }

    // Get primary payment method
    const primaryMethod = user.paymentMethods?.[0];
    if (!primaryMethod || !primaryMethod.accountNumber) {
        this.logger.warn(`No primary payment method found for vendor ${userId}. Cannot sync subaccount.`);
        return;
    }

    try {
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
        percentage_charge: 0, 
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

    const stats = await this.ordersService.getVendorStats(vendorId);
    return { vendor: user, stats };
  }

  async findPendingVendors(): Promise<User[]> {
    const vendors = await this.userModel.find({ role: 'vendor', status: 'pending' }).lean().exec();
    return vendors.map((v: any) => ({
      ...v,
      // Correct legacy Smile ID auto-verify flags — Shufti is the source of truth
      isIdentityVerified: Boolean(
        v.ghanaCardFront &&
          v.selfie &&
          v.verificationStatus === 'verified' &&
          (v.isVerified || v.isIdentityVerified),
      ),
    })) as unknown as User[];
  }

  async updateStatus(id: string, status: 'active' | 'rejected' | 'pending' | 'banned'): Promise<User | null> {
    const update: any = { status };
    // Shop approval is separate from Shufti identity verification — do not auto-set isIdentityVerified
    const user = await this.userModel.findByIdAndUpdate(id, { $set: update }, { new: true }).lean().exec() as unknown as User;
    
    if (user && user.email) {
        try {
            if (status === 'active' && user.role === 'vendor') {
                await this.emailService.sendWelcomeEmail(user.email, user.name, user.shopName || 'Your Studio');
            } else if (status === 'rejected' && user.role === 'vendor') {
                await this.emailService.sendGenericNotification(
                    user.email, 
                    user.name, 
                    'Studio Verification Update', 
                    'We regret to inform you that your studio application has been declined. Please ensure your KYC documents are clear and valid before trying again.'
                );
            } else if (status === 'banned') {
                await this.emailService.sendGenericNotification(
                    user.email,
                    user.name,
                    'Account Status Update',
                    'Your account has been suspended due to a violation of our platform policies. Please contact support if you believe this is an error.'
                );
            }
        } catch (emailError) {
            this.logger.error(`Failed to send status update email to ${user.email}: ${emailError.message}`);
        }
    }
    
    return user;
  }
}
