import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Session } from "./schemas/session.schema";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private jwtService: JwtService
  ) {}

  async createSession(
    userId: string,
    token: string,
    deviceInfo: string,
    ipAddress: string,
    userAgent: string
  ): Promise<Session> {
    // Deactivate all existing sessions for this user
    await this.deactivateUserSessions(userId);

    // Create new session
    const session = new this.sessionModel({
      userId: new Types.ObjectId(userId),
      token,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    return session.save();
  }

  async deactivateUserSessions(userId: string): Promise<void> {
    await this.sessionModel.updateMany({ userId: new Types.ObjectId(userId), isActive: true }, { isActive: false });
  }

  async deactivateSession(token: string): Promise<void> {
    await this.sessionModel.updateOne({ token, isActive: true }, { isActive: false });
  }

  async validateSession(token: string): Promise<boolean> {
    const session = await this.sessionModel.findOne({
      token,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (session) {
      // Update last activity
      await this.sessionModel.updateOne({ _id: session._id }, { lastActivity: new Date() });
      return true;
    }

    return false;
  }

  async getActiveSession(userId: string): Promise<Session | null> {
    return this.sessionModel.findOne({
      userId: new Types.ObjectId(userId),
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
  }

  async getAllUserSessions(userId: string): Promise<Session[]> {
    return this.sessionModel
      .find({
        userId: new Types.ObjectId(userId),
      })
      .sort({ createdAt: -1 });
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.sessionModel.updateMany({ expiresAt: { $lt: new Date() } }, { isActive: false });
  }

  async forceLogoutAllDevices(userId: string): Promise<void> {
    await this.deactivateUserSessions(userId);
  }

  async forceLogoutDevice(sessionId: string): Promise<void> {
    await this.sessionModel.updateOne({ _id: sessionId }, { isActive: false });
  }

  async getSessionStats(userId: string): Promise<{
    activeSessions: number;
    totalSessions: number;
    lastLogin: Date | null;
  }> {
    const activeSessions = await this.sessionModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    const totalSessions = await this.sessionModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    const lastSession = await this.sessionModel
      .findOne({
        userId: new Types.ObjectId(userId),
      })
      .sort({ createdAt: -1 });

    return {
      activeSessions,
      totalSessions,
      lastLogin: lastSession?.get("createdAt") || null,
    };
  }
}
