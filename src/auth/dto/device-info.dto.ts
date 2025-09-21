import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class DeviceInfoDto {
  @ApiProperty({
    description: "Device information (e.g., 'iPhone 12', 'Chrome on Windows')",
    example: "Chrome on Windows 10",
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceInfo?: string;

  @ApiProperty({
    description: "IP address of the device",
    example: "192.168.1.100",
    required: false,
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiProperty({
    description: "User agent string",
    example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    required: false,
  })
  @IsString()
  @IsOptional()
  userAgent?: string;
}
