import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    // Ensure the customerId matches the logged in user unless admin
    createOrderDto.customerId = req.user.userId;
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll(@Request() req) {
    // If not admin, only return user's orders
    if (req.user.role !== 'admin') {
      return this.ordersService.findByUser(req.user.userId);
    }
    return this.ordersService.findAll();
  }

  @Get('my-orders')
  findMyOrders(@Request() req) {
    return this.ordersService.findByUser(req.user.userId);
  }

  @Get('vendor-orders')
  findVendorOrders(@Request() req) {
    // Only vendors (or admins) should call this
    return this.ordersService.findByVendor(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @Post(':id/verify-payment')
  verifyPayment(@Param('id') id: string, @Request() req) {
    // Only vendors can verify their own orders
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new Error('Only vendors can verify payments');
    }
    return this.ordersService.verifyPayment(id, req.user.userId);
  }

  @Get('pending-verifications/list')
  getPendingVerifications(@Request() req) {
    // Vendors see their own, admins see all
    const vendorId = req.user.role === 'vendor' ? req.user.userId : undefined;
    return this.ordersService.getPendingPaymentVerifications(vendorId);
  }
}
