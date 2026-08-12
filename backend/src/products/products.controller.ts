import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, UnauthorizedException, ForbiddenException, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { isSubscriptionActive } from '../users/vendor-subscription.util';
import { FLA_CONSTANTS } from '../common/constants';
import { isVendorDocumented } from '../common/vendor-trust.util';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }

  @Get('count')
  getCount(@Query() query: any) {
    return this.productsService.countAll(query);
  }

  @Get('suggestions')
  getSuggestions(@Query('search') search: string) {
    return this.productsService.getSuggestions(search);
  }

  @Get('grouped')
  findGroupedByVendor() {
    return this.productsService.findGroupedByVendor();
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
      if (!isVendorDocumented(vendor as any)) {
        throw new ForbiddenException(
          'You must upload your business registration documents in settings to list products on the platform.',
        );
      }
      if (!isSubscriptionActive(vendor as any)) {
        const intro = !(vendor as any)?.subscriptionLastPaidAt;
        const amount = intro
          ? FLA_CONSTANTS.SUBSCRIPTION_INTRO_GHS
          : FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS;
        throw new ForbiddenException(
          `Product uploads are locked until you pay GHS ${amount} via Paystack in your vendor dashboard. Existing listings stay live.`,
        );
      }
    }

    createProductDto.vendorId = req.user.userId;
    return this.productsService.create(createProductDto);
  }

  @Get()
  async findAll(@Query() query: any, @Res({ passthrough: true }) res: Response) {
    // Cache public product listings for 30s (huge improvement for repeat visitors)
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
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
