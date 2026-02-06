import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupportDocument = Support & Document;

@Schema({ timestamps: true })
export class Support {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    orderId: string;

    @Prop({ required: true })
    category: string;

    @Prop({ required: true })
    description: string;

    @Prop({ default: 'pending' })
    status: string;
}

export const SupportSchema = SchemaFactory.createForClass(Support);
