import { IsEnum, IsNotEmpty, IsOptional, IsString, IsMongoId } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateSubjectDto {
  @ApiProperty({
    description: "Name of the subject, chapter, or topic",
    example: "Mathematics",
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: "Type of the content node",
    enum: ["subject", "chapter", "topic"],
    example: "subject",
  })
  @IsNotEmpty()
  @IsEnum(["subject", "chapter", "topic"])
  type: string;

  @ApiPropertyOptional({
    description: "ID of the parent subject/chapter (null for root subjects)",
    example: "507f1f77bcf86cd799439011",
  })
  @IsOptional()
  @IsMongoId()
  parentId?: string;
}
