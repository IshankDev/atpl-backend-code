import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Otp extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true, type: Date })
  expiresAt: Date;

  @Prop({ default: false })
  isUsed: boolean;

  @Prop({ type: String, enum: ["signup", "forgot-password"], required: true })
  type: string;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// Index for faster queries and automatic cleanup
OtpSchema.index({ email: 1, type: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
