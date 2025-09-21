import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { User } from "../users/schemas/user.schema";
import { OtpService } from "./otp.service";
import { EmailService } from "./email.service";
import { SessionService } from "./session.service";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LogoutDto } from "./dto/logout.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private otpService: OtpService,
    private emailService: EmailService,
    private sessionService: SessionService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email }).exec();
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async validateUserById(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (user) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = { email: user.email, sub: user._id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Create session and deactivate previous sessions
    const deviceInfo = loginDto.deviceInfo?.deviceInfo || "Unknown Device";
    const clientIp = loginDto.deviceInfo?.ipAddress || ipAddress || "Unknown IP";
    const clientUserAgent = loginDto.deviceInfo?.userAgent || userAgent || "Unknown User Agent";

    await this.sessionService.createSession(user._id.toString(), accessToken, deviceInfo, clientIp, clientUserAgent);

    return {
      access_token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "Login successful. All other devices have been logged out.",
    };
  }

  async signup(signupDto: SignupDto) {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: signupDto.email }).exec();
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    // Create user
    const user = new this.userModel({
      ...signupDto,
      password: hashedPassword,
      role: signupDto.role || "student",
      isEmailVerified: false,
    });

    const savedUser = await user.save();

    // Send OTP for email verification
    await this.otpService.createOtp(signupDto.email, "signup");

    // Welcome email will be sent after email verification
    // await this.emailService.sendWelcomeEmail(signupDto.email, signupDto.name);

    const { password, ...result } = savedUser.toObject();
    return {
      message: "User registered successfully. Please verify your email with OTP.",
      user: result,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ email: forgotPasswordDto.email }).exec();
    if (!user) {
      throw new NotFoundException("User with this email not found");
    }

    // Generate and send OTP
    await this.otpService.createOtp(forgotPasswordDto.email, "forgot-password");

    return {
      message: "OTP has been sent to your email address",
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const isValid = await this.otpService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp, "forgot-password");

    if (!isValid) {
      throw new UnauthorizedException("Invalid or expired OTP");
    }

    return {
      message: "OTP verified successfully. You can now change your password.",
    };
  }

  async changePassword(email: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return {
      message: "Password changed successfully",
    };
  }

  async verifyEmailOtp(verifyOtpDto: VerifyOtpDto) {
    const isValid = await this.otpService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp, "signup");

    if (!isValid) {
      throw new UnauthorizedException("Invalid or expired OTP");
    }

    // Mark user email as verified
    const user = await this.userModel.findOne({ email: verifyOtpDto.email }).exec();
    if (user) {
      user.isEmailVerified = true;
      await user.save();

      // Send welcome email after successful email verification
      await this.emailService.sendWelcomeEmail(verifyOtpDto.email, user.name);
    }

    return {
      message: "Email verified successfully. Welcome email has been sent.",
    };
  }

  async resendOtp(email: string, type: "signup" | "forgot-password") {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const success = await this.otpService.resendOtp(email, type);
    if (!success) {
      throw new UnauthorizedException("Failed to resend OTP");
    }

    return {
      message: "OTP has been resent to your email address",
    };
  }

  async logout(token: string, logoutDto: LogoutDto) {
    if (logoutDto.logoutAllDevices) {
      // Get user ID from token
      const decoded = this.jwtService.decode(token) as any;
      if (decoded?.sub) {
        await this.sessionService.forceLogoutAllDevices(decoded.sub);
        return { message: "Logged out from all devices successfully" };
      }
    } else if (logoutDto.sessionId) {
      await this.sessionService.forceLogoutDevice(logoutDto.sessionId);
      return { message: "Logged out from specific device successfully" };
    } else {
      // Logout from current session only
      await this.sessionService.deactivateSession(token);
      return { message: "Logged out successfully" };
    }
  }

  async getSessionInfo(userId: string) {
    const sessions = await this.sessionService.getAllUserSessions(userId);
    const stats = await this.sessionService.getSessionStats(userId);

    return {
      sessions: sessions.map((session) => ({
        id: session._id,
        deviceInfo: session.deviceInfo,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        isActive: session.isActive,
        lastActivity: session.lastActivity,
        createdAt: session.get("createdAt"),
        expiresAt: session.expiresAt,
      })),
      stats,
    };
  }

  async validateSession(token: string): Promise<boolean> {
    return this.sessionService.validateSession(token);
  }
}
