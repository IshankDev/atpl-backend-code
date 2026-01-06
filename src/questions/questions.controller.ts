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
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
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
  create(@Body() body: any, @UploadedFiles() files: Express.Multer.File[]) {
    // Parse FormData fields that are sent as JSON strings
    const createQuestionDto: CreateQuestionDto = {
      linkedNodeId: body.linkedNodeId,
      linkedNodeType: body.linkedNodeType,
      type: body.type,
      difficulty: body.difficulty,
      question: typeof body.question === "string" ? JSON.parse(body.question) : body.question,
      options: body.options ? (typeof body.options === "string" ? JSON.parse(body.options) : body.options) : undefined,
      answer: typeof body.answer === "string" ? JSON.parse(body.answer) : body.answer,
      explanation: body.explanation
        ? typeof body.explanation === "string"
          ? JSON.parse(body.explanation)
          : body.explanation
        : undefined,
    };

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
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search query to filter questions by text in question, answer, or explanation",
    example: "capital",
  })
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
    @Query("difficulty") difficulty?: string,
    @Query("search") searchQuery?: string
  ) {
    return this.questionsService.findAll({
      linkedNodeId,
      linkedNodeType,
      type,
      difficulty,
      searchQuery,
    });
  }

  @Get("stats")
  @ApiOperation({ summary: "Get questions statistics" })
  @ApiResponse({
    status: 200,
    description: "Questions statistics retrieved successfully",
    schema: {
      example: {
        total: 150,
        mcq: 85,
        truefalse: 40,
        fillblank: 25,
      },
    },
  })
  getStats() {
    return this.questionsService.getStats();
  }

  @Get("most-viewed/daily")
  @ApiOperation({ summary: "Get most viewed question (daily basis)" })
  @ApiResponse({
    status: 200,
    description: "Most viewed question retrieved successfully",
    schema: {
      example: {
        questionId: "507f1f77bcf86cd799439011",
        questionText: "What is the primary factor that affects runway friction during aircraft landing?",
        viewCount: 245,
        dailyViewCount: 32,
        type: "mcq",
        difficulty: "medium",
        subject: "Aviation",
        chapter: "Aircraft Operations",
        topic: "Runway Friction",
        correctAnswers: 198,
        incorrectAnswers: 47,
        averageTime: 45,
        accuracy: 80.8,
        date: "2024-01-15",
      },
    },
  })
  @ApiResponse({ status: 200, description: "No questions viewed today", schema: { example: null } })
  getMostViewedQuestionDaily() {
    return this.questionsService.getMostViewedQuestionDaily();
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
  update(@Param("id") id: string, @Body() body: any, @UploadedFiles() files: Express.Multer.File[]) {
    // Parse FormData fields that are sent as JSON strings
    const updateQuestionDto: UpdateQuestionDto = {};

    if (body.linkedNodeId) updateQuestionDto.linkedNodeId = body.linkedNodeId;
    if (body.linkedNodeType) updateQuestionDto.linkedNodeType = body.linkedNodeType;
    if (body.type) updateQuestionDto.type = body.type;
    if (body.difficulty) updateQuestionDto.difficulty = body.difficulty;
    if (body.question) {
      updateQuestionDto.question = typeof body.question === "string" ? JSON.parse(body.question) : body.question;
    }
    if (body.options !== undefined) {
      updateQuestionDto.options = typeof body.options === "string" ? JSON.parse(body.options) : body.options;
    }
    if (body.answer) {
      updateQuestionDto.answer = typeof body.answer === "string" ? JSON.parse(body.answer) : body.answer;
    }
    if (body.explanation !== undefined) {
      updateQuestionDto.explanation =
        typeof body.explanation === "string" ? JSON.parse(body.explanation) : body.explanation;
    }

    // Handle file uploads and update DTO with file URLs
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Post("import-csv")
  @ApiOperation({ summary: "Import questions from CSV file" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor("file"))
  @ApiResponse({
    status: 200,
    description: "Questions imported successfully",
    schema: {
      example: {
        count: 10,
        errors: [],
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Questions imported with some errors",
    schema: {
      example: {
        count: 8,
        errors: ["Row 3: Missing required fields", "Row 7: Invalid question type"],
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - invalid file or format" })
  async importCSV(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error("No file provided");
    }
    return this.questionsService.importFromCSV(file);
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
