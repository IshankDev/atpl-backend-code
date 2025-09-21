import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Session extends Document {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  deviceInfo: string;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: Date.now })
  lastActivity: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Indexes for better performance
SessionSchema.index({ userId: 1 });
SessionSchema.index({ token: 1 }, { unique: true });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ isActive: 1 });
