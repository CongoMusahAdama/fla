import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TempVerification extends Document {
  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true })
  status: string; // 'verified', 'declined'

  @Prop()
  reference: string;

  @Prop({ type: Object })
  payload: any;
}

export const TempVerificationSchema = SchemaFactory.createForClass(TempVerification);
