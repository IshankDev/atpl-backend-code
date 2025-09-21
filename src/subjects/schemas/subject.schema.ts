import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Subject extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ["subject", "chapter", "topic"] })
  type: string;

  @Prop({ type: Types.ObjectId, ref: "Subject", default: null })
  parentId: Types.ObjectId;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
