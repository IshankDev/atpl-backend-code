import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MockTestResultsService } from "./mock-test-results.service";
import { MockTestResultsController } from "./mock-test-results.controller";
import { MockTestResult, MockTestResultSchema } from "./schemas/mock-test-result.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { MockTest, MockTestSchema } from "../mock-tests/schemas/mock-test.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MockTestResult.name, schema: MockTestResultSchema },
      { name: User.name, schema: UserSchema },
      { name: MockTest.name, schema: MockTestSchema },
    ]),
  ],
  controllers: [MockTestResultsController],
  providers: [MockTestResultsService],
  exports: [MockTestResultsService],
})
export class MockTestResultsModule {}
