import { Injectable, Logger, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { OtpService } from '../otp/otp.service';
import { SmsService } from '../common/sms.service';
import {
  introSubscriptionFields,
  monthlySubscriptionFields,
} from '../users/vendor-subscription.util';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private otpService: OtpService,
    private smsService: SmsService,
  ) { }

  private maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    return `${name.substring(0, 1)}***@${domain}`;
  }

  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return 'your phone';
    return `***${digits.slice(-4)}`;
  }

  async validateUser(email: string, pass: string): Promise<any> {
    this.logger.debug(`Validating user: ${email}`);
    const user = await this.usersService.findOne(email);
    if (!user) {
      this.logger.warn(`User not found during validation attempt: ${email}`);
      return null;
    }

    if (!user.password) {
      this.logger.warn(`User has no password set: ${email}`);
      return null;
    }
    
    const isMatch = await bcrypt.compare(pass, user.password);
    this.logger.debug(`Password match for ${email}: ${isMatch}`);

    if (isMatch) {
      const userObj = (user as any).toObject();
      const { password, ...result } = userObj;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username || user.email, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: this.mapPublicUser(user),
    };
  }

  /** Safe user payload for client session restore (no password). */
  mapPublicUser(user: any) {
    const id = user._id?.toString?.() || user.id;
    return {
      id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      location: user.location,
      address: user.address,
      profileImage: user.profileImage,
      bannerImage: user.bannerImage,
      shopName: user.shopName,
      paymentMethods: user.paymentMethods,
      bio: user.bio,
      productTypes: user.productTypes,
      storeAccentColor: user.storeAccentColor,
      storeThemeColor: user.storeThemeColor,
      momoNumber: user.momoNumber,
      accountName: user.accountName,
      status: user.status,
      region: user.region,
      uniqueVendorId: user.uniqueVendorId,
      storeSlug: user.storeSlug,
      mustChangePassword: Boolean(user.mustChangePassword),
      kycApprovedAt: user.kycApprovedAt,
      kycSubmittedAt: user.kycSubmittedAt,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionLabel: user.subscriptionLabel,
      subscriptionPriceText: user.subscriptionPriceText,
      subscriptionPriceGhs: user.subscriptionPriceGhs,
      subscriptionStartsAt: user.subscriptionStartsAt,
      subscriptionEndsAt: user.subscriptionEndsAt,
      subscriptionPaymentRequired: Boolean(user.subscriptionPaymentRequired),
      subscriptionLastPaidAt: user.subscriptionLastPaidAt,
      walletBalance: user.walletBalance,
      pendingBalance: user.pendingBalance,
      ghanaCardFront: user.ghanaCardFront,
      ghanaCardBack: user.ghanaCardBack,
      selfie: user.selfie,
      utilityBill: user.utilityBill,
      utilityType: user.utilityType,
      businessRegistration: user.businessRegistration,
      digitalAddress: user.digitalAddress,
      dob: user.dob,
      employeeCount: user.employeeCount,
      yearsOfExistence: user.yearsOfExistence,
      vendorTier: user.vendorTier,
      termsAcceptedAt: user.termsAcceptedAt,
      termsVersion: user.termsVersion,
    };
  }

  async getSessionForUser(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('Session invalid');
    }
    const raw = user as any;
    return this.mapPublicUser(raw);
  }

  issueAccessToken(user: { id: string; email: string; role: string }) {
    const payload = { username: user.email, sub: user.id, role: user.role };
    return this.jwtService.sign(payload);
  }

  async acceptTerms(userId: string, version: string) {
    const updated = await this.usersService.update(userId, {
      termsAcceptedAt: new Date(),
      termsVersion: version,
    } as any);
    const userObj = (updated as any)?.toObject ? (updated as any).toObject() : updated;
    const { password: _pw, ...safe } = userObj;
    return safe;
  }

  private toSafeUser(user: any) {
    const userObj = user?.toObject ? user.toObject() : user;
    const { password: _pw, ...safeUser } = userObj;
    return safeUser;
  }

  private buildRegisterResponse(user: any, otpSent: boolean, resumed = false) {
    const safeUser = this.toSafeUser(user);
    const message = 'Account created successfully. A confirmation SMS has been sent to your phone.';

    return {
      user: safeUser,
      requiresEmailVerification: false,
      otpSent: true,
      message,
    };
  }

  async register(userData: any) {
    let createdUser: any = null;

    try {
      const normalizedEmail = userData.email?.toLowerCase().trim();
      const existing = normalizedEmail ? await this.usersService.findOne(normalizedEmail) : null;

      if (existing) {
        throw new ConflictException(
          existing.role === 'vendor'
            ? 'This email is already registered. Please sign in to your studio account.'
            : 'Email address already exists. Please sign in or use a different email.',
        );
      }

      createdUser = await this.usersService.create(userData);

      // Identity verification is handled by Shufti Pro (see UsersService.create) — not Smile ID

      return this.buildRegisterResponse(createdUser, true);
    } catch (error) {
      // Account may already exist in DB (SMS sent) even if a post-create step failed
      if (createdUser) {
        this.logger.error(
          `Registration post-create error for ${createdUser.email}; returning success: ${error.message}`,
        );
        return this.buildRegisterResponse(createdUser, false);
      }
      throw error;
    }
  }

  async sendVendorOTP(phone: string, name?: string): Promise<void> {
    const user = await this.usersService.findByPhone(phone);

    if (!user?.phone) {
      throw new Error('No vendor account found for this phone number.');
    }

    const otpKey = this.otpService.normalizePhone(user.phone);
    if (!otpKey) {
      throw new Error('Invalid phone number on this account.');
    }

    const otp = this.otpService.generateOTP();
    await this.otpService.storeOTP('phone', otpKey, otp);

    const displayName = name || user.shopName || user.name || 'Vendor';
    const smsMessage =
      `FLA Purchase: Hi ${displayName}, your studio verification code is ${otp}. Valid for 10 minutes. Do not share this code.`;

    const smsSent = await this.smsService.sendOtpSms(user.phone, smsMessage);
    if (!smsSent) {
      const detail = this.smsService.lastError || 'Unknown mNotify error';
      throw new Error(`Verification SMS could not be sent. ${detail}`);
    }

    this.logger.log(`Vendor OTP SMS sent to ${this.maskPhone(user.phone)}`);
  }

  async verifyVendorOTP(phone: string, code: string): Promise<boolean> {
    const user = await this.usersService.findByPhone(phone);
    if (!user?.phone) {
      return false;
    }

    const otpKey = this.otpService.normalizePhone(user.phone);
    const isValid = await this.otpService.verifyOTP('phone', otpKey, code);

    if (isValid) {
      await this.usersService.update((user as any)._id.toString(), { isEmailVerified: true } as any);
      const shopName = user.shopName || user.name || 'Your Studio';
      await this.emailService.sendWelcomeEmail(
        user.email,
        user.name || 'Vendor',
        shopName,
      );

      const namePart = user.shopName || user.name || 'Vendor';
      const welcomeMsg =
        `Welcome to FLA, ${namePart}! Your studio account has been created and verified. Your application is under review — we'll notify you once approved.`;
      await this.smsService.sendSms(user.phone, welcomeMsg);

      await this.otpService.deleteOTP('phone', otpKey);
    }
    return isValid;
  }

  async resendVendorOTP(phone: string): Promise<void> {
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new Error('No vendor account found for this phone number.');
    }
    await this.sendVendorOTP(phone, user.name || user.shopName || 'Vendor');
  }

  async adminCreateVendor(userData: any) {
    const rawPassword =
      userData.password ||
      `Fla${crypto.randomBytes(3).toString('hex')}${Math.floor(100 + Math.random() * 900)}`;

    const plan: 'intro' | 'monthly' =
      userData.subscriptionPlan === 'monthly' ? 'monthly' : 'intro';
    const intro = introSubscriptionFields();
    const startsAt = userData.subscriptionStartsAt
      ? new Date(userData.subscriptionStartsAt)
      : intro.subscriptionStartsAt;
    const endsAt = userData.subscriptionEndsAt
      ? new Date(userData.subscriptionEndsAt)
      : plan === 'monthly'
        ? monthlySubscriptionFields(startsAt).subscriptionEndsAt
        : intro.subscriptionEndsAt;

    const subscriptionLabel =
      userData.subscriptionLabel ||
      (plan === 'monthly' ? 'Monthly Partner Plan' : 'Intro month');
    const subscriptionPriceText =
      userData.subscriptionPriceText ||
      (plan === 'monthly' ? 'GHS 50 / month' : 'GHS 10 / 30 days');
    const subscriptionPriceGhs =
      typeof userData.subscriptionPriceGhs === 'number'
        ? userData.subscriptionPriceGhs
        : plan === 'monthly'
          ? 50
          : 10;

    // Slim onboard — no KYC docs at admin create time
    const user = (await this.usersService.create({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      location: userData.location,
      region: userData.region,
      password: rawPassword,
      role: 'vendor',
      shopName: userData.shopName,
      productTypes: userData.productTypes,
      paymentMethods: userData.paymentMethods,
      bio: userData.bio,
      profileImage: userData.profileImage,
      accountName: userData.accountName,
      momoNumber: userData.momoNumber || userData.paymentMethods?.[0]?.accountNumber,
    })) as any;

    await this.usersService.applyVendorSubscription(user._id.toString(), {
      status: 'active',
      isEmailVerified: true,
      subscriptionPlan: plan,
      subscriptionLabel,
      subscriptionPriceText,
      subscriptionPriceGhs,
      subscriptionStartsAt: startsAt,
      subscriptionEndsAt: endsAt,
      subscriptionPaymentRequired: false,
      verificationStatus: 'pending',
      isIdentityVerified: false,
    });

    await this.usersService.setMustChangePassword(user._id.toString(), true);
    await this.usersService.clearKycApproval(user._id.toString()).catch(() => undefined);

    await this.usersService
      .ensureStoreSlug(user._id.toString(), userData.shopName || userData.name)
      .catch((err) => this.logger.error(`storeSlug on admin create: ${err.message}`));

    // Paystack subaccount is created only when admin taps KYC Approve — not at onboard.

    const loginUrl =
      process.env.FRONTEND_URL?.replace(/\/$/, '') ||
      'https://flamingo-store1.com';
    const authUrl = `${loginUrl}/auth?view=login&role=vendor`;

    await this.emailService
      .sendVendorCredentialsEmail(
        user.email,
        user.name || 'Vendor',
        rawPassword,
        user.shopName || 'FLA Studio',
      )
      .catch((err) => this.logger.error(`Credentials email failed: ${err.message}`));

    if (user.phone) {
      const smsMessage = `Welcome to FLA, ${user.shopName || user.name}! Login: ${authUrl} Email: ${user.email} Temp password: ${rawPassword} — change it after login.`;
      await this.smsService
        .sendSms(user.phone, smsMessage)
        .catch((err) =>
          this.logger.error(`Failed to send SMS to admin-created vendor: ${err.message}`),
        );
    }

    const refreshed = await this.usersService.findOneById(user._id.toString());
    return {
      user: this.mapPublicUser(refreshed || user),
      temporaryPassword: rawPassword,
      loginUrl: authUrl,
      agreementPath: `/admin/vendors/${user._id}/agreement`,
      agreementEmailed: false,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const doc = await this.usersService.findOne((user as any).email);
    if (!doc?.password) throw new UnauthorizedException('Invalid account');

    // Allow skipping current password check when mustChangePassword (temp password flow)
    if (!(user as any).mustChangePassword) {
      const ok = await bcrypt.compare(currentPassword, doc.password);
      if (!ok) throw new UnauthorizedException('Current password is incorrect');
    } else if (currentPassword) {
      const ok = await bcrypt.compare(currentPassword, doc.password);
      if (!ok) throw new UnauthorizedException('Temporary password is incorrect');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new ConflictException('New password must be at least 8 characters');
    }

    await this.usersService.updatePassword(userId, newPassword);
    await this.usersService.setMustChangePassword(userId, false);
    const updated = await this.usersService.findOneById(userId);
    return this.mapPublicUser(updated);
  }

  async forgotPassword(email: string): Promise<void> {
    this.logger.log(`ForgotPassword: Request received for: ${this.maskEmail(email)}`);
    const user = await this.usersService.findOne(email);
    if (!user) {
      // Don't leak whether a user exists or not (security best practice)
      this.logger.warn(`ForgotPassword: No user found for: ${this.maskEmail(email)} — returning silently`);
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token valid for 1 hour

    this.logger.log(`ForgotPassword: Saving reset token for user: ${this.maskEmail(user.email)}`);
    await this.usersService.update((user as any)._id.toString(), {
      resetPasswordToken: token,
      resetPasswordExpires: expires
    } as any);

    try {
      await this.emailService.sendPasswordResetEmail(user.email, user.name || 'User', token);
    } catch (emailError) {
      this.logger.error(`ForgotPassword: FAILED to send email to ${this.maskEmail(user.email)}: ${emailError.message}`);
      // Rethrow so the controller can return a meaningful error
      throw new Error('Failed to send password reset email. Please try again later.');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    await this.usersService.updatePassword(user._id.toString(), newPassword);
  }

  async forgotPasswordOTP(email: string): Promise<void> {
    this.logger.log(`ForgotPassword: OTP Request for: ${this.maskEmail(email)}`);
    const user = await this.usersService.findOne(email);
    if (!user) {
      this.logger.warn(`ForgotPassword: No user found with email: ${this.maskEmail(email)}`);
      // Security best practice: don't leak user existence
      return;
    }

    this.logger.log(`ForgotPassword: User found: ${user.name}. Generating OTP...`);
    const otp = this.otpService.generateOTP();
    await this.otpService.storeOTP('email', email, otp);

    try {
      await this.emailService.sendPasswordResetOTP(email, user.name || 'User', otp);
      this.logger.log(`ForgotPassword: OTP email triggered for: ${this.maskEmail(email)}`);
    } catch (error) {
      this.logger.error(`ForgotPassword: Failed to trigger email: ${error.message}`);
      throw error;
    }
  }

  async resetPasswordWithOTP(email: string, code: string, newPassword: string): Promise<void> {
    const isValid = await this.otpService.verifyOTP('email', email, code);
    if (!isValid) {
      throw new Error('Invalid or expired verification code');
    }

    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new Error('User not found');
    }

    await this.usersService.updatePassword((user as any)._id.toString(), newPassword);
    await this.otpService.deleteOTP('email', email);
  }
}
