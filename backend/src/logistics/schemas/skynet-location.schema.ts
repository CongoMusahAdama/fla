import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SkynetLocationDocument = SkynetLocation & Document;

@Schema({ timestamps: true })
export class SkynetLocation {
    @Prop({ required: true, index: true })
    name: string;

    @Prop({ required: true, index: true })
    zone: string;

    @Prop({ required: false })
    cluster?: string;

    @Prop({ default: 0 })
    deliveryFee: number;

    @Prop({ default: true })
    isActive: boolean;
}

export const SkynetLocationSchema = SchemaFactory.createForClass(SkynetLocation);

// Index for fast case-insensitive lookup
SkynetLocationSchema.index({ name: 1 }, { unique: true });
