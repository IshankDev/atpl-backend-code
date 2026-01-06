import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { QuestionsService } from "./questions.service";
import { QuestionsController } from "./questions.controller";
import { Question, QuestionSchema } from "./schemas/question.schema";
import { MockTestResult, MockTestResultSchema } from "../mock-test-results/schemas/mock-test-result.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: MockTestResult.name, schema: MockTestResultSchema },
    ]),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
