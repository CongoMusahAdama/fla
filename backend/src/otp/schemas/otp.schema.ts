import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true, collection: 'otps' })
export class Otp {
  @Prop({ required: true, unique: true, index: true })
  key: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, index: true })
  expiresAt: Date;

  @Prop({ default: false })
  verified: boolean;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// Auto-delete expired docs (Mongo TTL index)
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
