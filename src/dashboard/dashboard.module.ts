import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { User, UserSchema } from "../users/schemas/user.schema";
import { Subscription, SubscriptionSchema } from "../subscriptions/schemas/subscription.schema";
import { Order, OrderSchema } from "../orders/schemas/order.schema";
import { Question, QuestionSchema } from "../questions/schemas/question.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
