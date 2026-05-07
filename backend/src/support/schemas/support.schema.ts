import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupportDocument = Support & Document;

@Schema({ _id: true })
class DisputeMessage {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    senderId: Types.ObjectId;

    @Prop({ required: true })
    senderRole: string;

    @Prop({ required: true })
    message: string;

    @Prop([String])
    attachments: string[];

    @Prop({ default: Date.now })
    createdAt: Date;
}

const DisputeMessageSchema = SchemaFactory.createForClass(DisputeMessage);

@Schema({ timestamps: true })
export class Support {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    vendorId: Types.ObjectId;

    @Prop({ required: true })
    orderId: string;

    @Prop({ required: true })
    category: string;

    @Prop({ required: true })
    description: string;

    @Prop({ default: 'pending' })
    status: string;

    @Prop({ type: [DisputeMessageSchema], default: [] })
    messages: DisputeMessage[];
}

export const SupportSchema = SchemaFactory.createForClass(Support);
