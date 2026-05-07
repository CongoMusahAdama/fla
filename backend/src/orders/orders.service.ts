import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { HubtelService } from '../payments/hubtel.service';
import { FLA_CONSTANTS } from '../common/constants';

import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly hubtelService: HubtelService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly settingsService: SettingsService,
  ) { }

  async create(createOrderDto: CreateOrderDto): Promise<any> {
    try {
      const orderId = new Types.ObjectId();

      // Commission Logic: User wants it deducted immediately.
      const totalAmount = createOrderDto.totalAmount;
      const fetchedRate = await this.settingsService.getSetting('platform_commission');
      const commissionRate = fetchedRate !== null && fetchedRate !== undefined ? fetchedRate : FLA_CONSTANTS.DEFAULT_COMMISSION_RATE;
      const adminCommission = totalAmount * (commissionRate / 100);
      const vendorShare = totalAmount - adminCommission;

      const orderData: any = {
        ...createOrderDto,
        customerId: new Types.ObjectId(createOrderDto.customerId),
        status: 'pending',
        isPaid: false,
        adminCommission,
        vendorShare,
        commissionRate,
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

      // Initialize Hubtel Payment
      const paymentLink = await this.hubtelService.initializePayment({
        reference: orderId.toString(),
        amount: totalAmount,
        description: `Order Payment for #ORD-${orderId.toString().slice(-6).toUpperCase()}`,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?order_id=${orderId}`,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?order_id=${orderId}`,
        customerName: createOrderDto.customerName,
        customerEmail: createOrderDto.customerEmail,
        metadata: {
          orderId: orderId.toString(),
          customerName: createOrderDto.customerName,
        }
      });

      // Notify vendor via Email
      if (createOrderDto.vendorId) {
        const vendor = await this.userModel.findById(createOrderDto.vendorId).exec();
        if (vendor && vendor.email) {
          await this.emailService.sendVendorOrderNotification(vendor.email, vendor.shopName || vendor.name, orderId.toString(), totalAmount);
        }
      }

      // Notify customer via Email
      if (createOrderDto.customerEmail) {
        await this.emailService.sendOrderEmail(
          createOrderDto.customerEmail,
          createOrderDto.customerName || 'Customer',
          orderId.toString(),
          totalAmount
        );
      }

      return { order: savedOrder, paymentLink };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async handlePaymentSuccess(orderId: string, transactionId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findById(orderId).session(session).exec();
      if (!order || order.isPaid) {
        await session.abortTransaction();
        return;
      }

      order.isPaid = true;
      order.paidAt = new Date();
      order.status = 'payment_verified';
      order.escrowStatus = 'held';
      order.paymentId = transactionId;

      // Update vendor's pending balance
      await this.userModel.findByIdAndUpdate(order.vendorId, {
        $inc: { pendingBalance: order.vendorShare }
      }).session(session);

      // Decrement stock for each item in parallel
      if (order.items && order.items.length > 0) {
        const stockUpdates = order.items.map(item =>
          this.productModel.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity }
          }).session(session)
        );
        await Promise.all(stockUpdates);
      }

      await order.save({ session });
      await session.commitTransaction();

      // Side Effects: Notifications & Emails (Outside transaction for performance)
      const customer = await this.userModel.findById(order.customerId).exec();
      this.sendPaymentSuccessNotifications(order, customer);
    } catch (error) {
      await session.abortTransaction();
      console.error('Error handling payment success:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async sendPaymentSuccessNotifications(order: any, customer: any) {
    try {
      if (customer && customer.email) {
        const message = `Payment for Order #ORD-${order._id.toString().slice(-6).toUpperCase()} verified! Your vendor has been notified to begin fulfillment.`;
        this.emailService.sendGenericNotification(customer.email, customer.name || 'Customer', 'Payment Verified ✅', message).catch(console.error);
      }

      const admins = await this.userModel.find({ role: 'admin' }).exec();
      const adminEmails = admins
        .filter(admin => admin.email)
        .map(admin => this.emailService.sendAdminOrderNotification(
          admin.email,
          order._id.toString(),
          order.totalAmount,
          customer?.name || 'Customer'
        ).catch(console.error));
      
      await Promise.all(adminEmails);
    } catch (err) {
      this.logger.error(`Notification failed for order ${order._id}: ${err.message}`);
    }
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

  async findOne(id: string, user: any): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);

    // Ownership check: customer who placed it, vendor, or admin
    if (user.role !== 'admin' &&
      order.customerId.toString() !== user.userId &&
      order.vendorId.toString() !== user.userId) {
      throw new ForbiddenException('You do not have permission to view this order');
    }
    return order;
  }

  async trackOrder(id: string): Promise<any> {
    const order = await this.orderModel.findById(id)
      .select('status items trackingNumber carrier createdAt updatedAt vendorName escrowStatus shippingCity shippingRegion')
      .exec();
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, user: any): Promise<Order> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findById(id).session(session).exec();
      if (!order) throw new NotFoundException(`Order with ID ${id} not found`);

      // Ownership check: Only admin or the customer/vendor related to this order can update
      if (user.role !== 'admin' &&
        order.customerId.toString() !== user.userId &&
        order.vendorId.toString() !== user.userId) {
        throw new ForbiddenException('You do not have permission to update this order');
      }

      // Special Handling for Cancellation
      if (updateOrderDto.status === 'cancelled' && order.status !== 'cancelled') {
        // Enforce user's specific cancellation policy
        if (user.role !== 'admin') {
          if (user.userId === order.customerId.toString()) {
            // Customer can only cancel if they don't accept delivery payment (for inter-regional)
            const canCustomerCancel = order.deliveryType === 'inter-regional' && order.firstMileFee > 0 && !order.isFirstMileFeePaid;
            if (!canCustomerCancel) {
              throw new ForbiddenException('You can only withdraw an order if you do not accept the delivery quotation.');
            }
          }
          // Vendor can cancel (e.g., if product is no more fit to sell), which is already covered by ownership check
        }

        // If order was paid, we handle the refund to customer wallet
        if (order.isPaid && order.escrowStatus !== 'refunded') {
          // 1. Deduct from vendor's pending balance (if it was added during payment verification)
          await this.userModel.findByIdAndUpdate(order.vendorId, {
            $inc: { pendingBalance: -order.vendorShare }
          }).session(session);

          // 2. Credit the customer's wallet balance
          await this.userModel.findByIdAndUpdate(order.customerId, {
            $inc: { walletBalance: order.totalAmount }
          }).session(session);

          // 3. Update escrow status
          (updateOrderDto as any).escrowStatus = 'refunded';
        }

        // Notify Customer
        await this.notificationsService.create(order.customerId.toString(), {
          title: 'Order Cancelled ⚠️',
          message: `Your Order #ORD-${order._id.toString().slice(-6).toUpperCase()} has been cancelled. ${order.isPaid ? 'A full refund has been credited to your FLA Wallet.' : ''}`,
          type: 'order',
          orderId: order._id
        });

        // Email to Customer
        const customer = await this.userModel.findById(order.customerId).exec();
        if (customer && customer.email) {
          await this.emailService.sendGenericNotification(
            customer.email,
            customer.name || 'Customer',
            'Order Cancellation Update',
            `Order #ORD-${order._id.toString().slice(-6).toUpperCase()} was cancelled. ${order.isPaid ? 'The full amount has been refunded to your wallet balance.' : 'No funds were charged.'}`
          ).catch(console.error);
        }
      }


      const existingOrder = await this.orderModel
        .findByIdAndUpdate(id, updateOrderDto, { new: true })
        .session(session)
        .exec();

      await session.commitTransaction();
      return existingOrder as Order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async remove(id: string, user: any): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);

    // Only admin can delete orders (safety policy)
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only administrators can remove orders');
    }

    return this.orderModel.findByIdAndDelete(id).exec() as any;
  }

  async getAdminDashboardStats() {
    const stats = await this.orderModel.aggregate([
      {
        $facet: {
          escrow: [
            { $match: { escrowStatus: { $in: ['held', 'frozen', 'waiting_approval'] } } },
            { $group: { _id: null, balance: { $sum: '$totalAmount' } } }
          ],
          revenue: [
            { $match: { isPaid: true, status: { $nin: ['cancelled', 'refunded'] } } },
            {
              $group: {
                _id: null,
                total: { $sum: '$totalAmount' },
                commission: { $sum: { $ifNull: ['$adminCommission', { $multiply: ['$totalAmount', 0.1] }] } }
              }
            }
          ],
          counts: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $in: ['$status', ['completed', 'delivered']] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
              }
            }
          ]
        }
      }
    ]);

    const result = stats[0] || { escrow: [], revenue: [], counts: [] };
    return {
      escrowBalance: result.escrow?.[0]?.balance || 0,
      totalRevenue: result.revenue?.[0]?.total || 0,
      totalCommission: result.revenue?.[0]?.commission || 0,
      totalOrders: result.counts?.[0]?.total || 0,
      completedTransactions: result.counts?.[0]?.completed || 0,
      pendingOrders: result.counts?.[0]?.pending || 0
    };
  }

  async getRevenueChartData() {
    try {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setDate(1); // Start of current month
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      twelveMonthsAgo.setHours(0, 0, 0, 0);

      const stats = await this.orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: twelveMonthsAgo },
            isPaid: true,
            status: { $nin: ['cancelled', 'refunded'] }
          }
        },
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" }
            },
            gross: { $sum: "$totalAmount" },
            net: { $sum: { $ifNull: ["$adminCommission", { $multiply: ["$totalAmount", 0.1] }] } }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]);

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      // Fill in missing months to ensure a continuous 12-month graph
      const fullData: { name: string; gross: number; net: number }[] = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        
        const found = stats.find(s => s._id.month === month && s._id.year === year);
        fullData.push({
          name: monthNames[month - 1],
          gross: found ? found.gross : 0,
          net: found ? found.net : 0
        });
      }

      return fullData;
    } catch (error) {
      this.logger.error(`Failed to aggregate revenue chart data: ${error.message}`);
      return []; // Return empty array instead of crashing
    }
  }

  async getRecentOrders(limit: number): Promise<Order[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).limit(limit).exec();
  }

  async verifyPayment(orderId: string, callerId: string): Promise<Order> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findById(orderId).session(session).exec();
      if (!order) throw new NotFoundException('Order not found');

      // Authorization Check: Must be the vendor who owns the order OR an admin
      const caller = await this.userModel.findById(callerId).exec();
      const isAdmin = caller?.role === 'admin';
      
      if (!isAdmin && order.vendorId.toString() !== callerId) {
        throw new ForbiddenException('Unauthorized - You do not have permission to verify this payment');
      }

      if (order.isPaid) {
        await session.abortTransaction();
        return order;
      }

      order.paymentVerifiedByVendor = true;
      order.paymentVerifiedAt = new Date();
      order.isPaid = true;
      order.paidAt = new Date();
      order.status = 'payment_verified';
      order.escrowStatus = 'held';

      // ALWAYS credit the vendor related to the order
      await this.userModel.findByIdAndUpdate(order.vendorId, {
        $inc: { pendingBalance: order.vendorShare }
      }).session(session);

      // Decrement stock in parallel
      if (order.items && order.items.length > 0) {
        const stockUpdates = order.items.map(item =>
          this.productModel.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity }
          }).session(session)
        );
        await Promise.all(stockUpdates);
      }

      const savedOrder = await order.save({ session });
      await session.commitTransaction();
      return savedOrder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findById(orderId).session(session).exec();
      if (!order) throw new NotFoundException(`Order not found`);
      if (order.escrowStatus === 'released') {
        await session.abortTransaction();
        return order;
      }

      order.escrowStatus = 'released';
      order.status = 'completed';
      order.deliveryConfirmationDate = order.deliveryConfirmationDate || new Date();

      await this.userModel.findByIdAndUpdate(order.vendorId, {
        $inc: {
          pendingBalance: -order.vendorShare,
          walletBalance: order.vendorShare,
          fulfillmentRate: 1
        }
      }).session(session);

      const savedOrder = await order.save({ session });
      await session.commitTransaction();
      return savedOrder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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
    order.deliveryConfirmationDate = new Date();
    order.deliveredAt = new Date();

    // Set auto-release date to 2 days from now
    // If the customer doesn't mark as satisfied by then, funds will be auto-released
    const autoReleaseDate = new Date();
    autoReleaseDate.setDate(autoReleaseDate.getDate() + 2);
    order.autoReleaseDate = autoReleaseDate;

    return order.save();
  }

  async markAsSatisfied(orderId: string, customerId: string): Promise<Order> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findById(orderId).session(session).exec();
      if (!order) throw new NotFoundException(`Order not found`);
      if (order.customerId.toString() !== customerId) throw new ForbiddenException('Unauthorized');

      if (order.status !== 'delivered') {
        throw new Error('Order must be confirmed as received before marking as satisfied');
      }

      order.status = 'completed';
      order.escrowStatus = 'released';
      order.deliveryConfirmationDate = order.deliveryConfirmationDate || new Date();

      // Release funds to vendor
      await this.userModel.findByIdAndUpdate(order.vendorId, {
        $inc: {
          pendingBalance: -order.vendorShare,
          walletBalance: order.vendorShare,
          fulfillmentRate: 1
        }
      }).session(session);

      const savedOrder = await order.save({ session });
      await session.commitTransaction();
      return savedOrder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async processAutoReleases(): Promise<number> {
    const now = new Date();
    const ordersToRelease = await this.orderModel.find({
      status: { $in: ['shipped', 'delivered'] },
      escrowStatus: 'held',
      autoReleaseDate: { $lte: now }
    }).exec();

    const releasePromises = ordersToRelease.map(order => 
      this.releaseEscrow(order._id.toString()).catch(err => {
        console.error(`Failed to auto-release order ${order._id}:`, err);
      })
    );

    await Promise.all(releasePromises);
    return ordersToRelease.length;
  }

  async fileDispute(orderId: string, customerId: string, reason: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.customerId.toString() !== customerId) throw new NotFoundException('Unauthorized');

    order.status = 'disputed';
    order.escrowStatus = 'frozen';
    order.disputeReason = reason;

    const savedOrder = await order.save();

    // Collect all parties for the transparency email thread
    const recipients: string[] = [];
    
    // 1. Customer Email
    const customer = await this.userModel.findById(customerId).exec();
    if (customer?.email) recipients.push(customer.email);

    // 2. Vendor Email
    const vendor = await this.userModel.findById(order.vendorId).exec();
    if (vendor?.email) recipients.push(vendor.email);

    // 3. Admin Emails
    const admins = await this.userModel.find({ role: 'admin' }).exec();
    const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];
    recipients.push(...adminEmails);

    // Send the multi-party transparency email if we have any recipients
    if (recipients.length > 0) {
      await this.emailService.sendDisputeNotification(
        [...new Set(recipients)], // Ensure unique emails
        order._id.toString(),
        reason,
        customer?.name || 'Customer',
        vendor?.shopName || vendor?.name || 'Vendor'
      );
    }

    return savedOrder;
  }

  async resolveDispute(orderId: string, resolution: 'refund' | 'release'): Promise<Order> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findById(orderId).session(session).exec();
      if (!order) throw new NotFoundException(`Order not found`);
      if (order.status !== 'disputed') throw new Error('Order is not in dispute');

      if (resolution === 'release') {
        // Nested session usage is tricky, better to call logic directly if possible or pass session
        // For simplicity here, we'll manually implement releaseEscrow logic with current session
        order.escrowStatus = 'released';
        order.status = 'completed';
        order.deliveryConfirmationDate = order.deliveryConfirmationDate || new Date();

        await this.userModel.findByIdAndUpdate(order.vendorId, {
          $inc: {
            pendingBalance: -order.vendorShare,
            walletBalance: order.vendorShare,
            fulfillmentRate: 1
          }
        }).session(session);
      } else if (resolution === 'refund') {
        order.status = 'refunded';
        order.escrowStatus = 'refunded';

        // Deduct from vendor's pending balance
        await this.userModel.findByIdAndUpdate(order.vendorId, {
          $inc: { pendingBalance: -order.vendorShare }
        }).session(session);

        // Credit the customer's wallet balance
        await this.userModel.findByIdAndUpdate(order.customerId, {
          $inc: { walletBalance: order.totalAmount }
        }).session(session);
      }

      const savedOrder = await order.save({ session });
      await session.commitTransaction();

      // Notifications (After transaction)
      const customer = await this.userModel.findById(order.customerId).exec();
      if (customer && customer.email) {
        this.emailService.sendCustomerDisputeResolutionEmail(
          customer.email,
          customer.name || 'Customer',
          order._id.toString(),
          resolution
        ).catch(console.error);
      }

      return savedOrder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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

  async setFirstMileFee(orderId: string, vendorId: string, fee: number): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.vendorId.toString() !== vendorId) throw new ForbiddenException('Unauthorized');

    order.firstMileFee = fee;
    await order.save();

    // Notify customer
    await this.notificationsService.create(order.customerId.toString(), {
      title: 'Delivery Fee Added',
      message: `Vendor ${order.vendorName} has added a delivery fee of GH₵ ${fee} for your order. Please pay on the platform to proceed.`,
      type: 'payment',
      orderId: order._id
    });



    // Notify customer via Email
    const customer = await this.userModel.findById(order.customerId).exec();
    if (customer && customer.email) {
      await this.emailService.sendDeliveryFeeEmail(
        customer.email,
        customer.name || 'Customer',
        order._id.toString(),
        fee
      );
    }

    return order;
  }

  async initializeFirstMilePayment(orderId: string, customerId: string): Promise<{ paymentLink: string }> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.customerId.toString() !== customerId) throw new ForbiddenException('Unauthorized');
    if (order.firstMileFee <= 0) throw new Error('Delivery fee not set yet');

    const paymentLink = await this.hubtelService.initializePayment({
      reference: `FM_${order._id.toString()}_${Date.now()}`,
      amount: order.firstMileFee,
      description: `Delivery Fee for #ORD-${order._id.toString().slice(-6).toUpperCase()}`,
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?order_id=${order._id}`,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?order_id=${order._id}`,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      metadata: {
        orderId: order._id.toString(),
        paymentType: 'first_mile_fee'
      }
    });

    return { paymentLink };
  }

  async handleFirstMilePaymentSuccess(orderId: string, transactionId: string) {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order || order.isFirstMileFeePaid) return;

    order.isFirstMileFeePaid = true;
    order.firstMileFeePaidAt = new Date();
    order.firstMilePaymentId = transactionId;
    order.firstMilePaymentVerifiedByVendor = true; // Auto-verify if paid via Hubtel
    order.firstMilePaymentVerifiedAt = new Date();

    await order.save();

    // Side Effects: Notifications (Decoupled from main logic)
    this.sendFirstMilePaymentNotifications(order);
  }

  private async sendFirstMilePaymentNotifications(order: any) {
    try {
      // Notifications
      await this.notificationsService.create(order.customerId.toString(), {
        title: 'Delivery Payment Verified',
        message: `Your payment for the delivery fee of Order #ORD-${order._id.toString().slice(-6).toUpperCase()} has been verified automatically.`,
        type: 'payment',
        orderId: order._id
      });

      // Notify Vendor
      await this.notificationsService.create(order.vendorId.toString(), {
        title: 'Delivery Fee Paid',
        message: `The delivery fee for Order #ORD-${order._id.toString().slice(-6).toUpperCase()} has been paid via Hubtel.`,
        type: 'payment',
        orderId: order._id
      });

      // Email to Customer
      const customer = await this.userModel.findById(order.customerId).exec();
      if (customer && customer.email) {
        const message = `Your delivery payment for Order #ORD-${order._id.toString().slice(-6).toUpperCase()} has been verified. Shipping in progress!`;
        await this.emailService.sendGenericNotification(customer.email, customer.name || 'Customer', 'Delivery Payment Verified ✅', message);
      }

      // Email to Vendor
      const vendor = await this.userModel.findById(order.vendorId).exec();
      if (vendor && vendor.email) {
        const message = `Delivery fee paid for #ORD-${order._id.toString().slice(-6).toUpperCase()}. You can now ship the item to the station.`;
        await this.emailService.sendGenericNotification(vendor.email, vendor.shopName || vendor.name, 'Action Required: Ship Your Design 🚚', message);
      }
    } catch (err) {
      this.logger.error(`First mile notification failed for order ${order._id}: ${err.message}`);
    }
  }

  // Deprecated manual proof methods
  async submitFirstMilePaymentProof(orderId: string, customerId: string, proofUrl: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.customerId.toString() !== customerId) throw new ForbiddenException('Unauthorized');

    order.firstMilePaymentProof = proofUrl;
    order.firstMilePaymentSubmittedAt = new Date();
    return order.save();
  }

  async verifyFirstMilePayment(orderId: string, vendorId: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.vendorId.toString() !== vendorId) throw new ForbiddenException('Unauthorized');

    order.isFirstMileFeePaid = true;
    order.firstMileFeePaidAt = new Date();
    order.firstMilePaymentVerifiedByVendor = true;
    order.firstMilePaymentVerifiedAt = new Date();

    return order.save();
  }
}
