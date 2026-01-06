import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsMongoId } from "class-validator";

export class CreateStudentFeedbackDto {
  @ApiPropertyOptional({
    description: "ID of the mock test result this feedback is associated with (optional)",
    example: "507f1f77bcf86cd799439011",
  })
  @IsOptional()
  @IsMongoId()
  mockTestResultId?: string;

  @ApiPropertyOptional({
    description: "ID of the mock test this feedback is associated with (optional)",
    example: "507f1f77bcf86cd799439013",
  })
  @IsOptional()
  @IsMongoId()
  mockTestId?: string;

  @ApiProperty({
    description: "Feedback message, issue, or concern from the student",
    example: "I'm having trouble accessing the course materials. The download links are not working.",
  })
  @IsNotEmpty()
  @IsString()
  overallFeedback: string;
}
