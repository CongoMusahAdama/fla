import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AreaDocument = Area & Document;

/** A town or neighbourhood a vendor added. Buyers pick from this list. */
@Schema({ timestamps: true })
export class Area {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  key: string;

  @Prop()
  region?: string;
}

export const AreaSchema = SchemaFactory.createForClass(Area);
