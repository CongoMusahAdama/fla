import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WishlistDocument = Wishlist & Document;

@Schema({ timestamps: true })
export class WishlistItem {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop()
    addedAt: Date;
}

@Schema({ timestamps: true })
export class Wishlist {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: Types.ObjectId;

    @Prop({ type: [{ productId: { type: Types.ObjectId, ref: 'Product' }, addedAt: Date }], default: [] })
    items: WishlistItem[];
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);
