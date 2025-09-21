import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, Min, IsPositive } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateSubscriptionDto {
  @ApiProperty({
    description: "Title of the subscription plan",
    example: "Premium Student Plan",
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: "Price of the subscription in currency units",
    example: 99.99,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  pricing: number;

  @ApiPropertyOptional({
    description: "Discount amount in currency units",
    example: 10.0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({
    description: "List of features included in this subscription",
    example: ["Unlimited access", "Premium content", "24/7 support"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featureList?: string[];

  @ApiProperty({
    description: "Number of days the subscription is valid",
    example: 365,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  validForDays: number;

  @ApiPropertyOptional({
    description: "Detailed description of the subscription plan",
    example: "Comprehensive learning package with access to all courses and premium features",
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
