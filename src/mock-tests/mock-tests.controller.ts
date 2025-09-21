import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from "@nestjs/swagger";
import { MockTestsService } from "./mock-tests.service";
import { CreateMockTestDto } from "./dto/create-mock-test.dto";
import { UpdateMockTestDto } from "./dto/update-mock-test.dto";

@ApiTags("MockTests")
@Controller("mock-tests")
export class MockTestsController {
  constructor(private readonly mockTestsService: MockTestsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new mock test" })
  @ApiBody({ type: CreateMockTestDto })
  @ApiResponse({
    status: 201,
    description: "Mock test created successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        title: "Mathematics Chapter 1 Assessment",
        description: "Comprehensive assessment covering algebra fundamentals",
        linkedNodeId: "507f1f77bcf86cd799439012",
        questionIds: ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"],
        totalQuestions: 2,
        durationMinutes: 60,
        createdBy: "507f1f77bcf86cd799439015",
        startedAt: "2024-01-15T10:00:00.000Z",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  create(@Body() createMockTestDto: CreateMockTestDto) {
    return this.mockTestsService.create(createMockTestDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all mock tests with optional filtering" })
  @ApiQuery({
    name: "linkedNodeId",
    required: false,
    description: "Filter by linked node ID",
    example: "507f1f77bcf86cd799439012",
  })
  @ApiQuery({
    name: "createdBy",
    required: false,
    description: "Filter by creator ID",
    example: "507f1f77bcf86cd799439015",
  })
  @ApiQuery({ name: "minDuration", required: false, description: "Minimum duration filter (minutes)", example: "30" })
  @ApiQuery({ name: "maxDuration", required: false, description: "Maximum duration filter (minutes)", example: "120" })
  @ApiResponse({
    status: 200,
    description: "List of mock tests retrieved successfully",
    schema: {
      example: [
        {
          _id: "507f1f77bcf86cd799439011",
          title: "Mathematics Chapter 1 Assessment",
          linkedNodeId: {
            _id: "507f1f77bcf86cd799439012",
            name: "Algebra Fundamentals",
            type: "chapter",
          },
          totalQuestions: 25,
          durationMinutes: 60,
          createdBy: {
            _id: "507f1f77bcf86cd799439015",
            name: "John Doe",
          },
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  })
  findAll(
    @Query("linkedNodeId") linkedNodeId?: string,
    @Query("createdBy") createdBy?: string,
    @Query("minDuration") minDuration?: string,
    @Query("maxDuration") maxDuration?: string
  ) {
    if (linkedNodeId) {
      return this.mockTestsService.findByLinkedNode(linkedNodeId);
    }
    if (createdBy) {
      return this.mockTestsService.findByCreatedBy(createdBy);
    }
    if (minDuration && maxDuration) {
      return this.mockTestsService.findByDurationRange(Number(minDuration), Number(maxDuration));
    }
    return this.mockTestsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get mock test by ID" })
  @ApiParam({ name: "id", description: "Mock test ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({
    status: 200,
    description: "Mock test retrieved successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        title: "Mathematics Chapter 1 Assessment",
        description: "Comprehensive assessment covering algebra fundamentals",
        linkedNodeId: {
          _id: "507f1f77bcf86cd799439012",
          name: "Algebra Fundamentals",
          type: "chapter",
        },
        questionIds: [
          {
            _id: "507f1f77bcf86cd799439013",
            question: { text: "What is the value of x in 2x + 5 = 11?" },
          },
        ],
        totalQuestions: 1,
        durationMinutes: 60,
        createdBy: {
          _id: "507f1f77bcf86cd799439015",
          name: "John Doe",
        },
        startedAt: "2024-01-15T10:00:00.000Z",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Mock test not found" })
  findOne(@Param("id") id: string) {
    return this.mockTestsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update mock test by ID" })
  @ApiParam({ name: "id", description: "Mock test ID", example: "507f1f77bcf86cd799439011" })
  @ApiBody({ type: UpdateMockTestDto })
  @ApiResponse({
    status: 200,
    description: "Mock test updated successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        title: "Mathematics Chapter 1 Assessment Updated",
        durationMinutes: 90,
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Mock test not found" })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  update(@Param("id") id: string, @Body() updateMockTestDto: UpdateMockTestDto) {
    return this.mockTestsService.update(id, updateMockTestDto);
  }

  @Patch(":id/add-questions")
  @ApiOperation({ summary: "Add questions to a mock test" })
  @ApiParam({ name: "id", description: "Mock test ID", example: "507f1f77bcf86cd799439011" })
  @ApiBody({ schema: { type: "object", properties: { questionIds: { type: "array", items: { type: "string" } } } } })
  @ApiResponse({
    status: 200,
    description: "Questions added successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        totalQuestions: 3,
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Mock test not found" })
  addQuestions(@Param("id") id: string, @Body("questionIds") questionIds: string[]) {
    return this.mockTestsService.addQuestions(id, questionIds);
  }

  @Patch(":id/remove-questions")
  @ApiOperation({ summary: "Remove questions from a mock test" })
  @ApiParam({ name: "id", description: "Mock test ID", example: "507f1f77bcf86cd799439011" })
  @ApiBody({ schema: { type: "object", properties: { questionIds: { type: "array", items: { type: "string" } } } } })
  @ApiResponse({
    status: 200,
    description: "Questions removed successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        totalQuestions: 1,
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Mock test not found" })
  removeQuestions(@Param("id") id: string, @Body("questionIds") questionIds: string[]) {
    return this.mockTestsService.removeQuestions(id, questionIds);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete mock test by ID" })
  @ApiParam({ name: "id", description: "Mock test ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({ status: 200, description: "Mock test deleted successfully" })
  @ApiResponse({ status: 404, description: "Mock test not found" })
  remove(@Param("id") id: string) {
    return this.mockTestsService.remove(id);
  }
}
