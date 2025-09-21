import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Otp } from "./schemas/otp.schema";
import { EmailService } from "./email.service";

@Injectable()
export class OtpService {
  constructor(
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
    private emailService: EmailService
  ) {}

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createOtp(email: string, type: "signup" | "forgot-password"): Promise<string> {
    // Delete any existing OTP for this email and type
    await this.otpModel.deleteMany({ email, type });

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otpDoc = new this.otpModel({
      email,
      otp,
      expiresAt,
      type,
    });

    await otpDoc.save();

    // Send OTP via email
    await this.emailService.sendOtpEmail(email, otp, type);

    return otp;
  }

  async verifyOtp(email: string, otp: string, type: "signup" | "forgot-password"): Promise<boolean> {
    const otpDoc = await this.otpModel.findOne({
      email,
      otp,
      type,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      return false;
    }

    // Mark OTP as used
    otpDoc.isUsed = true;
    await otpDoc.save();

    return true;
  }

  async isOtpExpired(email: string, type: "signup" | "forgot-password"): Promise<boolean> {
    const otpDoc = await this.otpModel.findOne({
      email,
      type,
      isUsed: false,
    });

    if (!otpDoc) {
      return true;
    }

    return otpDoc.expiresAt < new Date();
  }

  async resendOtp(email: string, type: "signup" | "forgot-password"): Promise<boolean> {
    try {
      await this.createOtp(email, type);
      return true;
    } catch (error) {
      return false;
    }
  }
}
