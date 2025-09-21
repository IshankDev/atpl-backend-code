import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class ClientInfoMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract real IP address (handles proxy scenarios)
    const clientIp =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      "Unknown IP";

    // Extract user agent
    const userAgent = req.headers["user-agent"] || "Unknown User Agent";

    // Add client info to request object
    (req as any).clientInfo = {
      ipAddress: Array.isArray(clientIp) ? clientIp[0] : clientIp,
      userAgent,
    };

    next();
  }
}
