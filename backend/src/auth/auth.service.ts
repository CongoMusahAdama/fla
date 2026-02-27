import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { OtpService } from '../otp/otp.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private otpService: OtpService
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    console.log('Validating user:', email);
    const user = await this.usersService.findOne(email);
    if (!user) {
      console.log('User not found');
      return null;
    }

    console.log('User found, checking password...');
    if (!user.password) return null;
    const isMatch = await bcrypt.compare(pass, user.password);
    console.log('Password match result:', isMatch);

    if (isMatch) {
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
      }
    };
  }

  async register(user: any) {
    return this.usersService.create(user);
  }

  async sendVendorOTP(email: string, name: string): Promise<void> {
    const otp = this.otpService.generateOTP();
    await this.otpService.storeOTP(email, otp);
    await this.emailService.sendOTP(email, name, otp);
  }

  async verifyVendorOTP(email: string, code: string): Promise<boolean> {
    // TEMPORARILY DISABLED OTP VERIFICATION
    console.log(`Bypassing OTP verification for ${email}`);
    // const isValid = await this.otpService.verifyOTP(email, code);
    const isValid = true;

    if (isValid) {
      // Send welcome email
      const user = await this.usersService.findOne(email);
      if (user && user.shopName) {
        await this.emailService.sendWelcomeEmail(email, user.name, user.shopName);
      }
      // Clean up OTP
      await this.otpService.deleteOTP(email);
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

    // Set status to active
    await this.usersService.update(user._id.toString(), { status: 'active' });

    // Send the credentials email with the raw password
    await this.emailService.sendVendorCredentialsEmail(user.email, user.name || 'Vendor', password, user.shopName || 'FLA Studio');

    // Send the welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name || 'Vendor', user.shopName || 'FLA Studio');

    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    console.log(`[ForgotPassword] Request received for: ${email}`);
    const user = await this.usersService.findOne(email);
    if (!user) {
      // Don't leak whether a user exists or not (security best practice)
      console.log(`[ForgotPassword] No user found for: ${email} — returning silently`);
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token valid for 1 hour

    console.log(`[ForgotPassword] Saving reset token for user: ${user.email}`);
    await this.usersService.update((user as any)._id.toString(), {
      resetPasswordToken: token,
      resetPasswordExpires: expires
    } as any);

    console.log(`[ForgotPassword] Sending password reset email to: ${user.email}`);
    try {
      await this.emailService.sendPasswordResetEmail(user.email, user.name || 'User', token);
      console.log(`[ForgotPassword] Email sent successfully to: ${user.email}`);
    } catch (emailError) {
      console.error(`[ForgotPassword] FAILED to send email to ${user.email}:`, emailError);
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
}
