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

    @Prop({ default: Date.now })
    createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
