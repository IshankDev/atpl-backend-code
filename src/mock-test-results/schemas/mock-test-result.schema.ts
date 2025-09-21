import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class MockTestResult extends Document {
  @Prop({ type: Types.ObjectId, ref: "MockTest", required: true })
  mockTestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop([
    {
      questionId: { type: Types.ObjectId, ref: "Question" },
      selectedOptionIndex: { type: Number, default: null },
      isCorrect: Boolean,
      timeTakenSeconds: Number,
    },
  ])
  answers: {
    questionId: Types.ObjectId;
    selectedOptionIndex: number | null;
    isCorrect: boolean;
    timeTakenSeconds: number;
  }[];

  @Prop()
  score: number;

  @Prop()
  percentage: number;

  @Prop()
  completedAt: Date;
}

export const MockTestResultSchema = SchemaFactory.createForClass(MockTestResult);
