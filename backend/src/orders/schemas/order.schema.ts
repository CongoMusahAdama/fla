import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class OrderItem {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    quantity: number;

    @Prop()
    size?: string;

    @Prop()
    color?: string;

    @Prop()
    image?: string;

    @Prop()
    tailoringTime?: string;
}

@Schema({ timestamps: true })
export class Order {
    @Prop({ type: Types.ObjectId, ref: 'User' })
    customerId?: Types.ObjectId;

    @Prop()
    customerName: string;

    @Prop()
    customerEmail: string;

    @Prop()
    customerPhone: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    vendorId: Types.ObjectId;

    @Prop()
    vendorName: string;

    @Prop({ type: [Object], default: [] })
    items: OrderItem[];

    @Prop({ required: true })
    totalAmount: number;

    @Prop({
        type: String,
        enum: [
            'pending',
            'funds_captured',
            'payment_verified',
            'confirmed',
            'processing',
            'in_printing',
            'preparing_shipment',
            'in_transit_to_first_mile',
            'in_transit',
            'arrived_at_first_mile',
            'in_transit_to_last_mile',
            'shipped',
            'delivered',
            'completed',
            'disputed',
            'refunded',
            'cancelled'
        ],
        default: 'pending'
    })
    status: string;

    @Prop()
    deliveryConfirmationDate?: Date;

    @Prop()
    disputeReason?: string;

    @Prop()
    carrier?: string;

    @Prop()
    shippingAddress: string;

    @Prop()
    shippingCity: string;

    @Prop()
    shippingRegion: string;

    @Prop({ type: String, default: 'momo' })
    paymentMethod: string;

    @Prop({ default: false })
    isPaid: boolean;

    @Prop()
    paidAt?: Date;

    @Prop()
    paymentProof?: string;

    @Prop()
    paymentSubmittedAt?: Date;

    @Prop({ default: false })
    paymentVerifiedByVendor: boolean;

    @Prop()
    paymentVerifiedAt?: Date;

    @Prop()
    deliveredAt?: Date;

    @Prop()
    trackingNumber?: string;

    @Prop()
    notes?: string;

    @Prop()
    pickupPoint?: string;

    @Prop({ type: Types.ObjectId, ref: 'LogisticsBranch' })
    pickupBranchId?: Types.ObjectId;

    @Prop({ default: 0 })
    adminCommission: number;

    @Prop({ default: 0 })
    vendorShare: number;

    @Prop({ default: 0 })
    commissionRate: number;

    @Prop()
    paymentId?: string;

    @Prop()
    paymentRef?: string;

    @Prop({
        type: String,
        enum: ['intra-regional', 'inter-regional'],
        default: 'intra-regional'
    })
    deliveryType: string;

    @Prop({ default: 0 })
    firstMileFee: number;

    @Prop({ default: false })
    isFirstMileFeePaid: boolean;

    @Prop()
    firstMileFeePaidAt?: Date;

    @Prop()
    firstMilePaymentProof?: string;

    @Prop()
    firstMilePaymentId?: string;

    @Prop()
    firstMilePaymentSubmittedAt?: Date;

    @Prop({ default: false })
    firstMilePaymentVerifiedByVendor: boolean;

    @Prop()
    firstMilePaymentVerifiedAt?: Date;

    @Prop({ default: 0 })
    deliveryFee: number;

    @Prop({ default: 0 })
    totalProductAmount: number;

    // ─── Referral Fields ──────────────────────────────────────────────────
    /** Referee user who shared the link that sourced this order */
    @Prop({ type: Types.ObjectId, ref: 'User' })
    refereeId?: Types.ObjectId;

    /** Referee code for quick lookup (duplicated for performance) */
    @Prop()
    refereeCode?: string;

    /** 2% of totalProductAmount credited to the referee (GHS) */
    @Prop({ default: 0 })
    refereeCommission: number;

    /** True once the commission has been credited to referee's wallet */
    @Prop({ default: false })
    refereeCommissionPaid: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes for fast lookups and aggregations
OrderSchema.index({ vendorId: 1, createdAt: -1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, isPaid: 1 });
OrderSchema.index({ paymentVerifiedByVendor: 1, paymentSubmittedAt: 1 });
