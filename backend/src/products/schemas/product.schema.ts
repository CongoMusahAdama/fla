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
}

export const ProductSchema = SchemaFactory.createForClass(Product);
