import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsMongoId, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateOrderDto {
  @ApiProperty({
    description: "ID of the subscription being purchased",
    example: "507f1f77bcf86cd799439011",
  })
  @IsNotEmpty()
  @IsMongoId()
  subscriptionId: string;

  @ApiProperty({
    description: "Unique transaction ID for payment tracking",
    example: "TXN_123456789",
    minLength: 5,
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  transactionId: string;

  @ApiProperty({
    description: "ID of the user making the purchase",
    example: "507f1f77bcf86cd799439012",
  })
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @ApiProperty({
    description: "Total price of the order in currency units",
    example: 99.99,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: "Discount amount applied to the order",
    example: 10.0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({
    description: "Status of the order",
    enum: ["pending", "completed", "failed"],
    default: "pending",
    example: "pending",
  })
  @IsOptional()
  @IsEnum(["pending", "completed", "failed"])
  status?: string;
}
