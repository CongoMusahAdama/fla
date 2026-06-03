import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { CheckoutCartDto } from './dto/checkout-cart.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { PaystackService } from '../common/paystack.service';
import { FLA_CONSTANTS } from '../common/constants';
import {
  normalizeWhatsAppPhone,
  buildWaMeLink,
  buildShortCustomerToVendorWaText,
  buildShortVendorToCustomerWaText,
  appendWhatsAppLinkToSms,
} from '../common/whatsapp.util';

import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { SettingsService } from '../settings/settings.service';
import { SmsService } from '../common/sms.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly paystackService: PaystackService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly settingsService: SettingsService,
    private readonly smsService: SmsService,
  ) { }

  async create(createOrderDto: CreateOrderDto): Promise<{ order: Order; paymentLink: string }> {
    return this.createOrderWithPayment(createOrderDto);
  }

  async checkoutCart(
    customerId: string,
    dto: CheckoutCartDto,
  ): Promise<{
    multiVendor: boolean;
    vendorCount: number;
    orders: Array<{
      orderId: string;
      vendorId: string;
      vendorName: string;
      totalAmount: number;
      paymentLink: string;
    }>;
  }> {
    if (!dto.vendorGroups?.length) {
      throw new BadRequestException('Cart is empty');
    }

    const multiVendor = dto.vendorGroups.length > 1;
    const results: Array<{
      orderId: string;
      vendorId: string;
      vendorName: string;
      totalAmount: number;
      paymentLink: string;
    }> = [];

    for (const group of dto.vendorGroups) {
      if (!group.items?.length) {
        throw new BadRequestException('Each vendor group must have at least one item');
      }

      const totalProductAmount = group.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      const createOrderDto: CreateOrderDto = {
        customerId,
        vendorId: group.vendorId,
        vendorName: group.vendorName,
        items: group.items,
        totalProductAmount,
        totalAmount: totalProductAmount,
        deliveryFee: 0,
        shippingAddress: dto.shippingAddress,
        shippingCity: dto.shippingCity,
        shippingRegion: dto.shippingRegion,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        paymentMethod: 'paystack',
        notes: dto.notes || (multiVendor ? 'Multi-vendor bag checkout' : undefined),
      };

      const { order, paymentLink } = await this.createOrderWithPayment(createOrderDto, {
        multiCheckout: multiVendor,
      });

      results.push({
        orderId: (order as OrderDocument)._id.toString(),
        vendorId: group.vendorId,
        vendorName: (order as any).vendorName || group.vendorName || 'Vendor',
        totalAmount: order.totalAmount,
        paymentLink,
      });
    }

    this.logger.log(
      `Checkout cart: ${results.length} order(s) for customer ${customerId} (multiVendor=${multiVendor})`,
    );

    return {
      multiVendor,
      vendorCount: results.length,
      orders: results,
    };
  }

  private async createOrderWithPayment(
    createOrderDto: CreateOrderDto,
    options?: { multiCheckout?: boolean },
  ): Promise<{ order: Order; paymentLink: string }> {
    try {
      const orderId = new Types.ObjectId();

      const deliveryFee = 0;
      const totalProductAmount = createOrderDto.totalProductAmount || createOrderDto.totalAmount;
      const totalAmount = totalProductAmount;

      const fetchedRate = await this.settingsService.getSetting('platform_commission');
      const commissionRate = fetchedRate !== null && fetchedRate !== undefined ? Number(fetchedRate) : FLA_CONSTANTS.DEFAULT_COMMISSION_RATE;
      const adminCommission = totalProductAmount * (commissionRate / 100);
      const vendorShare = totalProductAmount - adminCommission;

      const vendor = await this.userModel.findById(createOrderDto.vendorId).exec();

      const { customerId, vendorId, items, ...remainingDto } = createOrderDto;

      const orderData: any = {
        ...remainingDto,
        customerId: new Types.ObjectId(customerId),
        totalAmount,
        deliveryFee,
        totalProductAmount,
        status: 'pending',
        isPaid: false,
        adminCommission,
        vendorShare,
        commissionRate,
        paymentRef: orderId.toString(),
      };

      if (vendorId) {
        orderData.vendorId = new Types.ObjectId(vendorId);
        if (vendor) {
          orderData.vendorName = vendor.shopName || vendor.name;
        }
      }

      if (createOrderDto.items && createOrderDto.items.length > 0) {
        orderData.items = createOrderDto.items.map(item => ({
          ...item,
          productId: new Types.ObjectId(item.productId),
        }));
      }

      const createdOrder = new this.orderModel({
        ...orderData,
        _id: orderId,
      });
      const savedOrder = await createdOrder.save();

      if (createOrderDto.items && createOrderDto.items.length > 0) {
        for (const item of createOrderDto.items) {
          await this.productModel.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: -item.quantity } },
            { new: true },
          ).exec();
        }
        this.logger.log(`Stock reserved for order ${orderId.toString()}`);
      }

      const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
      const callbackUrl = options?.multiCheckout
        ? `${frontendBase}/dashboard?order_id=${orderId}&multi_checkout=1`
        : `${frontendBase}/dashboard?order_id=${orderId}`;

      const paystackPayload: any = {
        reference: orderId.toString(),
        amount: totalProductAmount,
        email: createOrderDto.customerEmail || 'customer@fla.com',
        callback_url: callbackUrl,
        metadata: {
          orderId: orderId.toString(),
          customerName: createOrderDto.customerName,
          deliveryFee: 0,
          paymentNotes: 'Delivery costs are arranged and paid outside FLA',
          multiCheckout: options?.multiCheckout ? '1' : '0',
        },
      };

      if (vendor?.paystackSubaccountCode) {
        paystackPayload.subaccount = vendor.paystackSubaccountCode;
        paystackPayload.transaction_charge = Math.round(adminCommission * 100);
      }

      const paymentLinkData: any = await this.paystackService.initializePayment(paystackPayload);

      return { order: savedOrder, paymentLink: paymentLinkData.authorization_url };
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      const errorMessage = error.response?.data?.message || error.message || 'Payment gateway error. Please try again.';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async initializePayment(orderId: string, customerId: string): Promise<{ paymentLink: string }> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.customerId.toString() !== customerId) throw new ForbiddenException('Unauthorized');
    if (order.isPaid) throw new BadRequestException('Order is already paid');

    let vendor: any = null;
    if (order.vendorId) {
      vendor = await this.userModel.findById(order.vendorId).exec();
    }

    const totalProductAmount = order.totalProductAmount ?? (order.totalAmount - (order.deliveryFee || 0));
    const adminCommission = order.adminCommission || (totalProductAmount * (FLA_CONSTANTS.DEFAULT_COMMISSION_RATE / 100));

    const paystackPayload: any = {
      reference: `${orderId.toString()}_${Date.now()}`,
      amount: totalProductAmount,
      email: order.customerEmail || 'customer@fla.com',
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?order_id=${orderId}`,
      metadata: {
        orderId: orderId.toString(),
        customerName: order.customerName,
        deliveryFee: 0,
        paymentNotes: 'Delivery costs are arranged and paid outside FLA'
      }
    };

    if (vendor?.paystackSubaccountCode) {
      paystackPayload.subaccount = vendor.paystackSubaccountCode;
      paystackPayload.transaction_charge = Math.round(adminCommission * 100);
    }

    const paymentLinkData: any = await this.paystackService.initializePayment(paystackPayload);

    return { paymentLink: paymentLinkData.authorization_url };
  }

  async handlePaymentSuccess(orderId: string, transactionId: string) {
    let resolvedOrderId = orderId;
    if (!Types.ObjectId.isValid(resolvedOrderId)) {
      const base = orderId.split('_')[0];
      if (Types.ObjectId.isValid(base)) {
        resolvedOrderId = base;
      }
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findById(resolvedOrderId).session(session).exec();
      if (!order || order.isPaid) {
        await session.abortTransaction();
        return;
      }

      order.isPaid = true;
      order.paidAt = new Date();
      order.status = 'payment_verified';
      order.paymentId = transactionId;

      // Stock was already reserved at order creation — mark soldOutAt if applicable
      if (order.items && order.items.length > 0) {
        const soldOutUpdates = order.items.map(async item => {
          const prod = await this.productModel.findById(item.productId).session(session).exec();
          if (prod && prod.stock <= 0 && !prod.soldOutAt) {
            prod.soldOutAt = new Date();
            return prod.save({ session });
          }
        });
        await Promise.all(soldOutUpdates);
      }

      await order.save({ session });
      await session.commitTransaction();

      // Side Effects: Notifications & Emails (Outside transaction for performance)
      const customer = await this.userModel.findById(order.customerId).exec();
      if (customer) {
        this.sendPaymentSuccessNotifications(order, customer);
      }
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Error handling payment success: ${error.message}`, error.stack);
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async sendPaymentSuccessNotifications(order: OrderDocument, customer: UserDocument) {
    try {
      const orderShortId = order._id.toString().slice(-6).toUpperCase();
      const shopName = order.vendorName || 'your vendor';
      const customerName = order.customerName || customer?.name || 'Customer';
      const customerPhone =
        order.customerPhone || customer?.phone || null;

      let vendor: UserDocument | null = null;
      if (order.vendorId) {
        vendor = await this.userModel.findById(order.vendorId).exec();
      }

      const vendorWaPhone = normalizeWhatsAppPhone(vendor?.phone);
      const customerWaPhone = normalizeWhatsAppPhone(customerPhone);

      if (customer?.email) {
        const emailBody = vendorWaPhone
          ? `Payment for Order #ORD-${orderShortId} is verified. Message your vendor on WhatsApp: ${buildWaMeLink(vendorWaPhone, buildShortCustomerToVendorWaText(orderShortId, shopName, customerName))}`
          : `Payment for Order #ORD-${orderShortId} verified! Your vendor has been notified to begin fulfillment.`;
        this.emailService
          .sendGenericNotification(customer.email, customer.name || 'Customer', 'Payment Verified ✅', emailBody)
          .catch(err => this.logger.error(`Payment notification email failed: ${err.message}`));
      }

      // --- SMS + In-App (only after Paystack confirms payment) ---
      if (customer) {
        if (customer.phone) {
          let customerMsg = `FLA: Payment confirmed for #ORD-${orderShortId}. Your vendor will prepare your order.`;
          if (vendorWaPhone) {
            const waLink = buildWaMeLink(
              vendorWaPhone,
              buildShortCustomerToVendorWaText(orderShortId, shopName, customerName),
            );
            customerMsg = appendWhatsAppLinkToSms(customerMsg, waLink);
          }
          this.smsService.sendSms(customer.phone, customerMsg).catch(err =>
            this.logger.error(`Customer payment SMS failed: ${err.message}`),
          );
        }
        this.notificationsService.create(order.customerId.toString(), {
          title: 'Payment Confirmed ✅',
          message: vendorWaPhone
            ? `Order #ORD-${orderShortId} is paid. Open your dashboard or use the WhatsApp link in your SMS to message ${shopName}.`
            : `Your payment for Order #ORD-${orderShortId} has been verified. Your vendor is now preparing your item(s).`,
          type: 'order',
          orderId: order._id,
        }).catch(err => this.logger.error(`Customer in-app notification failed: ${err.message}`));
      }

      if (vendor) {
        if (vendor.phone) {
          let vendorMsg = `FLA: New paid order #ORD-${orderShortId}. Amount GHS ${order.totalAmount}. Begin fulfillment in your dashboard.`;
          if (customerWaPhone) {
            const waLink = buildWaMeLink(
              customerWaPhone,
              buildShortVendorToCustomerWaText(orderShortId, vendor.shopName || shopName, customerName),
            );
            vendorMsg = appendWhatsAppLinkToSms(vendorMsg, waLink);
          }
          this.smsService.sendSms(vendor.phone, vendorMsg).catch(err =>
            this.logger.error(`Vendor payment SMS failed: ${err.message}`),
          );
        }
        this.notificationsService.create(order.vendorId.toString(), {
          title: 'New Order Payment Received 💰',
          message: customerWaPhone
            ? `Order #ORD-${orderShortId} paid — GHS ${order.totalAmount}. WhatsApp link sent via SMS to message ${customerName}.`
            : `Order #ORD-${orderShortId} has been paid — GHS ${order.totalAmount}. Please begin fulfillment immediately.`,
          type: 'order',
          orderId: order._id,
        }).catch(err => this.logger.error(`Vendor in-app notification failed: ${err.message}`));
      }

      const adminMsg = `Payment Confirmed for Order #ORD-${orderShortId} by ${customerName}. Amount: GHS ${order.totalAmount}.`;
      this.smsService.sendAdminNotification(adminMsg).catch(err =>
        this.logger.error(`Admin payment SMS failed: ${err.message}`),
      );
    } catch (err) {
      this.logger.error(`Notification failed for order ${order._id}: ${err.message}`);
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number }> {
    const [orders, total] = await Promise.all([
      this.orderModel.find()
        .populate('vendorId', 'name shopName email phone')
        .populate('customerId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments()
    ]);
    return { orders, total };
  }

  async findByUser(userId: string, page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number }> {
    const query = { customerId: new Types.ObjectId(userId) };
    const [orders, total] = await Promise.all([
      this.orderModel.find(query).populate('vendorId', 'shopName name phone').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.orderModel.countDocuments(query)
    ]);
    return { orders, total };
  }

  async findByVendor(vendorId: string, page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number }> {
    const query = { vendorId: new Types.ObjectId(vendorId) };
    const [orders, total] = await Promise.all([
      this.orderModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.orderModel.countDocuments(query)
    ]);
    return { orders, total };
  }

  private userCanAccessOrder(
    order: OrderDocument,
    user: { role: string; userId: string },
  ): boolean {
    if (user.role === 'admin') return true;
    if (order.customerId.toString() === user.userId) return true;
    const vendorId = order.vendorId?.toString();
    return Boolean(vendorId && vendorId === user.userId);
  }

  async findOne(id: string, user: { role: string; userId: string }): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);

    if (!this.userCanAccessOrder(order, user)) {
      throw new ForbiddenException('You do not have permission to view this order');
    }
    return order;
  }

  async trackOrder(id: string): Promise<Partial<Order>> {
    const order = await this.orderModel.findById(id)
      .select('status items trackingNumber carrier createdAt updatedAt vendorName shippingCity shippingRegion')
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

      if (!this.userCanAccessOrder(order, user)) {
        throw new ForbiddenException('You do not have permission to update this order');
      }

      // Special Handling for Cancellation
      if (updateOrderDto.status === 'cancelled' && order.status !== 'cancelled') {
        // Enforce user's specific cancellation policy
        // Vendor/customer cancellation rules are enforced by role ownership above

        // Paystack splits payment to vendor at checkout — refunds are handled manually if needed.
        // Restore reserved stock so the items go back on sale
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            await this.productModel.findByIdAndUpdate(
              item.productId,
              {
                $inc: { stock: item.quantity },
                // Clear soldOutAt if stock is being restored
                $unset: { soldOutAt: '' }
              },
              { new: true }
            ).session(session).exec();
          }
          this.logger.log(`Stock restored for cancelled order ${id}`);
        }

        // Notify Customer
        await this.notificationsService.create(order.customerId.toString(), {
          title: 'Order Cancelled ⚠️',
          message: `Your Order #ORD-${order._id.toString().slice(-6).toUpperCase()} has been cancelled. ${order.isPaid ? 'The vendor will contact you to process your refund manually.' : ''}`,
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
            `Order #ORD-${order._id.toString().slice(-6).toUpperCase()} was cancelled. ${order.isPaid ? 'Since the payment was already sent to the vendor, they will manually process your refund shortly.' : 'No funds were charged.'}`
          ).catch(err => this.logger.error(`Cancellation email failed: ${err.message}`));
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
          revenue: [
            { $match: { isPaid: true, status: { $nin: ['cancelled', 'refunded'] } } },
            {
              $group: {
                _id: null,
                total: { $sum: '$totalAmount' },
                commission: { $sum: { $ifNull: ['$adminCommission', { $multiply: ['$totalAmount', FLA_CONSTANTS.DEFAULT_COMMISSION_RATE / 100] }] } }
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

    const result = stats[0] || { revenue: [], counts: [] };
    return {
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
            net: { $sum: { $ifNull: ["$adminCommission", { $multiply: ["$totalAmount", FLA_CONSTANTS.DEFAULT_COMMISSION_RATE / 100] }] } }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]);

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const statsByMonth = new Map(
        stats.map(s => [`${s._id.year}-${s._id.month}`, s] as const),
      );

      // Fill in missing months to ensure a continuous 12-month graph
      const fullData: { name: string; gross: number; net: number }[] = [];
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = d.getMonth() + 1;
        const year = d.getFullYear();

        const found = statsByMonth.get(`${year}-${month}`);
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
      
      const vendorId = order.vendorId?.toString();
      if (!isAdmin && (!vendorId || vendorId !== callerId)) {
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

      // Stock was already reserved at order creation — mark soldOutAt if applicable
      if (order.items && order.items.length > 0) {
        const soldOutUpdates = order.items.map(async item => {
          const prod = await this.productModel.findById(item.productId).session(session).exec();
          if (prod && prod.stock <= 0 && !prod.soldOutAt) {
            prod.soldOutAt = new Date();
            return prod.save({ session });
          }
        });
        await Promise.all(soldOutUpdates);
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

    const savedOrder = await order.save();

    // --- Skynet Handover Logic ---
    // If carrier is Skynet, trigger specialized branded notifications
    if (carrier && carrier.toLowerCase().includes('skynet')) {
      const customer = await this.userModel.findById(order.customerId).exec();
      const orderShortId = order._id.toString().slice(-6).toUpperCase();
      const trackId = trackingNumber || 'TBA';

      if (customer) {
        // 1. Send Branded Skynet Email
        if (customer.email) {
          this.emailService.sendSkynetHandoverEmail(
            customer.email,
            customer.name || 'Customer',
            order._id.toString(),
            trackId
          ).catch(err => this.logger.error(`Skynet Email Failed: ${err.message}`));
        }

        // 2. Send Skynet SMS
        if (customer.phone) {
          const smsMsg = `Handover Success! Your Order #ORD-${orderShortId} has been received by Skynet Express. Tracking: ${trackId}. Track on your FLA dashboard.`;
          this.smsService.sendSms(customer.phone, smsMsg).catch(err => this.logger.error(`Skynet SMS Failed: ${err.message}`));
        }

        // 3. In-App Notification
        this.notificationsService.create(customer._id.toString(), {
          title: 'Skynet Handover Complete 🚚',
          message: `Your Order #ORD-${orderShortId} is now with Skynet Express (Tracking: ${trackId}).`,
          type: 'order',
          orderId: order._id
        }).catch(err => this.logger.error(`Skynet In-App Notification Failed: ${err.message}`));
      }
    }

    return savedOrder;
  }

  async confirmReceipt(orderId: string, customerId: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.customerId.toString() !== customerId) throw new NotFoundException('Unauthorized');

    order.status = 'delivered';
    order.deliveryConfirmationDate = new Date();
    order.deliveredAt = new Date();

    return order.save();
  }

  async markAsSatisfied(orderId: string, customerId: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.customerId.toString() !== customerId) throw new ForbiddenException('Unauthorized');

    if (order.status !== 'delivered') {
      throw new Error('Order must be confirmed as received before marking as satisfied');
    }

    order.status = 'completed';
    order.deliveryConfirmationDate = order.deliveryConfirmationDate || new Date();

    return order.save();
  }

  async fileDispute(orderId: string, customerId: string, reason: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.customerId.toString() !== customerId) throw new NotFoundException('Unauthorized');

    order.status = 'disputed';
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

    // --- SMS Notification ---
    const orderShortId = order._id.toString().slice(-6).toUpperCase();
    this.smsService.sendAdminNotification(`Dispute filed for Order #ORD-${orderShortId} by ${customer?.name || 'Customer'}. Reason: ${reason}`).catch(err =>
      this.logger.error(`Admin dispute SMS failed: ${err.message}`),
    );

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
        order.status = 'completed';
        order.deliveryConfirmationDate = order.deliveryConfirmationDate || new Date();
      } else if (resolution === 'refund') {
        order.status = 'refunded';

        // Record refund in customer wallet — Paystack refund may still be processed manually.
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
        ).catch(err => this.logger.error(`Dispute resolution email failed: ${err.message}`));
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
    const [result] = await this.orderModel.aggregate([
      { $match: { vendorId: new Types.ObjectId(vendorId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
    ]);
    return { total: result?.total ?? 0, completed: result?.completed ?? 0 };
  }

  async setFirstMileFee(_orderId: string, _vendorId: string, _fee: number): Promise<Order> {
    throw new BadRequestException('Delivery fees cannot be collected on FLA. Arrange delivery payment directly with the customer.');
  }

  async initializeFirstMilePayment(_orderId: string, _customerId: string): Promise<{ paymentLink: string }> {
    throw new BadRequestException('Delivery fees cannot be paid on FLA. Pay your vendor or courier directly.');
  }

  async handleFirstMilePaymentSuccess(_orderId: string, _transactionId: string) {
    this.logger.warn('Ignored legacy first_mile_fee Paystack webhook — delivery is off-platform');
  }

  async submitFirstMilePaymentProof(_orderId: string, _customerId: string, _proofUrl: string): Promise<Order> {
    throw new BadRequestException('Delivery fee proofs are not accepted on FLA.');
  }

  async verifyFirstMilePayment(_orderId: string, _vendorId: string): Promise<Order> {
    throw new BadRequestException('Delivery fees cannot be verified on FLA.');
  }
}
