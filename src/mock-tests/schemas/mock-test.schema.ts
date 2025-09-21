import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class MockTest extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: "Subject", default: null })
  linkedNodeId: Types.ObjectId;

  @Prop([{ type: Types.ObjectId, ref: "Question" }])
  questionIds: Types.ObjectId[];

  @Prop()
  totalQuestions: number;

  @Prop()
  durationMinutes: number;

  @Prop({ type: Types.ObjectId, ref: "User" })
  createdBy: Types.ObjectId;

  @Prop()
  startedAt: Date;
}

export const MockTestSchema = SchemaFactory.createForClass(MockTest);
