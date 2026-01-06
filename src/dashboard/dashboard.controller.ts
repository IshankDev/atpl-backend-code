import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";

@ApiTags("Dashboard")
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("stats")
  @ApiOperation({ summary: "Get comprehensive dashboard statistics" })
  @ApiResponse({
    status: 200,
    description: "Dashboard statistics retrieved successfully",
    schema: {
      example: {
        totalStudents: 1247,
        totalSubscriptions: 24,
        totalEnrollments: 850,
        activeSubscriptions: 320,
        totalQuestions: 150,
        totalRevenue: 12500000,
        studentsGrowth: 12.5,
        subscriptionsGrowth: 8.3,
      },
    },
  })
  getStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get("revenue/monthly")
  @ApiOperation({ summary: "Get monthly revenue data for the last 12 months" })
  @ApiResponse({
    status: 200,
    description: "Monthly revenue data retrieved successfully",
    schema: {
      example: [
        { month: "Jan", revenue: 850000 },
        { month: "Feb", revenue: 920000 },
        { month: "Mar", revenue: 780000 },
      ],
    },
  })
  getMonthlyRevenue() {
    return this.dashboardService.getMonthlyRevenue();
  }

  @Get("enrollments/monthly")
  @ApiOperation({ summary: "Get monthly enrollment data for the last 12 months" })
  @ApiResponse({
    status: 200,
    description: "Monthly enrollment data retrieved successfully",
    schema: {
      example: [
        { month: "Jan", enrollments: 45 },
        { month: "Feb", enrollments: 52 },
        { month: "Mar", enrollments: 38 },
      ],
    },
  })
  getMonthlyEnrollments() {
    return this.dashboardService.getMonthlyEnrollments();
  }

  @Get("top-selling-plans")
  @ApiOperation({ summary: "Get top selling subscription plans" })
  @ApiQuery({ name: "limit", required: false, description: "Number of plans to return", example: "5" })
  @ApiResponse({
    status: 200,
    description: "Top selling plans retrieved successfully",
    schema: {
      example: [
        {
          subscriptionId: "507f1f77bcf86cd799439011",
          title: "ATPL Ground School",
          revenue: 2450000,
          enrollments: 156,
          growth: 15.2,
        },
      ],
    },
  })
  getTopSellingPlans(@Query("limit") limit?: string) {
    return this.dashboardService.getTopSellingPlans(limit ? parseInt(limit, 10) : 5);
  }

  @Get("recent-enrollments")
  @ApiOperation({ summary: "Get recent enrollments (orders)" })
  @ApiQuery({ name: "limit", required: false, description: "Number of enrollments to return", example: "5" })
  @ApiResponse({
    status: 200,
    description: "Recent enrollments retrieved successfully",
  })
  getRecentEnrollments(@Query("limit") limit?: string) {
    return this.dashboardService.getRecentEnrollments(limit ? parseInt(limit, 10) : 5);
  }
}
