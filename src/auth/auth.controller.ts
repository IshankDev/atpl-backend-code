import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiHeader } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LogoutDto } from "./dto/logout.dto";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  @ApiOperation({ summary: "User registration" })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    description: "User registered successfully",
    schema: {
      example: {
        message: "User registered successfully. Please verify your email with OTP.",
        user: {
          _id: "507f1f77bcf86cd799439011",
          name: "John Doe",
          email: "john.doe@example.com",
          role: "student",
          isEmailVerified: false,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      },
    },
  })
  @ApiResponse({ status: 409, description: "User with this email already exists" })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: "User login" })
  @ApiBody({ type: LoginDto })
  @ApiHeader({ name: "x-forwarded-for", description: "Client IP address", required: false })
  @ApiHeader({ name: "user-agent", description: "User agent string", required: false })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    schema: {
      example: {
        access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        user: {
          id: "507f1f77bcf86cd799439011",
          name: "John Doe",
          email: "john.doe@example.com",
          role: "student",
        },
        message: "Login successful. All other devices have been logged out.",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Request() req, @Body() loginDto: LoginDto) {
    const clientInfo = (req as any).clientInfo;
    return this.authService.login(loginDto, clientInfo?.ipAddress, clientInfo?.userAgent);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset OTP" })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: "OTP sent successfully",
    schema: {
      example: {
        message: "OTP has been sent to your email address",
      },
    },
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post("verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify OTP for password reset" })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: "OTP verified successfully",
    schema: {
      example: {
        message: "OTP verified successfully. You can now change your password.",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Invalid or expired OTP" })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Change password after OTP verification" })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: "Password changed successfully",
    schema: {
      example: {
        message: "Password changed successfully",
      },
    },
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Body("email") email: string) {
    return this.authService.changePassword(email, changePasswordDto);
  }

  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify email with OTP" })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: "Email verified successfully",
    schema: {
      example: {
        message: "Email verified successfully",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Invalid or expired OTP" })
  async verifyEmail(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyEmailOtp(verifyOtpDto);
  }

  @Post("resend-otp/:type")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resend OTP" })
  @ApiResponse({
    status: 200,
    description: "OTP resent successfully",
    schema: {
      example: {
        message: "OTP has been resent to your email address",
      },
    },
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async resendOtp(@Param("type") type: "signup" | "forgot-password", @Body("email") email: string) {
    return this.authService.resendOtp(email, type);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user profile" })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        name: "John Doe",
        email: "john.doe@example.com",
        role: "student",
        isEmailVerified: true,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProfile(@Request() req) {
    return req.user;
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "User logout" })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({
    status: 200,
    description: "Logout successful",
    schema: {
      example: {
        message: "Logged out successfully",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async logout(@Request() req, @Body() logoutDto: LogoutDto) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      return this.authService.logout(token, logoutDto);
    }
    throw new UnauthorizedException("No token provided");
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user sessions" })
  @ApiResponse({
    status: 200,
    description: "User sessions retrieved successfully",
    schema: {
      example: {
        sessions: [
          {
            id: "507f1f77bcf86cd799439011",
            deviceInfo: "Chrome on Windows 10",
            ipAddress: "192.168.1.100",
            userAgent: "Mozilla/5.0...",
            isActive: true,
            lastActivity: "2024-01-01T12:00:00.000Z",
            createdAt: "2024-01-01T10:00:00.000Z",
            expiresAt: "2024-01-02T10:00:00.000Z",
          },
        ],
        stats: {
          activeSessions: 1,
          totalSessions: 3,
          lastLogin: "2024-01-01T10:00:00.000Z",
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getSessions(@Request() req) {
    return this.authService.getSessionInfo(req.user._id || req.user.id);
  }
}
