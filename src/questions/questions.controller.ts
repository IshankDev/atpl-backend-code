import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery, ApiConsumes } from "@nestjs/swagger";
import { QuestionsService } from "./questions.service";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";

@ApiTags("Questions")
@Controller("questions")
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new question with optional file uploads" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: CreateQuestionDto })
  @UseInterceptors(FilesInterceptor("files"))
  @ApiResponse({
    status: 201,
    description: "Question created successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        linkedNodeId: "507f1f77bcf86cd799439012",
        linkedNodeType: "Chapter",
        type: "mcq",
        difficulty: "medium",
        question: {
          text: "What is the capital of France?",
          imageUrl: "https://example.com/images/question.jpg",
        },
        options: [
          { text: "Paris", imageUrl: null },
          { text: "London", imageUrl: null },
          { text: "Berlin", imageUrl: null },
        ],
        answer: {
          text: "Paris",
          imageUrl: null,
        },
        explanation: {
          text: "Paris is the capital and largest city of France.",
          imageUrl: null,
          videoUrl: null,
        },
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  create(@Body() createQuestionDto: CreateQuestionDto, @UploadedFiles() files: Express.Multer.File[]) {
    // Handle file uploads and update DTO with file URLs
    // This is a basic implementation - you'll need to add file storage logic
    return this.questionsService.create(createQuestionDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all questions with optional filtering" })
  @ApiQuery({
    name: "linkedNodeId",
    required: false,
    description: "Filter by linked node ID",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiQuery({ name: "linkedNodeType", required: false, description: "Filter by linked node type", example: "Chapter" })
  @ApiQuery({ name: "type", required: false, description: "Filter by question type", example: "mcq" })
  @ApiQuery({ name: "difficulty", required: false, description: "Filter by difficulty level", example: "medium" })
  @ApiResponse({
    status: 200,
    description: "List of questions retrieved successfully",
    schema: {
      example: [
        {
          _id: "507f1f77bcf86cd799439011",
          linkedNodeId: "507f1f77bcf86cd799439012",
          linkedNodeType: "Chapter",
          type: "mcq",
          difficulty: "medium",
          question: {
            text: "What is the capital of France?",
            imageUrl: null,
          },
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  })
  findAll(
    @Query("linkedNodeId") linkedNodeId?: string,
    @Query("linkedNodeType") linkedNodeType?: string,
    @Query("type") type?: string,
    @Query("difficulty") difficulty?: string
  ) {
    if (linkedNodeId && linkedNodeType) {
      return this.questionsService.findByLinkedNode(linkedNodeId, linkedNodeType);
    }
    if (type) {
      return this.questionsService.findByType(type);
    }
    if (difficulty) {
      return this.questionsService.findByDifficulty(difficulty);
    }
    return this.questionsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get question by ID" })
  @ApiParam({ name: "id", description: "Question ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({
    status: 200,
    description: "Question retrieved successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        linkedNodeId: "507f1f77bcf86cd799439012",
        linkedNodeType: "Chapter",
        type: "mcq",
        difficulty: "medium",
        question: {
          text: "What is the capital of France?",
          imageUrl: "https://example.com/images/question.jpg",
        },
        options: [
          { text: "Paris", imageUrl: null },
          { text: "London", imageUrl: null },
          { text: "Berlin", imageUrl: null },
        ],
        answer: {
          text: "Paris",
          imageUrl: null,
        },
        explanation: {
          text: "Paris is the capital and largest city of France.",
          imageUrl: null,
          videoUrl: null,
        },
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Question not found" })
  findOne(@Param("id") id: string) {
    return this.questionsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update question by ID with optional file uploads" })
  @ApiConsumes("multipart/form-data")
  @ApiParam({ name: "id", description: "Question ID", example: "507f1f77bcf86cd799439011" })
  @ApiBody({ type: UpdateQuestionDto })
  @UseInterceptors(FilesInterceptor("files"))
  @ApiResponse({
    status: 200,
    description: "Question updated successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        linkedNodeId: "507f1f77bcf86cd799439012",
        linkedNodeType: "Chapter",
        type: "mcq",
        difficulty: "hard",
        question: {
          text: "What is the capital of France?",
          imageUrl: "https://example.com/images/question.jpg",
        },
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Question not found" })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  update(
    @Param("id") id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    // Handle file uploads and update DTO with file URLs
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete question by ID" })
  @ApiParam({ name: "id", description: "Question ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({ status: 200, description: "Question deleted successfully" })
  @ApiResponse({ status: 404, description: "Question not found" })
  remove(@Param("id") id: string) {
    return this.questionsService.remove(id);
  }
}
