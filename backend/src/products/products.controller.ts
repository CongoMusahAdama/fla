import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, UnauthorizedException, ForbiddenException, Res } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { FLA_CONSTANTS } from '../common/constants';
import { isSubscriptionActive } from '../users/vendor-subscription.util';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }

  /** Public reads must not share a CGNAT/mobile IP rate budget — load balancers + 100 shoppers OK. */
  @SkipThrottle()
  @Get('count')
  getCount(@Query() query: any) {
    return this.productsService.countAll(query);
  }

  @SkipThrottle()
  @Get('suggestions')
  getSuggestions(@Query('search') search: string) {
    return this.productsService.getSuggestions(search);
  }

  @SkipThrottle()
  @Get('grouped')
  findGroupedByVendor(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    return this.productsService.findGroupedByVendor();
  }

  @Get('admin/vendor-counts')
  @UseGuards(AuthGuard('jwt'))
  vendorProductCounts(@Request() req: { user: { role: string } }) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin only');
    }
    return this.productsService.countGroupedByVendor();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() createProductDto: CreateProductDto, @Request() req) {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new UnauthorizedException('Unauthorized - Only vendors can create products');
    }

    if (req.user.role === 'vendor') {
      const vendor = await this.userModel
        .findById(req.user.userId)
        .select('mustChangePassword kycApprovedAt subscriptionEndsAt subscriptionPaymentRequired subscriptionPlan subscriptionLastPaidAt businessRegistration vendorTier')
        .lean()
        .exec();
      if ((vendor as any)?.mustChangePassword) {
        throw new ForbiddenException('Please change your temporary password before uploading products.');
      }
      if (!(vendor as any)?.kycApprovedAt) {
        throw new ForbiddenException(
          'Upload your verification documents and wait for admin approval (usually 4–5 hours) before you can list products.',
        );
      }
      // Business registration is optional for listing — it only unlocks the green trust badge after admin confirm.
      if (!isSubscriptionActive(vendor as any)) {
        throw new ForbiddenException(
          `Product uploads are locked until you renew via Paystack in your vendor dashboard (GHS ${FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS}). Existing listings stay live.`,
        );
      }
    }

    createProductDto.vendorId = req.user.userId;
    return this.productsService.create(createProductDto);
  }

  @SkipThrottle()
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(
    @Query() query: any,
    @Request() req: { user?: { userId: string; role: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (query.showAll === 'true') {
      const user = req.user;
      const vendorId = query.vendorId ? String(query.vendorId) : '';
      const allowed =
        user &&
        (user.role === 'admin' ||
          (user.role === 'vendor' && vendorId && vendorId === String(user.userId)));
      if (!allowed) {
        throw new ForbiddenException('Not allowed to load full catalog for this scope.');
      }
    }

    // Short browser/CDN cache — identical concurrent searches mostly hit this or the API TTL cache
    res.setHeader('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
    return this.productsService.findAll(query);
  }

  @SkipThrottle()
  @Get(':id')
  findOne(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
    return this.productsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Request() req) {
    return this.productsService.update(id, updateProductDto, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(id, req.user);
  }
}
