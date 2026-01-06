import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  pricing: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop([String])
  featureList: string[];

  @Prop({ required: true })
  validForDays: number;

  @Prop()
  description: string;

  @Prop([String])
  courseIds: string[];

  @Prop()
  expirationDate: Date;

  @Prop({ default: false })
  hasExpiration: boolean;

  @Prop()
  expirationMonths: number;

  @Prop({ default: 0 })
  bundleDiscount: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
