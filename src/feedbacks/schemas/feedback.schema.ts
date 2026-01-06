import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Feedback extends Document {
  @Prop({ type: Types.ObjectId, ref: "MockTestResult", required: false })
  mockTestResultId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "MockTest", required: false })
  mockTestId?: Types.ObjectId;

  @Prop({ required: true, type: String })
  overallFeedback: string;

  @Prop({ type: Types.ObjectId, ref: "User", required: false })
  submittedBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
