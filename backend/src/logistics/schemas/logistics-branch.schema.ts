import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LogisticsBranchDocument = LogisticsBranch & Document;

@Schema({ timestamps: true })
export class LogisticsBranch {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    region: string;

    @Prop({ required: true })
    city: string;

    @Prop({ required: true })
    address: string;

    @Prop({ required: true })
    phone: string;

    @Prop()
    email?: string;

    @Prop({ default: true })
    isAvailable: boolean;

    @Prop({ default: 35 }) // Default base price in GHS
    basePrice: number;

    @Prop({ default: 'Skynet Express' })
    partner: string;
}

export const LogisticsBranchSchema = SchemaFactory.createForClass(LogisticsBranch);

// Index for fast lookup by region
LogisticsBranchSchema.index({ region: 1 });
LogisticsBranchSchema.index({ city: 1 });
