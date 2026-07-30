import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CheckoutCartDto } from './dto/checkout-cart.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Get('track/:id')
  trackOrder(@Param('id') id: string) {
    return this.ordersService.trackOrder(id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    // Ensure the customerId matches the logged in user unless admin
    if (req.user) {
      createOrderDto.customerId = req.user.userId;
    }
    return this.ordersService.create(createOrderDto);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('checkout-cart')
  checkoutCart(@Body() dto: CheckoutCartDto, @Request() req) {
    return this.ordersService.checkoutCart(req.user?.userId || null, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Request() req, @Query() query: OrderPaginationDto) {
    const { page, limit } = query;
    // If not admin, only return user's orders
    if (req.user.role !== 'admin') {
      return this.ordersService.findByUser(req.user.userId, page, limit);
    }
    return this.ordersService.findAll(page, limit);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-orders')
  findMyOrders(@Request() req, @Query() query: OrderPaginationDto) {
    const { page, limit } = query;
    return this.ordersService.findByUser(req.user.userId, page, limit);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('vendor-orders')
  findVendorOrders(@Request() req, @Query() query: OrderPaginationDto) {
    const { page, limit } = query;
    // Only vendors (or admins) should call this
    return this.ordersService.findByVendor(req.user.userId, page, limit);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('pending-verifications/list')
  getPendingVerifications(@Request() req) {
    const vendorId = req.user.role === 'vendor' ? req.user.userId : undefined;
    return this.ordersService.getPendingPaymentVerifications(vendorId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.ordersService.findOne(id, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto, @Request() req) {
    return this.ordersService.update(id, updateOrderDto, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.ordersService.remove(id, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/verify-payment')
  verifyPayment(@Param('id') id: string, @Request() req) {
    // Only vendors can verify their own orders
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new ForbiddenException('Only vendors can verify payments');
    }
    return this.ordersService.verifyPayment(id, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/submit-proof')
  submitProof(@Param('id') id: string, @Body() body: { proofUrl: string }, @Request() req) {
    return this.ordersService.submitPaymentProof(id, req.user.userId, body.proofUrl);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/shipped')
  markAsShipped(@Param('id') id: string, @Body() body: { trackingNumber?: string, carrier?: string }, @Request() req) {
    return this.ordersService.markAsShipped(id, req.user.userId, body.trackingNumber, body.carrier);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/confirm-receipt')
  confirmReceipt(@Param('id') id: string, @Request() req) {
    return this.ordersService.confirmReceipt(id, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/satisfied')
  markAsSatisfied(@Param('id') id: string, @Request() req) {
    return this.ordersService.markAsSatisfied(id, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/dispute')
  fileDispute(@Param('id') id: string, @Body() body: { reason: string }, @Request() req) {
    return this.ordersService.fileDispute(id, req.user.userId, body.reason);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/resolve-dispute')
  resolveDispute(@Param('id') id: string, @Body() body: { resolution: 'refund' | 'release' }, @Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Admin access required');
    return this.ordersService.resolveDispute(id, body.resolution);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/first-mile-fee')
  setFirstMileFee(@Param('id') id: string, @Body() body: { fee: number }, @Request() req) {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new ForbiddenException('Only vendors can set delivery fees');
    }
    return this.ordersService.setFirstMileFee(id, req.user.userId, body.fee);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/initialize-first-mile-payment')
  initializeFirstMilePayment(@Param('id') id: string, @Request() req) {
    return this.ordersService.initializeFirstMilePayment(id, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/initialize-payment')
  initializePayment(@Param('id') id: string, @Request() req) {
    return this.ordersService.initializePayment(id, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/submit-first-mile-proof')
  submitFirstMileProof(@Param('id') id: string, @Body() body: { proofUrl: string }, @Request() req) {
    return this.ordersService.submitFirstMilePaymentProof(id, req.user.userId, body.proofUrl);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/verify-first-mile-payment')
  verifyFirstMilePayment(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new ForbiddenException('Only vendors can verify delivery fees');
    }
    return this.ordersService.verifyFirstMilePayment(id, req.user.userId);
  }
}
