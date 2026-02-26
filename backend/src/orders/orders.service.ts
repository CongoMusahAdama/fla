import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { PaystackService } from '../payments/paystack.service';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly paystackService: PaystackService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async create(createOrderDto: CreateOrderDto): Promise<any> {
    try {
      const orderId = new Types.ObjectId();

      // Commission Logic: User wants it deducted at WITHDRAWAL.
      // So here we store the FULL amount as vendor share initially.
      const totalAmount = createOrderDto.totalAmount;
      const adminCommission = 0; // Will be calculated and deducted at withdrawal
      const vendorShare = totalAmount;

      const orderData: any = {
        ...createOrderDto,
        customerId: new Types.ObjectId(createOrderDto.customerId),
        status: 'pending',
        isPaid: false,
        adminCommission,
        vendorShare,
        paymentRef: orderId.toString()
      };

      if (createOrderDto.vendorId) {
        orderData.vendorId = new Types.ObjectId(createOrderDto.vendorId);
        // Auto-populate vendor name if missing
        if (!createOrderDto.vendorName) {
          const vendor = await this.userModel.findById(createOrderDto.vendorId).exec();
          if (vendor) {
            orderData.vendorName = vendor.shopName || vendor.name;
          }
        }
      }

      if (createOrderDto.items && createOrderDto.items.length > 0) {
        orderData.items = createOrderDto.items.map(item => ({
          ...item,
          productId: new Types.ObjectId(item.productId)
        }));
      }

      const createdOrder = new this.orderModel({
        ...orderData,
        _id: orderId,
      });
      const savedOrder = await createdOrder.save();

      // Initialize Paystack Payment
      const paymentLink = await this.paystackService.initializePayment({
        reference: orderId.toString(),
        amount: totalAmount,
        currency: 'GHS',
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?order_id=${orderId}`,
        email: createOrderDto.customerEmail || 'customer@example.com',
        metadata: {
          orderId: orderId.toString(),
          customerName: createOrderDto.customerName,
        }
      });

      return { order: savedOrder, paymentLink };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async handlePaymentSuccess(orderId: string, transactionId: string) {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order || order.isPaid) return;

    order.isPaid = true;
    order.paidAt = new Date();
    order.status = 'payment_verified';
    order.escrowStatus = 'held';
    order.paymentId = transactionId;

    // Update vendor's pending balance
    await this.userModel.findByIdAndUpdate(order.vendorId, {
      $inc: { pendingBalance: order.vendorShare }
    });

    // Decrement stock for each item
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        await this.productModel.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity }
        });
      }
    }

    await order.save();
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderModel.find({ customerId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
  }

  async findByVendor(vendorId: string): Promise<Order[]> {
    return this.orderModel.find({ vendorId: new Types.ObjectId(vendorId) }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    return order;
  }

  async trackOrder(id: string): Promise<any> {
    const order = await this.orderModel.findById(id)
      .select('status items trackingNumber carrier createdAt updatedAt customerName shippingCity shippingRegion totalAmount isPaid')
      .exec();
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const existingOrder = await this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true })
      .exec();
    if (!existingOrder) throw new NotFoundException(`Order with ID ${id} not found`);
    return existingOrder;
  }

  async remove(id: string): Promise<Order> {
    const deletedOrder = await this.orderModel.findByIdAndDelete(id).exec();
    if (!deletedOrder) throw new NotFoundException(`Order with ID ${id} not found`);
    return deletedOrder;
  }

  async verifyPayment(orderId: string, vendorId: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.vendorId.toString() !== vendorId) throw new NotFoundException('Unauthorized');

    order.paymentVerifiedByVendor = true;
    order.paymentVerifiedAt = new Date();
    order.isPaid = true;
    order.paidAt = new Date();
    order.status = 'payment_verified';
    order.escrowStatus = 'held';

    await this.userModel.findByIdAndUpdate(vendorId, {
      $inc: { pendingBalance: order.vendorShare }
    });

    // Decrement stock for each item
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        await this.productModel.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity }
        });
      }
    }

    return order.save();
  }

  async submitPaymentProof(orderId: string, customerId: string, proofUrl: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.customerId.toString() !== customerId) throw new NotFoundException('Unauthorized');

    order.paymentProof = proofUrl;
    order.paymentSubmittedAt = new Date();

    await order.save();

    // Notify the vendor
    await this.notificationsService.create(order.vendorId.toString(), {
      title: 'Payment Proof Submitted',
      message: `A customer has submitted payment proof for Order #ORD-${order._id.toString().slice(-6).toUpperCase()}. Please verify it.`,
      type: 'payment',
      orderId: order._id
    });

    return order;
  }

  async markAsShipped(orderId: string, vendorId: string, trackingNumber?: string, carrier?: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.vendorId.toString() !== vendorId) throw new NotFoundException('Unauthorized');

    order.status = 'shipped';
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (carrier) order.carrier = carrier;

    // Set auto-release date to 7 days from now by default
    // If the customer doesn't confirm receipt by then, funds will be auto-released
    const autoReleaseDays = parseInt(process.env.AUTO_RELEASE_DAYS || '7');
    const autoReleaseDate = new Date();
    autoReleaseDate.setDate(autoReleaseDate.getDate() + autoReleaseDays);
    order.autoReleaseDate = autoReleaseDate;

    return order.save();
  }

  async releaseEscrow(orderId: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.escrowStatus === 'released') return order;

    order.escrowStatus = 'released';
    order.status = 'completed';
    order.deliveryConfirmationDate = order.deliveryConfirmationDate || new Date();

    await this.userModel.findByIdAndUpdate(order.vendorId, {
      $inc: {
        pendingBalance: -order.vendorShare,
        walletBalance: order.vendorShare,
        fulfillmentRate: 1
      }
    });

    return order.save();
  }

  async approveEscrow(orderId: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.escrowStatus !== 'waiting_approval') {
      throw new Error(`Order escrow status is ${order.escrowStatus}, not waiting_approval`);
    }

    return this.releaseEscrow(orderId);
  }

  async confirmReceipt(orderId: string, customerId: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.customerId.toString() !== customerId) throw new NotFoundException('Unauthorized');

    order.status = 'delivered';
    order.escrowStatus = 'waiting_approval';
    order.deliveryConfirmationDate = new Date();
    order.deliveredAt = new Date();

    return order.save();
  }

  async processAutoReleases(): Promise<number> {
    const now = new Date();
    const ordersToRelease = await this.orderModel.find({
      status: 'shipped',
      escrowStatus: 'held',
      autoReleaseDate: { $lte: now }
    }).exec();

    for (const order of ordersToRelease) {
      await this.releaseEscrow(order._id.toString());
    }

    return ordersToRelease.length;
  }

  async fileDispute(orderId: string, customerId: string, reason: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.customerId.toString() !== customerId) throw new NotFoundException('Unauthorized');

    order.status = 'disputed';
    order.escrowStatus = 'frozen';
    order.disputeReason = reason;

    return order.save();
  }

  async resolveDispute(orderId: string, resolution: 'refund' | 'release'): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.status !== 'disputed') throw new Error('Order is not in dispute');

    if (resolution === 'release') {
      return this.releaseEscrow(orderId.toString());
    } else if (resolution === 'refund') {
      order.status = 'refunded';
      order.escrowStatus = 'refunded';
      await this.userModel.findByIdAndUpdate(order.vendorId, {
        $inc: { pendingBalance: -order.vendorShare }
      });
    }

    return order.save();
  }

  async getPendingPaymentVerifications(vendorId?: string): Promise<Order[]> {
    const query: any = {
      paymentProof: { $exists: true, $ne: null },
      paymentVerifiedByVendor: false
    };
    if (vendorId) query.vendorId = new Types.ObjectId(vendorId);
    return this.orderModel.find(query).sort({ paymentSubmittedAt: 1 }).exec();
  }

  async getVendorStats(vendorId: string) {
    const orders = await this.orderModel.find({ vendorId: new Types.ObjectId(vendorId) }).exec();
    const stats: any = {};
    const total = orders.length;
    const completed = orders.filter(o => o.status === 'completed').length;
    return { total, completed };
  }
}
