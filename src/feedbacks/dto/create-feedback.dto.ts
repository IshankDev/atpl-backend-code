import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsMongoId } from "class-validator";

export class CreateFeedbackDto {
  @ApiPropertyOptional({
    description: "ID of the mock test result this feedback is associated with",
    example: "507f1f77bcf86cd799439011",
  })
  @IsOptional()
  @IsMongoId()
  mockTestResultId?: string;

  @ApiProperty({
    description: "ID of the user (student) this feedback is about",
    example: "507f1f77bcf86cd799439012",
  })
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @ApiPropertyOptional({
    description: "ID of the mock test this feedback is associated with",
    example: "507f1f77bcf86cd799439013",
  })
  @IsOptional()
  @IsMongoId()
  mockTestId?: string;

  @ApiProperty({
    description: "Overall feedback text content",
    example:
      "The student performed well in the mock test. Areas for improvement include navigation systems and weather patterns.",
  })
  @IsNotEmpty()
  @IsString()
  overallFeedback: string;

  @ApiPropertyOptional({
    description: "ID of the user (examiner/admin) who submitted this feedback",
    example: "507f1f77bcf86cd799439014",
  })
  @IsOptional()
  @IsMongoId()
  submittedBy?: string;
}
