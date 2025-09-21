// Auth Module
export { AuthModule } from "./auth.module";

// Services
export { AuthService } from "./auth.service";
export { EmailService } from "./email.service";
export { OtpService } from "./otp.service";
export { SessionService } from "./session.service";

// Controllers
export { AuthController } from "./auth.controller";

// DTOs
export { LoginDto } from "./dto/login.dto";
export { SignupDto } from "./dto/signup.dto";
export { ForgotPasswordDto } from "./dto/forgot-password.dto";
export { VerifyOtpDto } from "./dto/verify-otp.dto";
export { ChangePasswordDto } from "./dto/change-password.dto";
export { LogoutDto } from "./dto/logout.dto";
export { DeviceInfoDto } from "./dto/device-info.dto";

// Guards
export { LocalAuthGuard } from "./guards/local-auth.guard";
export { JwtAuthGuard } from "./guards/jwt-auth.guard";

// Strategies
export { LocalStrategy } from "./strategies/local.strategy";
export { JwtStrategy } from "./strategies/jwt.strategy";

// Schemas
export { Otp } from "./schemas/otp.schema";
export { Session } from "./schemas/session.schema";
