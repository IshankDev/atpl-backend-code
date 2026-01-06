import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: false,
  });

  // Increase body size limit to 10MB (for base64 encoded images)
  // This needs to be done before any routes are registered
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Enable CORS
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001", // Admin frontend (Next.js default)
      "http://localhost:3002", // Alternative port
      /^http:\/\/localhost:\d+$/, // Allow any localhost port for development
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-forwarded-for", "user-agent"],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT") || 3000;

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle("ATPL Gurukul - Learning Management System API")
    .setDescription(
      `Comprehensive API for e-learning platform with user management, content management, assessments, and analytics.

## Key Features:

### User Management
- User CRUD operations with search functionality
- Search users by name, email, or phone number
- User subscription tracking

### Question Management
- Question CRUD operations with advanced filtering
- Search across question text, answers, and explanations
- CSV import for bulk question creation
- Support for MCQ, True/False, and Fill-in-the-blank question types
- File upload support for images and videos

### Order & Enrollment Management
- Order tracking with search, pagination, and filtering
- Archive/unarchive orders functionality
- Order statistics (total students, revenue)
- CSV export for enrollments with date range filtering
- Filter by status, user, subscription, and archived state

### Subscription Management
- Subscription plan management with course bundles
- Support for expiration dates and bundle discounts
- Active subscription tracking

### Mock Test Results
- Test result tracking with search functionality
- Search by student name, email, or test title
- Top performers analytics
- Test history tracking

### Feedback Management
- **Examiner Feedback**: CRUD operations for examiner/admin feedback on student performance
  - Search feedbacks by student name, email, test title, or feedback content
  - Feedback statistics (total, this month, this week, unread)
  - Examiner feedback submission for mock test results
- **Student Submissions**: Separate CRUD operations for student-submitted feedbacks
  - Get all student feedbacks (where submittedBy equals userId)
  - Search student feedbacks by name, email, or message content
  - Student feedback statistics (total, this month, this week, unread)
  - Update and delete student-submitted feedbacks
  - Dedicated endpoints for managing student issues, concerns, and suggestions

### Authentication
- JWT-based authentication
- OTP verification
- Password management
- Session control`
    )
    .setVersion("2.0")
    .addTag("Authentication", "User authentication, login, signup, password management, and session control")
    .addTag("Users", "User management operations with search functionality")
    .addTag("Subjects", "Subject, chapter, and topic management")
    .addTag("Questions", "Question bank with file uploads, CSV import, and advanced search")
    .addTag("Subscriptions", "Subscription plan management with course bundles and expiration tracking")
    .addTag("Orders", "Order and payment tracking with search, pagination, archiving, stats, and CSV export")
    .addTag("MockTests", "Mock test creation and management")
    .addTag("MockTestResults", "Test results and performance analytics with search functionality")
    .addTag(
      "Feedbacks",
      "Feedback management with CRUD operations, search, and statistics. Includes examiner feedbacks and student-submitted feedbacks with separate endpoints and statistics."
    )
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api`);
}
bootstrap();
