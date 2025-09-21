import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT") || 3000;

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle("ATPL Gurukul - Learning Management System API")
    .setDescription(
      "Comprehensive API for e-learning platform with user management, content management, assessments, and analytics"
    )
    .setVersion("1.0")
    .addTag("Authentication", "User authentication, login, signup, password management, and session control")
    .addTag("Users", "User management operations")
    .addTag("Subjects", "Subject, chapter, and topic management")
    .addTag("Questions", "Question bank with file uploads")
    .addTag("Subscriptions", "Subscription plan management")
    .addTag("Orders", "Order and payment tracking")
    .addTag("MockTests", "Mock test creation and management")
    .addTag("MockTestResults", "Test results and performance analytics")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api`);
}
bootstrap();
