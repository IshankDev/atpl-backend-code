import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./users/users.module";
import { SubjectsModule } from "./subjects/subjects.module";
import { QuestionsModule } from "./questions/questions.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { OrdersModule } from "./orders/orders.module";
import { MockTestsModule } from "./mock-tests/mock-tests.module";
import { MockTestResultsModule } from "./mock-test-results/mock-test-results.module";
import { FeedbacksModule } from "./feedbacks/feedbacks.module";
import { AuthModule } from "./auth/auth.module";
import { DashboardModule } from "./dashboard/dashboard.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("MONGODB_URI"),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    SubjectsModule,
    QuestionsModule,
    SubscriptionsModule,
    OrdersModule,
    MockTestsModule,
    MockTestResultsModule,
    FeedbacksModule,
    AuthModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
