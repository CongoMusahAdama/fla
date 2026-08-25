import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException, InternalServerErrorException, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection, ClientSession } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { CheckoutCartDto } from './dto/checkout-cart.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { PaystackService } from '../common/paystack.service';
import { FLA_CONSTANTS } from '../common/constants';
import { resolveCommissionRate } from '../common/paystack-split.util';
import { getFrontendBaseUrl } from '../common/frontend-url.util';
import {
  normalizeWhatsAppPhone,
  buildWaMeLink,
  buildShortCustomerToVendorWaText,
  buildShortVendorToCustomerWaText,
  appendWhatsAppLinkToSms,
  extractOrderWaDetails,
} from '../common/whatsapp.util';

import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { SettingsService } from '../settings/settings.service';
import { SmsService } from '../common/sms.service';
import { ReferralService } from '../referral/referral.service';

@Injectable()
export class OrdersService implements OnModuleInit {
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
    @Inject(forwardRef(() => ReferralService)) private readonly referralService: ReferralService,
  ) { }

  onModuleInit() {
    const intervalMs = 30 * 60 * 1000;
    setInterval(() => {
      this.purgeAbandonedCheckouts().catch(err =>
        this.logger.error(`Abandoned checkout purge failed: ${err.message}`),
      );
    }, intervalMs);
  }

  /** Paystack checkout started but never paid — not shown in customer/vendor lists */
  private isAbandonedCheckoutFilter() {
    return {
      status: 'pending',
      isPaid: false,
      $or: [{ paymentProof: { $exists: false } }, { paymentProof: null }],
    };
  }

  /** Orders that belong in dashboards (paid, MoMo proof submitted, or past checkout) */
  private listableOrdersFilter(base: Record<string, unknown> = {}) {
    return {
      ...base,
      $nor: [this.isAbandonedCheckoutFilter()],
    };
  }

  private async resolveItemsTailoringTime(
    items: Array<{ productId: Types.ObjectId | string; tailoringTime?: string }>,
  ): Promise<void> {
    const missing = items.filter((item) => !item.tailoringTime);
    if (!missing.length) return;

    const productIds = missing.map((item) => new Types.ObjectId(item.productId));
    const products = await this.productModel
      .find({ _id: { $in: productIds } })
      .select('tailoringTime')
      .exec();
    const tailoringByProductId = new Map(
      products.map((product) => [product._id.toString(), product.tailoringTime]),
    );

    for (const item of missing) {
      const tailoringTime = tailoringByProductId.get(item.productId.toString());
      if (tailoringTime) {
        item.tailoringTime = tailoringTime;
      }
    }
  }

  private async attachTailoringTimeToOrderItems(orders: OrderDocument[]): Promise<void> {
    const itemsNeedingLookup: Array<{
      item: { productId: Types.ObjectId; tailoringTime?: string };
      productId: Types.ObjectId;
    }> = [];

    for (const order of orders) {
      for (const item of order.items || []) {
        if (!item.tailoringTime && item.productId) {
          itemsNeedingLookup.push({ item, productId: item.productId });
        }
      }
    }

    if (!itemsNeedingLookup.length) return;

    const productIds = [...new Set(itemsNeedingLookup.map((entry) => entry.productId.toString()))].map(
      (id) => new Types.ObjectId(id),
    );
    const products = await this.productModel
      .find({ _id: { $in: productIds } })
      .select('tailoringTime')
      .exec();
    const tailoringByProductId = new Map(
      products.map((product) => [product._id.toString(), product.tailoringTime]),
    );

    for (const { item, productId } of itemsNeedingLookup) {
      const tailoringTime = tailoringByProductId.get(productId.toString());
      if (tailoringTime) {
        item.tailoringTime = tailoringTime;
      }
    }
  }

  private async decrementOrderStock(
    items: Array<{ productId: Types.ObjectId; quantity: number }>,
    session?: ClientSession,
  ) {
    for (const item of items) {
      // Atomic + conditional: never drives stock negative even under concurrent purchases.
      const q = this.productModel.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true, session },
      );
      const prod = session ? await q.session(session).exec() : await q.exec();
      if (!prod) {
        this.logger.warn(
          `Stock decrement skipped for product ${item.productId} — insufficient stock at settlement time (race).`,
        );
        continue;
      }
      if (prod.stock <= 0 && !prod.soldOutAt) {
        prod.soldOutAt = new Date();
        await prod.save({ session });
      }
    }
  }

  /** Rejects checkout up front if any cart item is sold out or no longer listed. */
  private async assertItemsInStock(items: Array<{ productId: string; quantity: number; name?: string }>) {
    const productIds = items.map((i) => i.productId).filter((id) => Types.ObjectId.isValid(id));
    const products = await this.productModel
      .find({ _id: { $in: productIds } })
      .select('name stock isActive')
      .lean()
      .exec();
    const byId = new Map(products.map((p: any) => [p._id.toString(), p]));

    for (const item of items) {
      const product = byId.get(item.productId);
      const label = item.name || product?.name || 'This item';
      if (!product || product.isActive === false) {
        throw new BadRequestException(`${label} is no longer available.`);
      }
      if ((product.stock ?? 0) < item.quantity) {
        throw new BadRequestException(`${label} is sold out or doesn't have enough stock left.`);
      }
    }
  }

  /** Remove unpaid Paystack drafts so they do not appear as real orders */
  async purgeAbandonedCheckouts(): Promise<number> {
    const cutoff = new Date(
      Date.now() - FLA_CONSTANTS.ABANDONED_CHECKOUT_HOURS * 60 * 60 * 1000,
    );
    const result = await this.orderModel
      .deleteMany({
        ...this.isAbandonedCheckoutFilter(),
        createdAt: { $lt: cutoff },
      })
      .exec();
    if (result.deletedCount > 0) {
      this.logger.log(`Purged ${result.deletedCount} abandoned checkout(s)`);
    }
    return result.deletedCount;
  }

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
        // Each vendor's order gets its own referee attribution — a cart can mix
        // items discovered via different referees' links.
        refereeCode: group.refereeCode || dto.refereeCode,
        callbackPath: dto.callbackPath,
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

  /** Prevent open redirects: only same-site relative paths, never /auth. */
  private sanitizeCallbackPath(path?: string): string | null {
    if (!path || typeof path !== 'string') return null;
    const trimmed = path.trim();
    if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
    if (trimmed.includes('://') || trimmed.includes('\\')) return null;
    const pathname = trimmed.split('?')[0]?.split('#')[0] || '';
    if (!pathname || pathname.startsWith('/auth')) return null;
    if (!/^\/[a-zA-Z0-9\-._/~%]*$/.test(pathname)) return null;
    return pathname;
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
      const commissionRate = resolveCommissionRate(fetchedRate);
      const adminCommission = totalProductAmount * (commissionRate / 100);
      // Paystack's transaction fee is borne by the platform, deducted from its own commission —
      // not from the vendor's payout. Tracked here for reporting (platform's true net = adminCommission - paystackFee).
      const paystackFee = Math.round(totalProductAmount * (FLA_CONSTANTS.PAYSTACK_FEE_RATE / 100) * 100) / 100;
      const vendorShare = Math.max(0, totalProductAmount - adminCommission);

      const vendor = await this.userModel.findById(createOrderDto.vendorId).exec();

      const { customerId, vendorId, items, callbackPath, refereeCode, ...remainingDto } = createOrderDto;

      if (items?.length) {
        await this.assertItemsInStock(items);
      }

      const hasCustomer =
        !!customerId && Types.ObjectId.isValid(customerId) && String(customerId).length === 24;

      // Resolve referee from code (if provided) to attach commission to order
      let refereeId: Types.ObjectId | undefined;
      let refereeCommission = 0;
      let adjustedVendorShare = vendorShare;
      let refereePaystackSubaccountCode: string | undefined;
      if (refereeCode) {
        const referee = await this.referralService.resolveRefereeByCode(refereeCode);
        if (referee) {
          refereeId = (referee as any)._id;
          refereeCommission = Math.round(totalProductAmount * (FLA_CONSTANTS.REFEREE_COMMISSION_RATE / 100) * 100) / 100;
          adjustedVendorShare = Math.max(0, vendorShare - refereeCommission);
          refereePaystackSubaccountCode = (referee as any).paystackSubaccountCode;
        }
      }

      // Auto-pay the referee directly via a dynamic Paystack split, if both parties are payout-linked.
      // Falls back silently to wallet crediting (on payment success) if this fails for any reason.
      let refereePaidViaSplit = false;
      let paystackSplitCode: string | undefined;
      if (refereeId && refereeCommission > 0 && vendor?.paystackSubaccountCode && refereePaystackSubaccountCode) {
        try {
          const vendorSharePercent = totalProductAmount > 0 ? (adjustedVendorShare / totalProductAmount) * 100 : 0;
          const refereeSharePercent = totalProductAmount > 0 ? (refereeCommission / totalProductAmount) * 100 : 0;
          const split = await this.paystackService.createSplit({
            name: `order-${orderId.toString()}`,
            subaccounts: [
              { subaccount: vendor.paystackSubaccountCode, share: vendorSharePercent },
              { subaccount: refereePaystackSubaccountCode, share: refereeSharePercent },
            ],
          });
          if (split?.split_code) {
            paystackSplitCode = split.split_code;
            refereePaidViaSplit = true;
          }
        } catch (splitError: any) {
          this.logger.error(
            `Referee payout split failed for order ${orderId} — falling back to wallet crediting: ${splitError.message}`,
          );
        }
      }

      const orderData: any = {
        ...remainingDto,
        totalAmount,
        deliveryFee,
        totalProductAmount,
        status: 'pending',
        isPaid: false,
        adminCommission,
        vendorShare: adjustedVendorShare,
        commissionRate,
        paystackFee,
        paymentRef: orderId.toString(),
        ...(refereeId && {
          refereeId,
          refereeCode,
          refereeCommission,
          refereeCommissionPaid: false,
          refereePaidViaSplit,
        }),
      };

      if (hasCustomer) {
        orderData.customerId = new Types.ObjectId(customerId);
      }

      if (vendorId) {
        orderData.vendorId = new Types.ObjectId(vendorId);
        if (vendor) {
          orderData.vendorName = vendor.shopName || vendor.name;
        }
      }

      if (createOrderDto.items && createOrderDto.items.length > 0) {
        const mappedItems = createOrderDto.items.map(item => ({
          ...item,
          productId: new Types.ObjectId(item.productId),
        }));
        await this.resolveItemsTailoringTime(mappedItems);
        orderData.items = mappedItems;
      }

      const createdOrder = new this.orderModel({
        ...orderData,
        _id: orderId,
      });
      const savedOrder = await createdOrder.save();

      const frontendBase = getFrontendBaseUrl('http://localhost:3000');

      // Guests with a storefront return path should not hit /dashboard (forces login).
      // A caller-provided return path (e.g. the referral storefront the buyer checked out from)
      // takes priority for guest AND logged-in buyers alike — otherwise a signed-in shopper
      // buying through a referee's store still gets bounced to their generic dashboard instead
      // of back to that store.
      const sanitizedCallback = this.sanitizeCallbackPath(callbackPath);
      let callbackUrl: string;
      if (sanitizedCallback) {
        callbackUrl = `${frontendBase}${sanitizedCallback}?order_id=${orderId}&paid=1`;
      } else if (!hasCustomer) {
        // Guest without store path → marketplace, not auth/login.
        callbackUrl = `${frontendBase}/shop?order_id=${orderId}&paid=1`;
      } else if (options?.multiCheckout) {
        callbackUrl = `${frontendBase}/dashboard?order_id=${orderId}&multi_checkout=1`;
      } else {
        callbackUrl = `${frontendBase}/dashboard?order_id=${orderId}`;
      }

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
          guest: hasCustomer ? '0' : '1',
        },
      };

      if (paystackSplitCode) {
        // Referee is payout-linked: split settles vendor + referee shares automatically.
        paystackPayload.split_code = paystackSplitCode;
      } else if (vendor?.paystackSubaccountCode) {
        paystackPayload.subaccount = vendor.paystackSubaccountCode;
      }

      let paymentLinkData: any;
      try {
        paymentLinkData = await this.paystackService.initializePayment(paystackPayload);
      } catch (paystackError) {
        await this.orderModel.findByIdAndDelete(orderId).exec();
        throw paystackError;
      }

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
    if (order.customerId?.toString() !== customerId) throw new ForbiddenException('Unauthorized');
    if (order.isPaid) throw new BadRequestException('Order is already paid');

    let vendor: any = null;
    if (order.vendorId) {
      vendor = await this.userModel.findById(order.vendorId).exec();
    }

    const totalProductAmount = order.totalProductAmount ?? (order.totalAmount - (order.deliveryFee || 0));

    const paystackPayload: any = {
      reference: `${orderId.toString()}_${Date.now()}`,
      amount: totalProductAmount,
      email: order.customerEmail || 'customer@fla.com',
      callback_url: `${getFrontendBaseUrl('http://localhost:3000')}/dashboard?order_id=${orderId}`,
      metadata: {
        orderId: orderId.toString(),
        customerName: order.customerName,
        deliveryFee: 0,
        paymentNotes: 'Delivery costs are arranged and paid outside FLA'
      }
    };

    // Re-attempt the referee payout split on retry, using the order's already-stored shares.
    let splitCode: string | undefined;
    let refereePaidViaSplit = false;
    if (order.refereeId && order.refereeCommission > 0 && vendor?.paystackSubaccountCode) {
      const referee = await this.userModel.findById(order.refereeId).select('paystackSubaccountCode').exec();
      if (referee?.paystackSubaccountCode) {
        try {
          const vendorSharePercent = totalProductAmount > 0 ? (order.vendorShare / totalProductAmount) * 100 : 0;
          const refereeSharePercent = totalProductAmount > 0 ? (order.refereeCommission / totalProductAmount) * 100 : 0;
          const split = await this.paystackService.createSplit({
            name: `order-${orderId.toString()}-retry-${Date.now()}`,
            subaccounts: [
              { subaccount: vendor.paystackSubaccountCode, share: vendorSharePercent },
              { subaccount: referee.paystackSubaccountCode, share: refereeSharePercent },
            ],
          });
          if (split?.split_code) {
            splitCode = split.split_code;
            refereePaidViaSplit = true;
          }
        } catch (splitError: any) {
          this.logger.error(`Referee payout split retry failed for order ${orderId}: ${splitError.message}`);
        }
      }
    }

    if (splitCode) {
      paystackPayload.split_code = splitCode;
    } else if (vendor?.paystackSubaccountCode) {
      paystackPayload.subaccount = vendor.paystackSubaccountCode;
    }

    // Keep the stored flag in sync with what THIS attempt will actually do, so
    // creditRefereeCommission credits the wallet correctly if the split didn't happen.
    if (order.refereeId && order.refereePaidViaSplit !== refereePaidViaSplit) {
      await this.orderModel.findByIdAndUpdate(orderId, { refereePaidViaSplit }).exec();
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

      if (order.items && order.items.length > 0) {
        await this.decrementOrderStock(order.items, session);
      }

      await order.save({ session });
      await session.commitTransaction();

      // Side Effects: Notifications & Emails (Outside transaction for performance)
      const customer = order.customerId
        ? await this.userModel.findById(order.customerId).exec()
        : null;
      this.sendPaymentSuccessNotifications(order, customer);

      // Referee commission crediting (fire-and-forget, outside transaction)
      if (order.refereeId && !order.refereeCommissionPaid) {
        this.referralService
          .creditRefereeCommission(order)
          .catch((err) =>
            this.logger.error(`Referee commission credit failed for order ${order._id}: ${err.message}`),
          );
      }
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Error handling payment success: ${error.message}`, error.stack);
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async sendPaymentSuccessNotifications(
    order: OrderDocument,
    customer: UserDocument | null,
  ) {
    try {
      const orderShortId = order._id.toString().slice(-6).toUpperCase();
      const shopName = order.vendorName || 'your vendor';
      const customerName = order.customerName || customer?.name || 'Customer';
      // Prefer checkout WhatsApp/phone on the order (guests often only provide this)
      const customerSmsPhone =
        order.customerPhone || customer?.phone || null;

      let vendor: UserDocument | null = null;
      if (order.vendorId) {
        vendor = await this.userModel.findById(order.vendorId).exec();
      }

      const vendorWaPhone = normalizeWhatsAppPhone(vendor?.phone);
      const customerWaPhone = normalizeWhatsAppPhone(customerSmsPhone);
      const vendorSmsPhone = vendor?.phone || null;
      const waDetails = extractOrderWaDetails(order);

      if (customer?.email) {
        const emailBody = vendorWaPhone
          ? `Payment for Order #ORD-${orderShortId} is verified. Message your vendor on WhatsApp: ${buildWaMeLink(vendorWaPhone, buildShortCustomerToVendorWaText(orderShortId, shopName, customerName, waDetails))}`
          : `Payment for Order #ORD-${orderShortId} verified! Your vendor has been notified to begin fulfillment.`;
        this.emailService
          .sendGenericNotification(customer.email, customer.name || 'Customer', 'Payment Verified ✅', emailBody)
          .catch(err => this.logger.error(`Payment notification email failed: ${err.message}`));
      }

      // --- SMS + In-App (only after Paystack confirms payment) ---
      if (customerSmsPhone) {
        const productSnippet = waDetails.productName
          ? ` ${waDetails.productName}.`
          : '';
        let customerMsg = `FLA: Payment confirmed for #ORD-${orderShortId}.${productSnippet} Your vendor will prepare your order.`;
        if (vendorWaPhone) {
          const waLink = buildWaMeLink(
            vendorWaPhone,
            buildShortCustomerToVendorWaText(orderShortId, shopName, customerName, waDetails),
          );
          customerMsg = appendWhatsAppLinkToSms(customerMsg, waLink);
        }
        this.smsService.sendSms(customerSmsPhone, customerMsg).then((ok) => {
          if (!ok) {
            this.logger.error(
              `Customer payment SMS failed for #ORD-${orderShortId}: ${this.smsService.lastError || 'unknown'}`,
            );
          }
        }).catch(err =>
          this.logger.error(`Customer payment SMS failed: ${err.message}`),
        );
      } else {
        this.logger.warn(
          `Customer payment SMS skipped for #ORD-${orderShortId}: no phone on order or account`,
        );
      }

      if (order.customerId) {
        this.notificationsService.create(order.customerId.toString(), {
          title: 'Payment Confirmed ✅',
          message: vendorWaPhone
            ? `Order #ORD-${orderShortId} is paid. Open your dashboard or use the WhatsApp link in your SMS to message ${shopName}.`
            : `Order #ORD-${orderShortId} is paid. Open your dashboard to message ${shopName}.`,
          type: 'order',
          orderId: order._id,
        }).catch(err => this.logger.error(`Failed to notify customer: ${err.message}`));
      }

      if (vendor) {
        if (vendorSmsPhone) {
          const productSnippet = waDetails.productName
            ? ` ${waDetails.productName}.`
            : '';
          let vendorMsg = `FLA: New paid order #ORD-${orderShortId}.${productSnippet} Amount GHS ${order.totalAmount}. Begin fulfillment in your dashboard.`;
          if (customerWaPhone) {
            const waLink = buildWaMeLink(
              customerWaPhone,
              buildShortVendorToCustomerWaText(orderShortId, vendor.shopName || shopName, customerName, waDetails),
            );
            vendorMsg = appendWhatsAppLinkToSms(vendorMsg, waLink);
          }
          this.smsService.sendSms(vendorSmsPhone, vendorMsg).then((ok) => {
            if (!ok) {
              this.logger.error(
                `Vendor payment SMS failed for #ORD-${orderShortId}: ${this.smsService.lastError || 'unknown'}`,
              );
            }
          }).catch(err =>
            this.logger.error(`Vendor payment SMS failed: ${err.message}`),
          );
        } else {
          this.logger.warn(
            `Vendor payment SMS skipped for #ORD-${orderShortId}: vendor has no phone`,
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
        .populate('vendorId', 'name shopName email phone momoNumber')
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
    await this.purgeAbandonedCheckouts();
    const query = this.listableOrdersFilter({ customerId: new Types.ObjectId(userId) });
    const [orders, total] = await Promise.all([
      this.orderModel.find(query).populate('vendorId', 'shopName name phone momoNumber').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.orderModel.countDocuments(query)
    ]);
    await this.attachTailoringTimeToOrderItems(orders);
    return { orders, total };
  }

  async findByVendor(vendorId: string, page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number }> {
    await this.purgeAbandonedCheckouts();
    const query = this.listableOrdersFilter({ vendorId: new Types.ObjectId(vendorId) });
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
    if (order.customerId?.toString() === user.userId) return true;
    const vendorId = order.vendorId?.toString();
    return Boolean(vendorId && vendorId === user.userId);
  }

  async findOne(id: string, user: { role: string; userId: string }): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);

    if (!this.userCanAccessOrder(order, user)) {
      throw new ForbiddenException('You do not have permission to view this order');
    }
    await this.attachTailoringTimeToOrderItems([order]);
    return order;
  }

  async trackOrder(id: string): Promise<Partial<Order>> {
    const order = await this.orderModel.findById(id)
      .select('status items trackingNumber carrier createdAt updatedAt vendorName shippingCity shippingRegion')
      .exec();
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    await this.attachTailoringTimeToOrderItems([order]);
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

        // Restore stock only when payment had completed (stock was decremented on pay)
        if (order.isPaid && order.items && order.items.length > 0) {
          for (const item of order.items) {
            await this.productModel.findByIdAndUpdate(
              item.productId,
              {
                $inc: { stock: item.quantity },
                $unset: { soldOutAt: '' }
              },
              { new: true }
            ).session(session).exec();
          }
          this.logger.log(`Stock restored for cancelled order ${id}`);
        }

        // Notify Customer
        if (order.customerId) {
          await this.notificationsService.create(order.customerId.toString(), {
            title: 'Order Cancelled ⚠️',
            message: `Your Order #ORD-${order._id.toString().slice(-6).toUpperCase()} has been cancelled. ${order.isPaid ? 'The vendor will contact you to process your refund manually.' : ''}`,
            type: 'order',
            orderId: order._id
          });
        }

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

      if (order.items && order.items.length > 0) {
        await this.decrementOrderStock(order.items, session);
      }

      const savedOrder = await order.save({ session });
      await session.commitTransaction();

      const customer = savedOrder.customerId
        ? await this.userModel.findById(savedOrder.customerId).exec()
        : null;
      this.sendPaymentSuccessNotifications(savedOrder, customer);

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
    if (order.customerId?.toString() !== customerId) throw new NotFoundException('Unauthorized');

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
    if (order.customerId?.toString() !== customerId) throw new NotFoundException('Unauthorized');

    order.status = 'delivered';
    order.deliveryConfirmationDate = new Date();
    order.deliveredAt = new Date();

    return order.save();
  }

  async markAsSatisfied(orderId: string, customerId: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException(`Order not found`);
    if (order.customerId?.toString() !== customerId) throw new ForbiddenException('Unauthorized');

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
    if (order.customerId?.toString() !== customerId) throw new NotFoundException('Unauthorized');

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
