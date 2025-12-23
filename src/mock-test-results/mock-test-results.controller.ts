import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from "@nestjs/swagger";
import { MockTestResultsService } from "./mock-test-results.service";
import { CreateMockTestResultDto } from "./dto/create-mock-test-result.dto";
import { UpdateMockTestResultDto } from "./dto/update-mock-test-result.dto";

@ApiTags("MockTestResults")
@Controller("mock-test-results")
export class MockTestResultsController {
  constructor(private readonly mockTestResultsService: MockTestResultsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new mock test result" })
  @ApiBody({ type: CreateMockTestResultDto })
  @ApiResponse({
    status: 201,
    description: "Mock test result created successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        mockTestId: "507f1f77bcf86cd799439012",
        userId: "507f1f77bcf86cd799439013",
        answers: [
          {
            questionId: "507f1f77bcf86cd799439014",
            selectedOptionIndex: 2,
            isCorrect: true,
            timeTakenSeconds: 45,
          },
        ],
        score: 85,
        percentage: 85.0,
        completedAt: "2024-01-15T11:30:00.000Z",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  create(@Body() createMockTestResultDto: CreateMockTestResultDto) {
    return this.mockTestResultsService.create(createMockTestResultDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all mock test results with optional filtering" })
  @ApiQuery({ name: "userId", required: false, description: "Filter by user ID", example: "507f1f77bcf86cd799439013" })
  @ApiQuery({
    name: "mockTestId",
    required: false,
    description: "Filter by mock test ID",
    example: "507f1f77bcf86cd799439012",
  })
  @ApiQuery({ name: "minScore", required: false, description: "Minimum score filter", example: "70" })
  @ApiQuery({ name: "maxScore", required: false, description: "Maximum score filter", example: "100" })
  @ApiQuery({ name: "minPercentage", required: false, description: "Minimum percentage filter", example: "80" })
  @ApiQuery({ name: "maxPercentage", required: false, description: "Maximum percentage filter", example: "100" })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search query to filter by student name, email, or test title",
    example: "john",
  })
  @ApiResponse({
    status: 200,
    description: "List of mock test results retrieved successfully",
    schema: {
      example: [
        {
          _id: "507f1f77bcf86cd799439011",
          mockTestId: {
            _id: "507f1f77bcf86cd799439012",
            title: "Mathematics Chapter 1 Assessment",
          },
          userId: {
            _id: "507f1f77bcf86cd799439013",
            name: "John Doe",
          },
          score: 85,
          percentage: 85.0,
          completedAt: "2024-01-15T11:30:00.000Z",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  })
  findAll(
    @Query("userId") userId?: string,
    @Query("mockTestId") mockTestId?: string,
    @Query("minScore") minScore?: string,
    @Query("maxScore") maxScore?: string,
    @Query("minPercentage") minPercentage?: string,
    @Query("maxPercentage") maxPercentage?: string,
    @Query("search") searchQuery?: string
  ) {
    if (searchQuery) {
      return this.mockTestResultsService.findAll(searchQuery);
    }
    if (userId) {
      return this.mockTestResultsService.findByUserId(userId);
    }
    if (mockTestId) {
      return this.mockTestResultsService.findByMockTestId(mockTestId);
    }
    if (minScore && maxScore) {
      return this.mockTestResultsService.findByScoreRange(Number(minScore), Number(maxScore));
    }
    if (minPercentage && maxPercentage) {
      return this.mockTestResultsService.findByPercentageRange(Number(minPercentage), Number(maxPercentage));
    }
    return this.mockTestResultsService.findAll();
  }

  @Get("top-performers")
  @ApiOperation({ summary: "Get top performing students" })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Number of top performers to return",
    example: "10",
  })
  @ApiResponse({
    status: 200,
    description: "Top performers retrieved successfully",
    schema: {
      example: [
        {
          _id: "507f1f77bcf86cd799439011",
          mockTestId: {
            _id: "507f1f77bcf86cd799439012",
            title: "Mathematics Chapter 1 Assessment",
          },
          userId: {
            _id: "507f1f77bcf86cd799439013",
            name: "John Doe",
          },
          score: 95,
          percentage: 95.0,
          completedAt: "2024-01-15T11:30:00.000Z",
        },
      ],
    },
  })
  findTopPerformers(@Query("limit") limit?: string) {
    const limitNumber = limit ? Number(limit) : 10;
    return this.mockTestResultsService.findTopPerformers(limitNumber);
  }

  @Get("user/:userId/test/:mockTestId/history")
  @ApiOperation({ summary: "Get user's test history for a specific mock test" })
  @ApiParam({ name: "userId", description: "User ID", example: "507f1f77bcf86cd799439013" })
  @ApiParam({ name: "mockTestId", description: "Mock test ID", example: "507f1f77bcf86cd799439012" })
  @ApiResponse({
    status: 200,
    description: "User test history retrieved successfully",
    schema: {
      example: [
        {
          _id: "507f1f77bcf86cd799439011",
          score: 85,
          percentage: 85.0,
          completedAt: "2024-01-15T11:30:00.000Z",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  })
  getUserTestHistory(@Param("userId") userId: string, @Param("mockTestId") mockTestId: string) {
    return this.mockTestResultsService.getUserTestHistory(userId, mockTestId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get mock test result by ID" })
  @ApiParam({ name: "id", description: "Mock test result ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({
    status: 200,
    description: "Mock test result retrieved successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        mockTestId: {
          _id: "507f1f77bcf86cd799439012",
          title: "Mathematics Chapter 1 Assessment",
        },
        userId: {
          _id: "507f1f77bcf86cd799439013",
          name: "John Doe",
          email: "john.doe@example.com",
        },
        answers: [
          {
            questionId: {
              _id: "507f1f77bcf86cd799439014",
              question: { text: "What is the value of x in 2x + 5 = 11?" },
            },
            selectedOptionIndex: 2,
            isCorrect: true,
            timeTakenSeconds: 45,
          },
        ],
        score: 85,
        percentage: 85.0,
        completedAt: "2024-01-15T11:30:00.000Z",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Mock test result not found" })
  findOne(@Param("id") id: string) {
    return this.mockTestResultsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update mock test result by ID" })
  @ApiParam({ name: "id", description: "Mock test result ID", example: "507f1f77bcf86cd799439011" })
  @ApiBody({ type: UpdateMockTestResultDto })
  @ApiResponse({
    status: 200,
    description: "Mock test result updated successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        score: 90,
        percentage: 90.0,
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Mock test result not found" })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  update(@Param("id") id: string, @Body() updateMockTestResultDto: UpdateMockTestResultDto) {
    return this.mockTestResultsService.update(id, updateMockTestResultDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete mock test result by ID" })
  @ApiParam({ name: "id", description: "Mock test result ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({ status: 200, description: "Mock test result deleted successfully" })
  @ApiResponse({ status: 404, description: "Mock test result not found" })
  remove(@Param("id") id: string) {
    return this.mockTestResultsService.remove(id);
  }
}
