import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Get('track/:id')
  trackOrder(@Param('id') id: string) {
    return this.ordersService.trackOrder(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    // Ensure the customerId matches the logged in user unless admin
    createOrderDto.customerId = req.user.userId;
    return this.ordersService.create(createOrderDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Request() req) {
    // If not admin, only return user's orders
    if (req.user.role !== 'admin') {
      return this.ordersService.findByUser(req.user.userId);
    }
    return this.ordersService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-orders')
  findMyOrders(@Request() req) {
    return this.ordersService.findByUser(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('vendor-orders')
  findVendorOrders(@Request() req) {
    // Only vendors (or admins) should call this
    return this.ordersService.findByVendor(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/verify-payment')
  verifyPayment(@Param('id') id: string, @Request() req) {
    // Only vendors can verify their own orders
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new Error('Only vendors can verify payments');
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
  @Post(':id/dispute')
  fileDispute(@Param('id') id: string, @Body() body: { reason: string }, @Request() req) {
    return this.ordersService.fileDispute(id, req.user.userId, body.reason);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/resolve-dispute')
  resolveDispute(@Param('id') id: string, @Body() body: { resolution: 'refund' | 'release' }, @Request() req) {
    if (req.user.role !== 'admin') throw new Error('Unauthorized - Admin only');
    return this.ordersService.resolveDispute(id, body.resolution);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('pending-verifications/list')
  getPendingVerifications(@Request() req) {
    // Vendors see their own, admins see all
    const vendorId = req.user.role === 'vendor' ? req.user.userId : undefined;
    return this.ordersService.getPendingPaymentVerifications(vendorId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('process-auto-releases')
  async processAutoReleases(@Request() req) {
    if (req.user.role !== 'admin') throw new Error('Unauthorized - Admin only');
    const releasedCount = await this.ordersService.processAutoReleases();
    return { message: `Processed ${releasedCount} auto-releases` };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/approve-escrow')
  async approveEscrow(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') throw new Error('Unauthorized - Admin only');
    return this.ordersService.approveEscrow(id);
  }
}
