import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { OtpService } from '../otp/otp.service';
import { SmileIdService } from '../common/smileid.service';
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
    private smileIdService: SmileIdService
  ) { }

  private maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    return `${name.substring(0, 1)}***@${domain}`;
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
          'Please verify your email first. Check your inbox for the 4-digit code, or register again to receive a new one.',
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

  async register(userData: any) {
    const user = await this.usersService.create(userData);
    
    // Auto-trigger Identity Verification if details are provided
    if (user.role === 'vendor') {
      try {
        await this.sendVendorOTP(user.email, user.name || user.shopName || 'Vendor');
      } catch (error) {
        this.logger.error(`Failed to send vendor OTP to ${this.maskEmail(user.email)}: ${error.message}`);
        throw new Error('Account created but verification email could not be sent. Please tap "Resend" on the verification screen.');
      }
    }

    if (userData.ghanaCardNumber && userData.dob) {
      const [firstName, ...rest] = (userData.name || '').split(' ');
      const lastName = rest.join(' ');

      try {
        // BYPASS: If API Keys are missing or for temporary testing, auto-verify
        const partnerId = (this as any).smileIdService.partnerId;
        const apiKey = (this as any).smileIdService.apiKey;

        if (!partnerId || !apiKey) {
          this.logger.log('SMILE_ID_KEYS_MISSING: Bypassing real verification, auto-approving identity.');
          await this.usersService.update((user as any)._id.toString(), { 
            isIdentityVerified: true,
            status: user.role === 'customer' ? 'active' : 'pending'
          } as any);
        } else {
          const verification = await this.smileIdService.verifyGhanaCard({
            idNumber: userData.ghanaCardNumber,
            firstName: firstName || userData.name,
            lastName: lastName || 'User',
            dob: userData.dob,
            userId: (user as any)._id.toString()
          });

          if (verification.success) {
            const updateData: any = { isIdentityVerified: true };
            if (user.role === 'customer') {
              updateData.status = 'active';
            }
            await this.usersService.update((user as any)._id.toString(), updateData);
          }
        }
      } catch (error) {
        this.logger.error(`Smile ID Background Verification Error: ${error.message}`);
      }
    }

    const userObj = (user as any).toObject ? (user as any).toObject() : user;
    const { password: _pw, ...safeUser } = userObj;

    return {
      user: safeUser,
      requiresEmailVerification: user.role === 'vendor',
      message: user.role === 'vendor'
        ? 'Studio account created. Check your email for a 4-digit code and your phone for a welcome SMS.'
        : 'Account created successfully. A confirmation SMS has been sent to your phone.',
    };
  }

  async sendVendorOTP(email: string, name: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const otp = this.otpService.generateOTP();
    await this.otpService.storeOTP(normalizedEmail, otp);
    await this.emailService.sendOTP(normalizedEmail, name, otp);
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
    await this.sendVendorOTP(email, user.name);
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
