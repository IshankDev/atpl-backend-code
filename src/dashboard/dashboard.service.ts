import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../users/schemas/user.schema";
import { Subscription } from "../subscriptions/schemas/subscription.schema";
import { Order } from "../orders/schemas/order.schema";
import { Question } from "../questions/schemas/question.schema";
import { DashboardStatsDto, MonthlyRevenueDto, MonthlyEnrollmentDto, TopSellingPlanDto } from "./dto/dashboard-stats.dto";

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Question.name) private questionModel: Model<Question>
  ) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const [totalStudents, totalSubscriptions, orders, activeSubscriptions, totalQuestions] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.subscriptionModel.countDocuments().exec(),
      this.orderModel.find().exec(),
      this.subscriptionModel.countDocuments({ validForDays: { $gt: 0 } }).exec(),
      this.questionModel.countDocuments().exec(),
    ]);

    const completedOrders = orders.filter((order) => order.status === "completed");
    const totalEnrollments = completedOrders.length;
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.price, 0);

    // Calculate active subscriptions (users with valid subscription)
    const now = new Date();
    const usersWithActiveSubs = await this.userModel
      .find({
        "subscriptionDetail.endDate": { $gte: now },
      })
      .exec();
    const activeSubscriptionsCount = usersWithActiveSubs.length;

    // Calculate growth (comparing last month to previous month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);

    const previousMonth = new Date(lastMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const lastMonthUsers = await this.userModel.countDocuments({
      createdAt: { $gte: lastMonth },
    }).exec();

    const previousMonthUsers = await this.userModel.countDocuments({
      createdAt: { $gte: previousMonth, $lt: lastMonth },
    }).exec();

    const studentsGrowth = previousMonthUsers > 0 ? ((lastMonthUsers / previousMonthUsers) * 100 - 100) : 0;

    const lastMonthSubscriptions = await this.subscriptionModel.countDocuments({
      createdAt: { $gte: lastMonth },
    }).exec();

    const previousMonthSubscriptions = await this.subscriptionModel.countDocuments({
      createdAt: { $gte: previousMonth, $lt: lastMonth },
    }).exec();

    const subscriptionsGrowth =
      previousMonthSubscriptions > 0 ? ((lastMonthSubscriptions / previousMonthSubscriptions) * 100 - 100) : 0;

    return {
      totalStudents,
      totalSubscriptions,
      totalEnrollments,
      activeSubscriptions: activeSubscriptionsCount,
      totalQuestions,
      totalRevenue,
      studentsGrowth: Math.round(studentsGrowth * 10) / 10,
      subscriptionsGrowth: Math.round(subscriptionsGrowth * 10) / 10,
    };
  }

  async getMonthlyRevenue(): Promise<MonthlyRevenueDto[]> {
    const now = new Date();
    const months: MonthlyRevenueDto[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const monthOrders = await this.orderModel
        .find({
          status: "completed",
          createdAt: {
            $gte: monthStart,
            $lte: monthEnd,
          },
        })
        .exec();

      const revenue = monthOrders.reduce((sum, order) => sum + order.price, 0);

      months.push({
        month: monthNames[monthStart.getMonth()],
        revenue,
      });
    }

    return months;
  }

  async getMonthlyEnrollments(): Promise<MonthlyEnrollmentDto[]> {
    const now = new Date();
    const months: MonthlyEnrollmentDto[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const enrollments = await this.orderModel.countDocuments({
        status: "completed",
        createdAt: {
          $gte: monthStart,
          $lte: monthEnd,
        },
      }).exec();

      months.push({
        month: monthNames[monthStart.getMonth()],
        enrollments,
      });
    }

    return months;
  }

  async getTopSellingPlans(limit: number = 5): Promise<TopSellingPlanDto[]> {
    const completedOrders = await this.orderModel.find({ status: "completed" }).populate("subscriptionId").exec();

    // Group by subscription ID
    const planStats = new Map<string, { revenue: number; enrollments: number; title: string }>();

    completedOrders.forEach((order) => {
      const subscription = order.subscriptionId as any;
      if (!subscription) return;

      const subscriptionId = subscription._id?.toString() || subscription.toString();
      if (!subscriptionId) return;

      const title = subscription?.title || "Unknown Plan";

      if (!planStats.has(subscriptionId)) {
        planStats.set(subscriptionId, {
          revenue: 0,
          enrollments: 0,
          title,
        });
      }

      const stats = planStats.get(subscriptionId)!;
      stats.revenue += order.price;
      stats.enrollments += 1;
    });

    // Convert to array and sort by revenue
    const topPlans: TopSellingPlanDto[] = Array.from(planStats.entries())
      .map(([subscriptionId, stats]) => ({
        subscriptionId,
        title: stats.title,
        revenue: stats.revenue,
        enrollments: stats.enrollments,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    // Calculate growth for each plan (comparing last month to previous month)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    for (const plan of topPlans) {
      const lastMonthOrders = await this.orderModel
        .find({
          status: "completed",
          subscriptionId: plan.subscriptionId,
          createdAt: { $gte: lastMonth },
        })
        .exec();

      const previousMonthOrders = await this.orderModel
        .find({
          status: "completed",
          subscriptionId: plan.subscriptionId,
          createdAt: { $gte: previousMonth, $lt: lastMonth },
        })
        .exec();

      const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.price, 0);
      const previousMonthRevenue = previousMonthOrders.reduce((sum, order) => sum + order.price, 0);

      plan.growth =
        previousMonthRevenue > 0 ? Math.round(((lastMonthRevenue / previousMonthRevenue) * 100 - 100) * 10) / 10 : 0;
    }

    return topPlans;
  }

  async getRecentEnrollments(limit: number = 5): Promise<Order[]> {
    return this.orderModel
      .find({ status: "completed" })
      .populate("userId", "name email")
      .populate("subscriptionId", "title")
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
