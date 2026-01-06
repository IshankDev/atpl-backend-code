import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({
    description: "Full name of the user",
    example: "John Doe",
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: "Email address of the user (must be unique)",
    example: "john.doe@example.com",
    format: "email",
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Password for user authentication",
    example: "SecurePassword123!",
    minLength: 8,
    maxLength: 128,
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: "Phone number of the user",
    example: "+1234567890",
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: "URL to user's profile image",
    example: "https://example.com/images/profile.jpg",
    format: "uri",
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: "User role in the system",
    enum: ["student", "teacher", "admin"],
    default: "student",
    example: "student",
  })
  @IsOptional()
  @IsEnum(["student", "teacher", "admin"])
  role?: string;

  @ApiPropertyOptional({
    description: "Whether the user is active (default: true)",
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
