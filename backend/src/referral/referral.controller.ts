import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
      region?: string;
      tiktokLink?: string;
      paymentMethod?: { network: string; accountNumber: string; accountName: string };
      ghanaCardFront?: string;
      ghanaCardBack?: string;
      selfie?: string;
    },
  ) {
    if (!body.name || !body.email || !body.phone || !body.password) {
      throw new BadRequestException('Name, email, phone, and password are required.');
    }
    if (!body.tiktokLink) {
      throw new BadRequestException('A TikTok link is required so vendors can see your content.');
    }
    return this.referralService.registerReferee(body);
  }

  // ─── Public: Referee Storefront (customer-facing) ─────────────────────────

  @Get('store/public/:slug')
  async getPublicRefereeStore(@Param('slug') slug: string) {
    return this.referralService.getPublicRefereeStore(slug);
  }

  /** Resolves a referral code to its safe, public store info (name + slug only). */
  @Get('resolve/:code')
  async resolveCode(@Param('code') code: string) {
    return this.referralService.resolvePublicRefereeInfo(code);
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

  // ─── Authenticated: Product Picker ────────────────────────────────────────

  @UseGuards(AuthGuard('jwt'))
  @Get('browse-products')
  async browseProducts(
    @Request() req,
    @Query('region') region?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.assertReferee(req);
    return this.referralService.browseProducts(req.user.userId, {
      region,
      search,
      category,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('my-store/select/:productId')
  async selectProduct(@Request() req, @Param('productId') productId: string) {
    this.assertReferee(req);
    return this.referralService.selectProduct(req.user.userId, productId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('my-store/select/:productId')
  async unselectProduct(@Request() req, @Param('productId') productId: string) {
    this.assertReferee(req);
    return this.referralService.unselectProduct(req.user.userId, productId);
  }

  // ─── Authenticated: Vendor Visibility into Referee Selections ─────────────

  @UseGuards(AuthGuard('jwt'))
  @Get('vendor/product-selector-counts')
  async getProductSelectorCounts(@Request() req) {
    if (req.user?.role !== 'vendor') {
      throw new ForbiddenException('Only vendor accounts can view this.');
    }
    return this.referralService.getProductSelectorCounts(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('vendor/product-selectors/:productId')
  async getProductSelectors(@Request() req, @Param('productId') productId: string) {
    if (req.user?.role !== 'vendor') {
      throw new ForbiddenException('Only vendor accounts can view this.');
    }
    return this.referralService.getProductSelectors(req.user.userId, productId);
  }

  // ─── Authenticated: Referral Link Generator ───────────────────────────────

  @UseGuards(AuthGuard('jwt'))
  @Get('link/:productId')
  async getReferralLink(@Request() req, @Param('productId') productId: string) {
    this.assertReferee(req);
    return this.referralService.getReferralLinkForProduct(req.user.userId, productId);
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private assertReferee(req: { user?: { role?: string } }) {
    if (req.user?.role !== 'referee') {
      throw new ForbiddenException('Only referee accounts can access this endpoint.');
    }
  }
}
