import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from "@nestjs/swagger";
import { SubjectsService } from "./subjects.service";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { UpdateSubjectDto } from "./dto/update-subject.dto";

@ApiTags("Subjects")
@Controller("subjects")
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new subject, chapter, or topic" })
  @ApiBody({ type: CreateSubjectDto })
  @ApiResponse({
    status: 201,
    description: "Subject created successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        name: "Mathematics",
        type: "subject",
        parentId: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all subjects with optional filtering" })
  @ApiQuery({
    name: "type",
    required: false,
    description: "Filter by type (subject, chapter, topic)",
    example: "subject",
  })
  @ApiQuery({
    name: "parentId",
    required: false,
    description: "Filter by parent ID",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiResponse({
    status: 200,
    description: "List of subjects retrieved successfully",
    schema: {
      example: [
        {
          _id: "507f1f77bcf86cd799439011",
          name: "Mathematics",
          type: "subject",
          parentId: null,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  })
  findAll(@Query("type") type?: string, @Query("parentId") parentId?: string) {
    if (type) {
      return this.subjectsService.findByType(type);
    }
    if (parentId) {
      return this.subjectsService.findByParentId(parentId);
    }
    return this.subjectsService.findAll();
  }

  @Get("root")
  @ApiOperation({ summary: "Get all root subjects (no parent)" })
  @ApiResponse({
    status: 200,
    description: "Root subjects retrieved successfully",
    schema: {
      example: [
        {
          _id: "507f1f77bcf86cd799439011",
          name: "Mathematics",
          type: "subject",
          parentId: null,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  })
  findRootSubjects() {
    return this.subjectsService.findRootSubjects();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get subject by ID" })
  @ApiParam({ name: "id", description: "Subject ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({
    status: 200,
    description: "Subject retrieved successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        name: "Mathematics",
        type: "subject",
        parentId: null,
        createdAt: "2024-00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Subject not found" })
  findOne(@Param("id") id: string) {
    return this.subjectsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update subject by ID" })
  @ApiParam({ name: "id", description: "Subject ID", example: "507f1f77bcf86cd799439011" })
  @ApiBody({ type: UpdateSubjectDto })
  @ApiResponse({
    status: 200,
    description: "Subject updated successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        name: "Advanced Mathematics",
        type: "subject",
        parentId: null,
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Subject not found" })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  update(@Param("id") id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete subject by ID" })
  @ApiParam({ name: "id", description: "Subject ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({ status: 200, description: "Subject deleted successfully" })
  @ApiResponse({ status: 404, description: "Subject not found" })
  remove(@Param("id") id: string) {
    return this.subjectsService.remove(id);
  }
}
