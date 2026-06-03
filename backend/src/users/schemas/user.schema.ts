import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
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
    region?: string;

    @Prop()
    profileImage?: string;

    @Prop()
    bannerImage?: string;

    @Prop()
    momoNumber?: string;

    @Prop()
    accountName?: string;

    @Prop()
    paystackSubaccountCode?: string;

    @Prop()
    paystackBankCode?: string;

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

    @Prop()
    termsAcceptedAt?: Date;

    @Prop()
    termsVersion?: string;

    @Prop({ default: 'active' })
    status: string;

    @Prop({ default: 'low', enum: ['low', 'high'] })
    vendorTier: string;

    @Prop({ default: Date.now, index: true })
    createdAt: Date;

    @Prop({ unique: true, sparse: true })
    uniqueVendorId?: string;

    // KYC Data
    @Prop()
    ghanaCardFront?: string;

    @Prop()
    ghanaCardBack?: string;

    @Prop()
    ghanaCardNumber?: string;

    @Prop()
    selfie?: string;

    @Prop()
    digitalAddress?: string;

    @Prop()
    dob?: string;

    @Prop()
    utilityBill?: string;

    @Prop()
    businessRegistration?: string;

    @Prop()
    employeeCount?: string;

    @Prop()
    yearsOfExistence?: string;

    @Prop()
    utilityType?: string;

    @Prop({ default: false })
    isIdentityVerified: boolean;

    /** Shufti Pro KYC: pending | submitted | verified | declined */
    @Prop({ default: 'pending' })
    verificationStatus: string;

    @Prop()
    verificationDate?: Date;

    @Prop()
    verificationDeclineReason?: string;

    @Prop()
    kycApprovedAt?: Date;

    @Prop({ default: false })
    isEmailVerified: boolean;

    @Prop()
    resetPasswordToken?: string;

    @Prop()
    resetPasswordExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Performance indexes (email and uniqueVendorId indexed via schema prop unique/sparse flags)
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ shopName: 'text', name: 'text' });
UserSchema.index({ phone: 1 });
