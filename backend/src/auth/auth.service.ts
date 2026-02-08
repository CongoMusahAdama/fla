import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { OtpService } from '../otp/otp.service';
import * as bcrypt from 'bcrypt';

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
}
