import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Question extends Document {
  @Prop({ type: Types.ObjectId, refPath: "linkedNodeType" })
  linkedNodeId: Types.ObjectId;

  @Prop({ required: true, enum: ["Subject", "Chapter", "Topic"] })
  linkedNodeType: string;

  @Prop({ required: true, enum: ["mcq", "truefalse", "fillblank"] })
  type: string;

  @Prop({ enum: ["easy", "medium", "hard"], default: "medium" })
  difficulty: string;

  @Prop({
    type: {
      text: String,
      imageUrl: String,
    },
  })
  question: { text: string; imageUrl?: string };

  @Prop([
    {
      text: String,
      imageUrl: String,
    },
  ])
  options: { text: string; imageUrl?: string }[];

  @Prop({
    type: {
      text: String,
      imageUrl: String,
    },
  })
  answer: { text: string; imageUrl?: string };

  @Prop({
    type: {
      text: String,
      imageUrl: String,
      videoUrl: String,
    },
  })
  explanation: { text?: string; imageUrl?: string; videoUrl?: string };
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
