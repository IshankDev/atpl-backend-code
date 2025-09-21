import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MockTestResultsService } from "./mock-test-results.service";
import { MockTestResultsController } from "./mock-test-results.controller";
import { MockTestResult, MockTestResultSchema } from "./schemas/mock-test-result.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: MockTestResult.name, schema: MockTestResultSchema }])],
  controllers: [MockTestResultsController],
  providers: [MockTestResultsService],
  exports: [MockTestResultsService],
})
export class MockTestResultsModule {}
