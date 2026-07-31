import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BillboardDocument = Billboard & Document;

@Schema({ timestamps: true })
export class Billboard {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  subtitle?: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ default: 'Shop now' })
  ctaLabel?: string;

  /** Optional hard link override (store or external). Prefer product/vendor when set. */
  @Prop()
  linkUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  vendorId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId?: Types.ObjectId;

  @Prop({ required: true, enum: ['hero_main', 'hero_side'], index: true })
  slot: 'hero_main' | 'hero_side';

  @Prop({ required: true, index: true })
  startsAt: Date;

  @Prop({ required: true, index: true })
  endsAt: Date;

  @Prop({ default: true, index: true })
  isActive: boolean;

  /** Higher shows first when multiple ads overlap. */
  @Prop({ default: 0 })
  priority: number;
}

export const BillboardSchema = SchemaFactory.createForClass(Billboard);
BillboardSchema.index({ slot: 1, isActive: 1, startsAt: 1, endsAt: 1, priority: -1 });
