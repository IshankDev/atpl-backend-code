import { IsEnum, IsNotEmpty, IsOptional, IsString, IsMongoId, IsNumber, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateSubjectDto {
  @ApiProperty({
    description: "Name of the subject, chapter, topic, or book",
    example: "Mathematics",
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: "Type of the content node",
    enum: ["subject", "chapter", "topic", "book"],
    example: "subject",
  })
  @IsNotEmpty()
  @IsEnum(["subject", "chapter", "topic", "book"])
  type: string;

  @ApiPropertyOptional({
    description: "ID of the parent subject/chapter (null for root subjects)",
    example: "507f1f77bcf86cd799439011",
  })
  @IsOptional()
  @IsMongoId()
  parentId?: string;

  @ApiPropertyOptional({
    description: "Price of the subject (only applicable for subjects)",
    example: 1999,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: "URL of the subject image",
    example: "https://example.com/image.jpg",
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
