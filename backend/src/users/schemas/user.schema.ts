import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password?: string; // Optional for users created via OAuth later, but required for local

    @Prop()
    name: string;

    @Prop()
    phone?: string;

    @Prop({ default: 'customer' })
    role: string;

    @Prop()
    shopName?: string;

    @Prop({ type: [Object], default: [] })
    paymentMethods?: Array<{
        network: string;
        accountNumber: string;
        accountName: string;
    }>;

    @Prop()
    bio?: string;

    @Prop()
    productTypes?: string;

    @Prop()
    location?: string;

    @Prop()
    address?: string;

    @Prop()
    profileImage?: string;

    @Prop()
    bannerImage?: string;

    @Prop()
    momoNumber?: string;

    @Prop()
    accountName?: string;

    @Prop({ type: [Object], default: [] })
    withdrawalHistory?: Array<{
        amount: number;
        status: string;
        createdAt: Date;
    }>;

    @Prop({ default: 0 })
    walletBalance: number;

    @Prop({ default: 0 })
    pendingBalance: number;

    // Trust & Verification Fields
    @Prop({ default: false })
    isVerified: boolean;

    @Prop({ type: [String], default: [] })
    verificationBadges: string[];

    @Prop()
    businessName?: string;

    @Prop()
    businessAddress?: string;

    // Vendor Performance Metrics
    @Prop({ default: 0 })
    fulfillmentRate: number; // percentage (0-100)

    @Prop({ default: 0 }) // in hours
    averageTimeToShip: number;

    @Prop({ default: 0 })
    rating: number; // 0-5 stars

    @Prop({ default: 0 })
    reviewCount: number;

    @Prop({ default: 0 })
    reputationScore: number; // calculated score based on multiple factors

    @Prop({ default: 'active' })
    status: string;

    @Prop({ default: Date.now, index: true })
    createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
