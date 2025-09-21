import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class LogoutDto {
  @ApiProperty({
    description: "Logout from all devices (if true, logs out from all devices)",
    example: false,
    required: false,
  })
  @IsOptional()
  logoutAllDevices?: boolean;

  @ApiProperty({
    description: "Specific session ID to logout from",
    example: "507f1f77bcf86cd799439011",
    required: false,
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
}
