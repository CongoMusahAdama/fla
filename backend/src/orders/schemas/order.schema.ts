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
}

@Schema({ timestamps: true })
export class Order {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    customerId: Types.ObjectId;

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

    @Prop({
        type: String,
        enum: ['held', 'waiting_approval', 'released', 'refunded', 'frozen'],
        default: 'held'
    })
    escrowStatus: string;

    @Prop()
    deliveryConfirmationDate?: Date;

    @Prop()
    autoReleaseDate?: Date;

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

    @Prop({ default: 0 })
    adminCommission: number;

    @Prop({ default: 0 })
    vendorShare: number;

    @Prop()
    paymentId?: string;

    @Prop()
    paymentRef?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ vendorId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ paymentVerifiedByVendor: 1 });
