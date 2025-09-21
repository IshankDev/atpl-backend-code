import { IsEnum, IsNotEmpty, IsOptional, IsString, IsMongoId, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class QuestionContentDto {
  @ApiProperty({
    description: "Question text content",
    example: "What is the capital of France?",
    minLength: 1,
    maxLength: 1000,
  })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: "URL to question image (if applicable)",
    example: "https://example.com/images/question.jpg",
    format: "uri",
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

class OptionDto {
  @ApiProperty({
    description: "Option text content",
    example: "Paris",
    minLength: 1,
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: "URL to option image (if applicable)",
    example: "https://example.com/images/option.jpg",
    format: "uri",
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

class ExplanationDto {
  @ApiPropertyOptional({
    description: "Explanation text content",
    example: "Paris is the capital and largest city of France.",
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: "URL to explanation image (if applicable)",
    example: "https://example.com/images/explanation.jpg",
    format: "uri",
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: "URL to explanation video (if applicable)",
    example: "https://example.com/videos/explanation.mp4",
    format: "uri",
  })
  @IsOptional()
  @IsString()
  videoUrl?: string;
}

export class CreateQuestionDto {
  @ApiProperty({
    description: "ID of the linked subject, chapter, or topic",
    example: "507f1f77bcf86cd799439011",
  })
  @IsNotEmpty()
  @IsMongoId()
  linkedNodeId: string;

  @ApiProperty({
    description: "Type of the linked node",
    enum: ["Subject", "Chapter", "Topic"],
    example: "Chapter",
  })
  @IsNotEmpty()
  @IsEnum(["Subject", "Chapter", "Topic"])
  linkedNodeType: string;

  @ApiProperty({
    description: "Type of question",
    enum: ["mcq", "truefalse", "fillblank"],
    example: "mcq",
  })
  @IsNotEmpty()
  @IsEnum(["mcq", "truefalse", "fillblank"])
  type: string;

  @ApiPropertyOptional({
    description: "Difficulty level of the question",
    enum: ["easy", "medium", "hard"],
    default: "medium",
    example: "medium",
  })
  @IsOptional()
  @IsEnum(["easy", "medium", "hard"])
  difficulty?: string;

  @ApiProperty({
    description: "Question content with text and optional image",
    type: QuestionContentDto,
  })
  @ValidateNested()
  @Type(() => QuestionContentDto)
  question: QuestionContentDto;

  @ApiPropertyOptional({
    description: "Array of options for MCQ questions",
    type: [OptionDto],
    example: [
      { text: "Paris", imageUrl: null },
      { text: "London", imageUrl: null },
      { text: "Berlin", imageUrl: null },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options?: OptionDto[];

  @ApiProperty({
    description: "Correct answer with text and optional image",
    type: QuestionContentDto,
  })
  @ValidateNested()
  @Type(() => QuestionContentDto)
  answer: QuestionContentDto;

  @ApiPropertyOptional({
    description: "Explanation with text, image, and video options",
    type: ExplanationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExplanationDto)
  explanation?: ExplanationDto;
}
