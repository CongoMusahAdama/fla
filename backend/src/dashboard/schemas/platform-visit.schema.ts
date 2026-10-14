import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlatformVisitDocument = PlatformVisit & Document;

/** One person, one count, per Ghana day. */
@Schema({ timestamps: true })
export class PlatformVisit {
  @Prop({ required: true })
  visitorKey: string;

  @Prop({ required: true })
  dayKey: string;
}

export const PlatformVisitSchema = SchemaFactory.createForClass(PlatformVisit);

PlatformVisitSchema.index({ visitorKey: 1, dayKey: 1 }, { unique: true });
PlatformVisitSchema.index({ dayKey: 1 });
