import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, IsMongoId, IsDateString, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateMockTestDto {
  @ApiProperty({
    description: "Title of the mock test",
    example: "Mathematics Chapter 1 Assessment",
    minLength: 2,
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: "Detailed description of the mock test",
    example: "Comprehensive assessment covering algebra fundamentals and problem-solving techniques",
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "ID of the linked subject, chapter, or topic",
    example: "507f1f77bcf86cd799439011",
  })
  @IsOptional()
  @IsMongoId()
  linkedNodeId?: string;

  @ApiPropertyOptional({
    description: "Array of question IDs to include in the test",
    example: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  questionIds?: string[];

  @ApiPropertyOptional({
    description: "Total number of questions in the test",
    example: 25,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalQuestions?: number;

  @ApiPropertyOptional({
    description: "Duration of the test in minutes",
    example: 60,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: "ID of the user who created the test",
    example: "507f1f77bcf86cd799439014",
  })
  @IsOptional()
  @IsMongoId()
  createdBy?: string;

  @ApiPropertyOptional({
    description: "Scheduled start time for the test",
    example: "2024-01-15T10:00:00.000Z",
    format: "date-time",
  })
  @IsOptional()
  @IsDateString()
  startedAt?: string;
}
