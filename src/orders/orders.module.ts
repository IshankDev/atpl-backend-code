import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { Order, OrderSchema } from "./schemas/order.schema";
import { Subscription, SubscriptionSchema } from "../subscriptions/schemas/subscription.schema";
import { User, UserSchema } from "../users/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
