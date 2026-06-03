import { Controller, Post, Body, UseGuards, Request, Get, Patch, Res, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { TurnstileService } from '../common/turnstile.service';
import { StreamService } from '../common/stream.service';
import { FLA_TERMS_VERSION } from '../common/constants';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly turnstileService: TurnstileService,
    private readonly streamService: StreamService,
  ) { }

  @UseGuards(AuthGuard('jwt'))
  @Get('stream-token')
  async getStreamToken(@Request() req) {
    const token = await this.streamService.createToken(req.user.userId);
    return { token };
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const loginResult = await this.authService.login(req.user);
    
    // Set the JWT token in an httpOnly cookie
    res.cookie('fla_token', loginResult.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days instead of 15 mins for stability
      path: '/',
    });
    
    return loginResult;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    // Clear the JWT cookie
    res.clearCookie('fla_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });
    return { message: 'Logged out' };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto, @Request() req) {
    // SECURITY: Verify human status via Cloudflare Turnstile
    if (createUserDto.turnstileToken) {
      const isHuman = await this.turnstileService.verifyToken(createUserDto.turnstileToken, req.ip);
      if (!isHuman) {
        throw new BadRequestException('Security verification failed. Please try again.');
      }
    } else if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Security verification is required.');
    }

    // SECURITY: Prevent privilege escalation. Only 'customer' and 'vendor' are allowed via public registration.
    const allowedRole = createUserDto.role === 'vendor' ? 'vendor' : 'customer';
    return this.authService.register({ ...createUserDto, role: allowedRole });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('accept-terms')
  async acceptTerms(@Request() req, @Body() body: { version?: string }) {
    const version = body?.version || FLA_TERMS_VERSION;
    const user = await this.authService.acceptTerms(req.user.userId, version);
    return { success: true, user };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const result = await this.usersService.update(req.user.userId, updateUserDto);
    return result;
  }

  @Post('send-otp')
  async sendOTP(@Body() body: { phone: string; name?: string }) {
    try {
      await this.authService.sendVendorOTP(body.phone, body.name);
      return { message: 'Verification code sent via SMS', success: true };
    } catch (error) {
      console.error('Error sending OTP:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      return {
        message: error.message || 'Failed to send OTP',
        success: false,
        error: error.toString()
      };
    }
  }

  @Post('verify-otp')
  async verifyOTP(@Body() body: { phone: string; code: string }) {
    try {
      const isValid = await this.authService.verifyVendorOTP(body.phone, body.code);
      if (isValid) {
        return { message: 'OTP verified successfully', success: true };
      } else {
        return { message: 'Invalid or expired OTP', success: false };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  @Post('resend-otp')
  async resendOTP(@Body() body: { phone: string }) {
    try {
      await this.authService.resendVendorOTP(body.phone);
      return { message: 'Verification code sent via SMS', success: true };
    } catch (error) {
      console.error('Error resending OTP:', error);
      return {
        message: error.message || 'Failed to resend verification SMS',
        success: false,
        mnotifyError: error.message,
        hint: 'FLA sends mNotify with sender ID from MNOTIFY_SENDER_ID (e.g. FLAMINGO). Top up SMS credits if you see HTTP 402.',
      };
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admin/create-vendor')
  async adminCreateVendor(@Body() userData: any, @Request() req) {
    // Only admins can create vendors via this endpoint
    if (req.user.role !== 'admin') {
      throw new Error('Unauthorized - Admin only');
    }
    try {
      return await this.authService.adminCreateVendor(userData);
    } catch (error) {
      console.error('Error admin creating vendor:', error);
      throw error;
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    try {
      await this.authService.forgotPassword(body.email);
      return { message: 'If an account exists with that email, a reset link has been sent.', success: true };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { message: 'Failed to process request', success: false };
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; password: string }) {
    try {
      await this.authService.resetPassword(body.token, body.password);
      return { message: 'Password has been reset successfully', success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { message: error.message || 'Failed to reset password', success: false };
    }
  }

  @Post('forgot-password-otp')
  async forgotPasswordOTP(@Body() body: { email: string }) {
    try {
      await this.authService.forgotPasswordOTP(body.email);
      return { message: 'If an account exists with that email, a reset code has been sent.', success: true };
    } catch (error) {
      return { message: 'Failed to process request', success: false };
    }
  }

  @Post('reset-password-otp')
  async resetPasswordWithOTP(@Body() body: { email: string; code: string; password: string }) {
    try {
      await this.authService.resetPasswordWithOTP(body.email, body.code, body.password);
      return { message: 'Password has been reset successfully', success: true };
    } catch (error) {
      return { message: error.message || 'Failed to reset password', success: false };
    }
  }
}
