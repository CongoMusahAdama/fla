import { Controller, Post, Body, UseGuards, Request, Get, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) { }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    console.log('Updating profile for user:', req.user.userId);
    console.log('Update data:', updateUserDto);
    const result = await this.usersService.update(req.user.userId, updateUserDto);
    console.log('Update result:', result);
    return result;
  }

  @Post('send-otp')
  async sendOTP(@Body() body: { email: string; name: string }) {
    try {
      console.log('Received send-otp request for:', body.email);
      await this.authService.sendVendorOTP(body.email, body.name);
      console.log('OTP sent successfully to:', body.email);
      return { message: 'OTP sent successfully', success: true };
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
  async verifyOTP(@Body() body: { email: string; code: string }) {
    try {
      const isValid = await this.authService.verifyVendorOTP(body.email, body.code);
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
  async resendOTP(@Body() body: { email: string }) {
    try {
      await this.authService.resendVendorOTP(body.email);
      return { message: 'OTP resent successfully', success: true };
    } catch (error) {
      console.error('Error resending OTP:', error);
      throw error;
    }
  }

  @Post('admin/create-vendor')
  async adminCreateVendor(@Body() userData: any) {
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
}
