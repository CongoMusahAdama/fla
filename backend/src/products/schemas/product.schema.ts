import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    price: number;

    @Prop()
    originalPrice?: number;

    @Prop({ required: true })
    category: string;

    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop({ type: [String], default: [] })
    imageLabels: string[];

    @Prop({ type: Types.ObjectId, ref: 'User' })
    vendorId: Types.ObjectId;

    @Prop()
    vendorName: string;

    @Prop({ default: 0 })
    stock: number;

    @Prop({ type: [String], default: [] })
    sizes: string[];

    @Prop({ type: [String], default: [] })
    colors: string[];

    @Prop({ default: 0 })
    rating: number;

    @Prop({ default: 0 })
    reviewCount: number;

    @Prop({ default: false })
    isFeatured: boolean;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: 10 })
    commissionPercentage: number;

    @Prop({ default: 0 })
    adminCommission: number;

    // --- Unity Purchase (Batch) Workflow Fields ---

    @Prop({ default: 1 })
    batchSize: number; // The target number of orders to start production (e.g., 10)

    @Prop({ default: 0 })
    currentBatchCount: number; // How many orders are currently in the gathering phase

    @Prop({ required: true })
    wholesalePrice: number; // The price customers pay to join the batch

    @Prop({
        type: String,
        enum: ['gathering', 'production', 'completed'],
        default: 'gathering'
    })
    batchStatus: string; // gathering = taking orders, production = invisible/sewing, completed = reset

    @Prop()
    batchStartDate?: Date;

    @Prop()
    batchEndDate?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
