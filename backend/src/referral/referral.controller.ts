import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReferralService } from './referral.service';

@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  // ─── Public: Referee Registration ─────────────────────────────────────────

  @Post('register')
  async registerReferee(
    @Body()
    body: {
      name: string;
      email: string;
      phone: string;
      password: string;
    },
  ) {
    if (!body.name || !body.email || !body.phone || !body.password) {
      throw new BadRequestException('Name, email, phone, and password are required.');
    }
    return this.referralService.registerReferee(body);
  }

  // ─── Public: Referee Storefront (customer-facing) ─────────────────────────

  @Get('store/public/:slug')
  async getPublicRefereeStore(@Param('slug') slug: string) {
    return this.referralService.getPublicRefereeStore(slug);
  }

  // ─── Authenticated: Referee Dashboard ─────────────────────────────────────

  @UseGuards(AuthGuard('jwt'))
  @Get('dashboard')
  async getDashboard(@Request() req) {
    this.assertReferee(req);
    return this.referralService.getRefereeDashboard(req.user.userId);
  }

  // ─── Authenticated: Referee Store Management ──────────────────────────────

  @UseGuards(AuthGuard('jwt'))
  @Get('my-store')
  async getMyStore(@Request() req) {
    this.assertReferee(req);
    return this.referralService.getRefereeStore(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('my-store/toggle/:productId')
  async toggleHideProduct(@Request() req, @Param('productId') productId: string) {
    this.assertReferee(req);
    return this.referralService.toggleHideProduct(req.user.userId, productId);
  }

  // ─── Authenticated: Referral Link Generator ───────────────────────────────

  @UseGuards(AuthGuard('jwt'))
  @Get('link/:productId')
  async getReferralLink(@Request() req, @Param('productId') productId: string) {
    this.assertReferee(req);
    return this.referralService.getReferralLinkForProduct(req.user.userId, productId);
  }

  // ─── Authenticated: Vendor Referral Toggle ────────────────────────────────

  @UseGuards(AuthGuard('jwt'))
  @Patch('vendor/toggle')
  async toggleVendorReferrals(@Request() req, @Body() body: { accept: boolean }) {
    if (req.user?.role !== 'vendor') {
      throw new ForbiddenException('Only vendor accounts can toggle referral acceptance.');
    }
    return this.referralService.setVendorReferralAcceptance(req.user.userId, !!body.accept);
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private assertReferee(req: { user?: { role?: string } }) {
    if (req.user?.role !== 'referee') {
      throw new ForbiddenException('Only referee accounts can access this endpoint.');
    }
  }
}
