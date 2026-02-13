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
        enum: ['pending', 'confirmed', 'processing', 'in_printing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    })
    status: string;

    @Prop()
    shippingAddress: string;

    @Prop()
    shippingCity: string;

    @Prop()
    shippingRegion: string;

    @Prop({ type: String, enum: ['momo', 'card', 'cash'], default: 'momo' })
    paymentMethod: string;

    @Prop({ default: false })
    isPaid: boolean;

    @Prop()
    paidAt?: Date;

    @Prop()
    paymentProof?: string;

    @Prop()
    deliveredAt?: Date;

    @Prop()
    trackingNumber?: string;

    @Prop()
    notes?: string;

    @Prop({ default: 0 })
    adminCommission: number;

    @Prop({ default: 0 })
    vendorShare: number;

    // --- Unity Purchase (Batch) Workflow Fields ---

    @Prop()
    batchId?: string; // Links this order to a specific production batch (optional for now)

    @Prop({
        type: String,
        enum: ['gathering', 'production', 'completed', 'delivered'],
        default: 'gathering'
    })
    batchStatus?: string; // Tracks the phase of the batch this order belongs to
}

export const OrderSchema = SchemaFactory.createForClass(Order);
