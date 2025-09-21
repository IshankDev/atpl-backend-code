import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsMongoId,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class AnswerDto {
  @ApiProperty({
    description: "ID of the question answered",
    example: "507f1f77bcf86cd799439011",
  })
  @IsNotEmpty()
  @IsMongoId()
  questionId: string;

  @ApiPropertyOptional({
    description: "Index of the selected option (for MCQ questions)",
    example: 2,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  selectedOptionIndex?: number | null;

  @ApiProperty({
    description: "Whether the answer is correct",
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({
    description: "Time taken to answer the question in seconds",
    example: 45,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  timeTakenSeconds: number;
}

export class CreateMockTestResultDto {
  @ApiProperty({
    description: "ID of the mock test taken",
    example: "507f1f77bcf86cd799439012",
  })
  @IsNotEmpty()
  @IsMongoId()
  mockTestId: string;

  @ApiProperty({
    description: "ID of the user who took the test",
    example: "507f1f77bcf86cd799439013",
  })
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @ApiProperty({
    description: "Array of answers for each question",
    type: [AnswerDto],
    example: [
      {
        questionId: "507f1f77bcf86cd799439011",
        selectedOptionIndex: 2,
        isCorrect: true,
        timeTakenSeconds: 45,
      },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @ApiProperty({
    description: "Total score achieved in the test",
    example: 85,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  score: number;

  @ApiProperty({
    description: "Percentage score achieved in the test",
    example: 85.0,
    minimum: 0,
    maximum: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiPropertyOptional({
    description: "Timestamp when the test was completed",
    example: "2024-01-15T11:30:00.000Z",
    format: "date-time",
  })
  @IsOptional()
  completedAt?: Date;
}
