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

    @Prop()
    tailoringTime: string;

    @Prop()
    region: string;

    @Prop()
    uniqueVendorId: string;

    @Prop({ default: true })
    hasSizes: boolean;

    @Prop({ default: true })
    hasColors: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Single-field indexes
ProductSchema.index({ vendorId: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ region: 1 });

// Compound indexes for most-common queries (eliminates collection scans)
ProductSchema.index({ isActive: 1, createdAt: -1 });       // Homepage latest
ProductSchema.index({ isActive: 1, category: 1 });         // Shop category filter
ProductSchema.index({ isActive: 1, region: 1 });           // Region filter
ProductSchema.index({ isActive: 1, rating: -1 });          // Best seller sort
ProductSchema.index({ name: 'text', description: 'text', vendorName: 'text' }); // Text search
