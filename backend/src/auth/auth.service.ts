import { Injectable, Logger, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { OtpService } from '../otp/otp.service';
import { SmsService } from '../common/sms.service';
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
      if (user.role === 'vendor' && !user.isEmailVerified) {
        throw new UnauthorizedException(
          'Please verify your studio account first. Check your phone for the 4-digit SMS code, or use Resend on the verification screen.',
        );
      }
      const userObj = (user as any).toObject();
      const { password, ...result } = userObj;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        location: user.location,
        address: user.address,
        profileImage: user.profileImage,
        shopName: user.shopName,
        paymentMethods: user.paymentMethods,
        bio: user.bio,
        productTypes: user.productTypes,
        momoNumber: user.momoNumber,
        accountName: user.accountName,
        status: user.status,
        region: user.region,
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
      }
    };
  }

  private toSafeUser(user: any) {
    const userObj = user?.toObject ? user.toObject() : user;
    const { password: _pw, ...safeUser } = userObj;
    return safeUser;
  }

  private buildRegisterResponse(user: any, otpSent: boolean, resumed = false) {
    const safeUser = this.toSafeUser(user);
    const phoneHint = user.phone ? this.maskPhone(user.phone) : 'your phone';
    const baseMessage = user.role === 'vendor'
      ? `A 4-digit verification code has been sent via SMS to ${phoneHint}. Enter it to complete your studio registration.`
      : 'Account created successfully. A confirmation SMS has been sent to your phone.';

    let message = baseMessage;
    if (resumed) {
      message =
        `This email is already registered but not verified. A new verification code has been sent via SMS to ${phoneHint}.`;
    } else if (user.role === 'vendor' && !otpSent) {
      message =
        'We could not send the verification SMS — tap Resend on the verification screen to try again.';
    }

    return {
      user: safeUser,
      requiresEmailVerification: user.role === 'vendor',
      message,
    };
  }

  async register(userData: any) {
    let createdUser: any = null;

    try {
      const normalizedEmail = userData.email?.toLowerCase().trim();
      const existing = normalizedEmail ? await this.usersService.findOne(normalizedEmail) : null;

      if (existing) {
        if (existing.role === 'vendor' && !existing.isEmailVerified) {
          if (userData.password) {
            await this.usersService.updatePassword((existing as any)._id.toString(), userData.password);
          }
          let otpSent = true;
          try {
            await this.sendVendorOTP(existing.email, existing.name || existing.shopName || 'Vendor');
          } catch (error) {
            otpSent = false;
            this.logger.error(
              `Failed to resend vendor OTP to ${this.maskEmail(existing.email)}: ${error.message}`,
            );
          }
          return this.buildRegisterResponse(existing, otpSent, true);
        }

        throw new ConflictException(
          existing.role === 'vendor'
            ? 'This email is already registered. Please sign in to your studio account.'
            : 'Email address already exists. Please sign in or use a different email.',
        );
      }

      createdUser = await this.usersService.create(userData);

      let vendorOtpSent = true;
      if (createdUser.role === 'vendor') {
        try {
          await this.sendVendorOTP(
            createdUser.email,
            createdUser.name || createdUser.shopName || 'Vendor',
          );
        } catch (error) {
          vendorOtpSent = false;
          this.logger.error(
            `Failed to send vendor OTP SMS to ${this.maskEmail(createdUser.email)}: ${error.message}`,
          );
        }
      }

      // Identity verification is handled by Shufti Pro (see UsersService.create) — not Smile ID

      return this.buildRegisterResponse(createdUser, vendorOtpSent);
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

  async sendVendorOTP(email: string, name: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersService.findOne(normalizedEmail);

    if (!user?.phone) {
      throw new Error('No phone number on this account. Cannot send verification code via SMS.');
    }

    const otp = this.otpService.generateOTP();
    await this.otpService.storeOTP(normalizedEmail, otp);

    const displayName = name || user.shopName || user.name || 'Vendor';
    const smsMessage =
      `FLA Purchase: Hi ${displayName}, your studio verification code is ${otp}. Valid for 10 minutes. Do not share this code.`;

    const smsSent = await this.smsService.sendOtpSms(user.phone, smsMessage);
    if (!smsSent) {
      throw new Error(
        'Verification SMS could not be sent. Check mNotify wallet balance and sender ID (FLAMINGO), or contact support@mnotify.com.',
      );
    }

    this.logger.log(
      `Vendor OTP SMS sent to ${this.maskPhone(user.phone)} for ${this.maskEmail(normalizedEmail)}`,
    );
  }

  async verifyVendorOTP(email: string, code: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const isValid = await this.otpService.verifyOTP(normalizedEmail, code);

    if (isValid) {
      const user = await this.usersService.findOne(normalizedEmail);
      if (user) {
        await this.usersService.update((user as any)._id.toString(), { isEmailVerified: true } as any);
        const shopName = user.shopName || user.name || 'Your Studio';
        await this.emailService.sendWelcomeEmail(normalizedEmail, user.name || 'Vendor', shopName);

        if (user.phone) {
          const namePart = user.shopName || user.name || 'Vendor';
          const welcomeMsg =
            `Welcome to FLA, ${namePart}! Your studio account has been created and verified. Your application is under review — we'll notify you once approved.`;
          await this.smsService.sendSms(user.phone, welcomeMsg);
        }
      }
      await this.otpService.deleteOTP(normalizedEmail);
    }
    return isValid;
  }

  async resendVendorOTP(email: string): Promise<void> {
    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new Error('User not found');
    }
    await this.sendVendorOTP(email, user.name || user.shopName || 'Vendor');
  }

  async adminCreateVendor(userData: any) {
    const { password } = userData;
    // Create the vendor account. Status will be 'active' because it's admin-created
    const user = await this.usersService.create({
      ...userData,
      role: 'vendor',
    }) as any;

    // Set status to active and mark email verified (admin-created)
    await this.usersService.update(user._id.toString(), { status: 'active', isEmailVerified: true } as any);

    // Send the credentials email with the raw password
    await this.emailService.sendVendorCredentialsEmail(user.email, user.name || 'Vendor', password, user.shopName || 'FLA Studio');

    // Send the welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name || 'Vendor', user.shopName || 'FLA Studio');

    // Send Notification Email
    if (user.email) {
        const message = `Welcome to FLA, ${user.shopName || user.name}! Your studio account is active. Check your email for login credentials.`;
        await this.emailService.sendGenericNotification(user.email, user.name || 'Vendor', 'Welcome to FLA Studio! 🚀', message);
    }

    return user;
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
    await this.otpService.storeOTP(email, otp);

    try {
      await this.emailService.sendPasswordResetOTP(email, user.name || 'User', otp);
      this.logger.log(`ForgotPassword: OTP email triggered for: ${this.maskEmail(email)}`);
    } catch (error) {
      this.logger.error(`ForgotPassword: Failed to trigger email: ${error.message}`);
      throw error;
    }
  }

  async resetPasswordWithOTP(email: string, code: string, newPassword: string): Promise<void> {
    const isValid = await this.otpService.verifyOTP(email, code);
    if (!isValid) {
      throw new Error('Invalid or expired verification code');
    }

    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new Error('User not found');
    }

    await this.usersService.updatePassword((user as any)._id.toString(), newPassword);
    await this.otpService.deleteOTP(email);
  }
}
