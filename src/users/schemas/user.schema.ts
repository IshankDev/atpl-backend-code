import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  imageUrl: string;

  @Prop({ enum: ["student", "teacher", "admin"], default: "student" })
  role: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({
    type: {
      subscriptionId: { type: Types.ObjectId, ref: "Subscription" },
      startDate: Date,
      endDate: Date,
    },
  })
  subscriptionDetail: {
    subscriptionId: Types.ObjectId;
    startDate: Date;
    endDate: Date;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
