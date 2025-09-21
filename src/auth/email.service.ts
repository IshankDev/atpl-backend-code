import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("SMTP_HOST") || "smtp.gmail.com",
      port: this.configService.get<number>("SMTP_PORT") || 587,
      secure: false,
      auth: {
        user: this.configService.get<string>("SMTP_USER"),
        pass: this.configService.get<string>("SMTP_PASS"),
      },
    });
  }

  async sendOtpEmail(email: string, otp: string, type: "signup" | "forgot-password"): Promise<boolean> {
    try {
      const subject = type === "signup" ? "Email Verification OTP" : "Password Reset OTP";
      const title = type === "signup" ? "Verify Your Email" : "Reset Your Password";
      const description =
        type === "signup"
          ? "Please use the OTP code below to verify your email address and complete your registration."
          : "Please use the OTP code below to reset your password and regain access to your account.";

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #F8F8F8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F8F8F8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <!-- Main Content Card -->
                <div style="background-color: #FFFFFF; border-radius: 16px; padding: 40px; max-width: 500px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Logo Section (Replacing the grey circle) -->
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 300; color: #333333;">
                      <span style="font-weight: 700; letter-spacing: 2px;">ATPL</span><br>
                      <span style="font-size: 18px; font-weight: 400; letter-spacing: 3px;">GURUKUL</span>
                    </h1>
                    <div style="height: 2px; background-color: #808080; margin: 0 auto 25px; width: 100%;"></div>
                  </div>

                  <!-- Title -->
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #333333; font-size: 28px; font-weight: 700; margin: 0 0 15px 0;">${title}</h2>
                    <div style="height: 3px; background-color: #808080; margin: 0 auto; width: 60px;"></div>
                  </div>

                  <!-- Description -->
                  <div style="text-align: center; margin-bottom: 30px;">
                    <p style="color: #808080; font-size: 16px; line-height: 1.6; margin: 0; padding: 0 20px;">
                      ${description}
                    </p>
                  </div>

                  <!-- OTP Code -->
                  <div style="text-align: center; margin-bottom: 35px;">
                    <div style="background-color: #F8F8F8; border: 2px solid #E0E0E0; border-radius: 12px; padding: 25px; margin: 0 20px;">
                      <p style="color: #333333; font-size: 14px; margin: 0 0 15px 0; font-weight: 600;">Your OTP Code:</p>
                      <div style="background-color: #8A63C9; color: #FFFFFF; font-size: 32px; font-weight: 700; letter-spacing: 4px; padding: 20px; border-radius: 8px; font-family: 'Courier New', monospace;">
                        ${otp}
                      </div>
                      <p style="color: #666666; font-size: 12px; margin: 15px 0 0 0;">
                        ⏰ This code will expire in 10 minutes
                      </p>
                    </div>
                  </div>

                  <!-- Security Notice -->
                  <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 1px solid #E0E0E0;">
                    <p style="color: #808080; font-size: 14px; line-height: 1.5; margin: 0;">
                      🔒 For security reasons, please do not share this code with anyone.
                    </p>
                    <p style="color: #808080; font-size: 14px; line-height: 1.5; margin: 5px 0 0 0;">
                      If you didn't request this, please ignore this email.
                    </p>
                  </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    This is an automated email. Please do not reply.
                  </p>
                  <p style="color: #999999; font-size: 12px; margin: 5px 0 0 0;">
                    © 2025 ATPL Gurukul. All rights reserved.
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const mailOptions: any = {
        from: this.configService.get<string>("SMTP_FROM") || this.configService.get<string>("SMTP_USER"),
        to: email,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP email sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ATPL Gurukul!</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #F8F8F8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F8F8F8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <!-- Main Content Card -->
                <div style="background-color: #FFFFFF; border-radius: 16px; padding: 40px; max-width: 500px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Logo Section (Replacing the grey circle) -->
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 300; color: #333333;">
                      <span style="font-weight: 700; letter-spacing: 2px;">ATPL</span><br>
                      <span style="font-size: 18px; font-weight: 400; letter-spacing: 3px;">GURUKUL</span>
                    </h1>
                    <div style="height: 2px; background-color: #808080; margin: 0 auto 25px; width: 100%;"></div>
                  </div>

                  <!-- Welcome Message -->
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #333333; font-size: 32px; font-weight: 700; margin: 0 0 15px 0;">Welcome!</h2>
                    <div style="height: 3px; background-color: #808080; margin: 0 auto; width: 60px;"></div>
                  </div>

                  <!-- Body Text -->
                  <div style="text-align: center; margin-bottom: 35px;">
                    <p style="color: #808080; font-size: 16px; line-height: 1.6; margin: 0; padding: 0 20px;">
                      Hello <strong style="color: #333333;">${name}</strong>! Thank you for joining our amazing platform. 
                      We're thrilled to have you on board and can't wait to see what you'll learn with us.
                    </p>
                  </div>

                  <!-- Call to Action Button -->
                  <div style="text-align: center;">
                    <a href="#" style="display: inline-block; background-color: #8A63C9; color: #FFFFFF; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 16px rgba(138, 99, 201, 0.3); transition: all 0.3s ease;">
                      Get Started Now
                    </a>
                  </div>

                  <!-- Additional Info -->
                  <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 1px solid #E0E0E0;">
                    <p style="color: #808080; font-size: 14px; line-height: 1.5; margin: 0;">
                      Ready to explore? Log in to your account and discover all the amazing resources waiting for you.
                    </p>
                  </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    If you have any questions, our support team is here to help.
                  </p>
                  <p style="color: #999999; font-size: 12px; margin: 5px 0 0 0;">
                    © 2025 ATPL Gurukul. All rights reserved.
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const mailOptions: any = {
        from: this.configService.get<string>("SMTP_FROM") || this.configService.get<string>("SMTP_USER"),
        to: email,
        subject: "Welcome to ATPL Gurukul!",
        html,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      return false;
    }
  }
}
