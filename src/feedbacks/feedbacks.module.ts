import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FeedbacksService } from "./feedbacks.service";
import { FeedbacksController } from "./feedbacks.controller";
import { Feedback, FeedbackSchema } from "./schemas/feedback.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: Feedback.name, schema: FeedbackSchema }])],
  controllers: [FeedbacksController],
  providers: [FeedbacksService],
  exports: [FeedbacksService],
})
export class FeedbacksModule {}
