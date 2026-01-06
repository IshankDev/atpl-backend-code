export class DashboardStatsDto {
  totalStudents: number;
  totalSubscriptions: number;
  totalEnrollments: number;
  activeSubscriptions: number;
  totalQuestions: number;
  totalRevenue: number;
  studentsGrowth?: number;
  subscriptionsGrowth?: number;
}

export class MonthlyRevenueDto {
  month: string;
  revenue: number;
}

export class MonthlyEnrollmentDto {
  month: string;
  enrollments: number;
}

export class TopSellingPlanDto {
  subscriptionId: string;
  title: string;
  revenue: number;
  enrollments: number;
  growth?: number;
}
