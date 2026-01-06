import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { FeedbacksService } from "./feedbacks.service";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { UpdateFeedbackDto } from "./dto/update-feedback.dto";
import { CreateStudentFeedbackDto } from "./dto/create-student-feedback.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Feedbacks")
@ApiBearerAuth()
@Controller("feedbacks")
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Post()
  @ApiOperation({ summary: "Create a new feedback" })
  @ApiBody({ type: CreateFeedbackDto })
  @ApiResponse({
    status: 201,
    description: "Feedback created successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        mockTestResultId: "507f1f77bcf86cd799439012",
        userId: "507f1f77bcf86cd799439013",
        mockTestId: "507f1f77bcf86cd799439014",
        overallFeedback:
          "The student performed well in the mock test. Areas for improvement include navigation systems.",
        submittedBy: "507f1f77bcf86cd799439015",
        createdAt: "2024-01-15T11:30:00.000Z",
        updatedAt: "2024-01-15T11:30:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  create(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbacksService.create(createFeedbackDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all feedbacks with optional search and filtering" })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search query to filter feedbacks by student name, email, test title, or feedback content",
    example: "john",
  })
  @ApiQuery({
    name: "mockTestResultId",
    required: false,
    description: "Filter feedbacks by mock test result ID",
    example: "507f1f77bcf86cd799439012",
  })
  @ApiResponse({
    status: 200,
    description: "List of all feedbacks retrieved successfully",
    schema: {
      example: [
        {
          _id: "507f1f77bcf86cd799439011",
          mockTestResultId: "507f1f77bcf86cd799439012",
          userId: {
            _id: "507f1f77bcf86cd799439013",
            name: "John Doe",
            email: "john@example.com",
          },
          mockTestId: {
            _id: "507f1f77bcf86cd799439014",
            title: "Aviation Principles Mock Test",
          },
          overallFeedback: "The student performed well in the mock test.",
          submittedBy: {
            _id: "507f1f77bcf86cd799439015",
            name: "Dr. Jane Smith",
            email: "jane@example.com",
          },
          createdAt: "2024-01-15T11:30:00.000Z",
          updatedAt: "2024-01-15T11:30:00.000Z",
        },
      ],
    },
  })
  findAll(@Query("search") searchQuery?: string, @Query("mockTestResultId") mockTestResultId?: string) {
    return this.feedbacksService.findAll(searchQuery, mockTestResultId);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get feedback statistics" })
  @ApiResponse({
    status: 200,
    description: "Feedback statistics retrieved successfully",
    schema: {
      example: {
        total: 45,
        thisMonth: 12,
        thisWeek: 5,
        unread: 8,
      },
    },
  })
  getStats() {
    return this.feedbacksService.getStats();
  }

  @Post("from-students")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Create a new student feedback (submitted by the authenticated student)" })
  @ApiBody({ type: CreateStudentFeedbackDto })
  @ApiResponse({
    status: 201,
    description: "Student feedback created successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        userId: "507f1f77bcf86cd799439013",
        overallFeedback: "I'm having trouble accessing the course materials. The download links are not working.",
        submittedBy: "507f1f77bcf86cd799439013",
        createdAt: "2024-01-15T11:30:00.000Z",
        updatedAt: "2024-01-15T11:30:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  @ApiResponse({ status: 401, description: "Unauthorized - authentication required" })
  createStudentFeedback(@Request() req, @Body() createStudentFeedbackDto: CreateStudentFeedbackDto) {
    // Get userId from authenticated user (from JWT token)
    const userId = req.user._id || req.user.id;
    return this.feedbacksService.createStudentFeedback(userId, createStudentFeedbackDto);
  }

  @Get("from-students")
  @ApiOperation({ summary: "Get feedbacks submitted by students (where submittedBy equals userId)" })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search query to filter feedbacks by student name, email, or feedback content",
    example: "john",
  })
  @ApiResponse({
    status: 200,
    description: "List of student-submitted feedbacks retrieved successfully",
    schema: {
      example: [
        {
          _id: "507f1f77bcf86cd799439011",
          userId: {
            _id: "507f1f77bcf86cd799439013",
            name: "John Doe",
            email: "john@example.com",
          },
          overallFeedback: "I'm having trouble accessing the course materials. The download links are not working.",
          submittedBy: {
            _id: "507f1f77bcf86cd799439013",
            name: "John Doe",
            email: "john@example.com",
          },
          createdAt: "2024-01-15T11:30:00.000Z",
          updatedAt: "2024-01-15T11:30:00.000Z",
        },
      ],
    },
  })
  findStudentFeedbacks(@Query("search") searchQuery?: string) {
    return this.feedbacksService.findStudentFeedbacks(searchQuery);
  }

  @Get("from-students/stats")
  @ApiOperation({ summary: "Get student feedback statistics" })
  @ApiResponse({
    status: 200,
    description: "Student feedback statistics retrieved successfully",
    schema: {
      example: {
        total: 25,
        thisMonth: 8,
        thisWeek: 3,
        unread: 5,
      },
    },
  })
  getStudentFeedbackStats() {
    return this.feedbacksService.getStudentFeedbackStats();
  }

  @Get("from-students/:id")
  @ApiOperation({ summary: "Get a single student feedback by ID" })
  @ApiParam({ name: "id", description: "Student feedback ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({
    status: 200,
    description: "Student feedback retrieved successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        userId: {
          _id: "507f1f77bcf86cd799439013",
          name: "John Doe",
          email: "john@example.com",
        },
        overallFeedback: "I'm having trouble accessing the course materials.",
        submittedBy: {
          _id: "507f1f77bcf86cd799439013",
          name: "John Doe",
          email: "john@example.com",
        },
        createdAt: "2024-01-15T11:30:00.000Z",
        updatedAt: "2024-01-15T11:30:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Student feedback not found" })
  findOneStudentFeedback(@Param("id") id: string) {
    return this.feedbacksService.findOneStudentFeedback(id);
  }

  @Patch("from-students/:id")
  @ApiOperation({ summary: "Update a student feedback" })
  @ApiParam({ name: "id", description: "Student feedback ID", example: "507f1f77bcf86cd799439011" })
  @ApiBody({ type: UpdateFeedbackDto })
  @ApiResponse({
    status: 200,
    description: "Student feedback updated successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        userId: "507f1f77bcf86cd799439013",
        overallFeedback: "Updated feedback content",
        createdAt: "2024-01-15T11:30:00.000Z",
        updatedAt: "2024-01-15T12:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Student feedback not found" })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  updateStudentFeedback(@Param("id") id: string, @Body() updateFeedbackDto: UpdateFeedbackDto) {
    return this.feedbacksService.updateStudentFeedback(id, updateFeedbackDto);
  }

  @Delete("from-students/:id")
  @ApiOperation({ summary: "Delete a student feedback" })
  @ApiParam({ name: "id", description: "Student feedback ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({ status: 200, description: "Student feedback deleted successfully" })
  @ApiResponse({ status: 404, description: "Student feedback not found" })
  removeStudentFeedback(@Param("id") id: string) {
    return this.feedbacksService.removeStudentFeedback(id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single feedback by ID" })
  @ApiParam({ name: "id", description: "Feedback ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({
    status: 200,
    description: "Feedback retrieved successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        mockTestResultId: "507f1f77bcf86cd799439012",
        userId: {
          _id: "507f1f77bcf86cd799439013",
          name: "John Doe",
          email: "john@example.com",
        },
        mockTestId: {
          _id: "507f1f77bcf86cd799439014",
          title: "Aviation Principles Mock Test",
        },
        overallFeedback: "The student performed well in the mock test.",
        submittedBy: {
          _id: "507f1f77bcf86cd799439015",
          name: "Dr. Jane Smith",
          email: "jane@example.com",
        },
        createdAt: "2024-01-15T11:30:00.000Z",
        updatedAt: "2024-01-15T11:30:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Feedback not found" })
  findOne(@Param("id") id: string) {
    return this.feedbacksService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a feedback" })
  @ApiParam({ name: "id", description: "Feedback ID", example: "507f1f77bcf86cd799439011" })
  @ApiBody({ type: UpdateFeedbackDto })
  @ApiResponse({
    status: 200,
    description: "Feedback updated successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        mockTestResultId: "507f1f77bcf86cd799439012",
        userId: "507f1f77bcf86cd799439013",
        overallFeedback: "Updated feedback content",
        createdAt: "2024-01-15T11:30:00.000Z",
        updatedAt: "2024-01-15T12:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Feedback not found" })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  update(@Param("id") id: string, @Body() updateFeedbackDto: UpdateFeedbackDto) {
    return this.feedbacksService.update(id, updateFeedbackDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a feedback" })
  @ApiParam({ name: "id", description: "Feedback ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({ status: 200, description: "Feedback deleted successfully" })
  @ApiResponse({ status: 404, description: "Feedback not found" })
  remove(@Param("id") id: string) {
    return this.feedbacksService.remove(id);
  }
}
