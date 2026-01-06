import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Order } from "./schemas/order.schema";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { OrderStatsDto } from "./dto/order-stats.dto";
import { Subscription } from "../subscriptions/schemas/subscription.schema";
import { User } from "../users/schemas/user.schema";

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const createdOrder = new this.orderModel(createOrderDto);
    const savedOrder = await createdOrder.save();

    // If order is created with completed status, update user subscription
    if (savedOrder.status === "completed") {
      const populatedOrder = await this.orderModel
        .findById(savedOrder._id)
        .populate("subscriptionId")
        .populate("userId")
        .exec();
      if (populatedOrder) {
        await this.updateUserSubscription(populatedOrder);
      }
    }

    return savedOrder;
  }

  async findAll(filters?: {
    userId?: string;
    subscriptionId?: string;
    status?: string;
    searchQuery?: string;
    page?: number;
    limit?: number;
    includeArchived?: boolean;
  }): Promise<Order[]> {
    const query: any = {};

    // Filter by isArchived (default: exclude archived unless includeArchived is true)
    if (!filters?.includeArchived) {
      query.isArchived = { $ne: true };
    }

    if (filters?.userId) {
      query.userId = filters.userId;
    }

    if (filters?.subscriptionId) {
      query.subscriptionId = filters.subscriptionId;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    // Handle search query - need to use aggregation for populated fields
    if (filters?.searchQuery) {
      const searchRegex = new RegExp(filters.searchQuery, "i");

      // Use aggregation pipeline to search in populated fields
      const pipeline: any[] = [
        { $match: query },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $lookup: {
            from: "subscriptions",
            localField: "subscriptionId",
            foreignField: "_id",
            as: "subscription",
          },
        },
        {
          $match: {
            $or: [
              { transactionId: { $regex: searchRegex } },
              { "user.name": { $regex: searchRegex } },
              { "user.email": { $regex: searchRegex } },
              { "subscription.title": { $regex: searchRegex } },
            ],
          },
        },
        {
          $addFields: {
            userId: { $arrayElemAt: ["$user", 0] },
            subscriptionId: { $arrayElemAt: ["$subscription", 0] },
          },
        },
        {
          $project: {
            user: 0,
            subscription: 0,
          },
        },
      ];

      // Add pagination
      if (filters?.page && filters?.limit) {
        const skip = (filters.page - 1) * filters.limit;
        pipeline.push({ $skip: skip }, { $limit: filters.limit });
      }

      const results = await this.orderModel.aggregate(pipeline).exec();

      // Convert to proper Order documents
      return results.map((result) => {
        const order = new this.orderModel(result);
        return order;
      });
    }

    // No search query - use regular find with pagination
    let queryBuilder = this.orderModel.find(query).populate("subscriptionId").populate("userId");

    if (filters?.page && filters?.limit) {
      const skip = (filters.page - 1) * filters.limit;
      queryBuilder = queryBuilder.skip(skip).limit(filters.limit);
    }

    return queryBuilder.exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).populate("subscriptionId").populate("userId").exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return this.orderModel.find({ userId }).populate("subscriptionId").populate("userId").exec();
  }

  async findBySubscriptionId(subscriptionId: string): Promise<Order[]> {
    return this.orderModel.find({ subscriptionId }).populate("subscriptionId").populate("userId").exec();
  }

  async findByStatus(status: string): Promise<Order[]> {
    return this.orderModel.find({ status }).populate("subscriptionId").populate("userId").exec();
  }

  async findByTransactionId(transactionId: string): Promise<Order | null> {
    return this.orderModel.findOne({ transactionId }).populate("subscriptionId").populate("userId").exec();
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    // Get the current order to check if status is changing to "completed"
    const currentOrder = await this.orderModel.findById(id).exec();
    const isStatusChangingToCompleted =
      updateOrderDto.status === "completed" && currentOrder && currentOrder.status !== "completed";

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true })
      .populate("subscriptionId")
      .populate("userId")
      .exec();
    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // If status changed to completed, update user subscription
    if (isStatusChangingToCompleted) {
      await this.updateUserSubscription(updatedOrder);
    }

    return updatedOrder;
  }

  async updateStatus(id: string, status: string): Promise<Order> {
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .populate("subscriptionId")
      .populate("userId")
      .exec();
    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // If order is completed, update user subscription details
    if (status === "completed") {
      await this.updateUserSubscription(updatedOrder);
    }

    return updatedOrder;
  }

  /**
   * Update user subscription details when an order is completed
   * Calculates expiration date based on expirationMonths or expirationDate
   */
  private async updateUserSubscription(order: Order): Promise<void> {
    const subscription = await this.subscriptionModel.findById(order.subscriptionId).exec();
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${order.subscriptionId} not found`);
    }

    const user = await this.userModel.findById(order.userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${order.userId} not found`);
    }

    const startDate = new Date();
    let endDate: Date | null = null;

    // Calculate end date based on expiration logic
    if (subscription.hasExpiration) {
      if (subscription.expirationMonths && subscription.expirationMonths > 0) {
        // Use expirationMonths (new logic)
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + subscription.expirationMonths);
      } else if (subscription.expirationDate) {
        // Fallback to expirationDate (backward compatibility)
        endDate = new Date(subscription.expirationDate);
      } else if (subscription.validForDays && subscription.validForDays > 0) {
        // Fallback to validForDays (legacy)
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + subscription.validForDays);
      }
    }

    // Update user subscription details
    await this.userModel.findByIdAndUpdate(order.userId, {
      subscriptionDetail: {
        subscriptionId: new Types.ObjectId(subscription._id),
        startDate: startDate,
        endDate: endDate,
      },
    });
  }

  async archive(id: string): Promise<Order> {
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, { isArchived: true }, { new: true })
      .populate("subscriptionId")
      .populate("userId")
      .exec();
    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return updatedOrder;
  }

  async getStats(): Promise<OrderStatsDto> {
    const completedOrders = await this.orderModel.find({ status: "completed" }).exec();

    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.price, 0);
    const uniqueUserIds = new Set(completedOrders.map((order) => order.userId.toString()));
    const totalStudents = uniqueUserIds.size;

    return {
      totalStudents,
      totalRevenue,
    };
  }

  async exportCSV(startDate: string, endDate: string): Promise<string> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    const orders = await this.orderModel
      .find({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      })
      .populate("userId", "name email")
      .populate("subscriptionId", "title")
      .exec();

    // CSV Header
    const headers = [
      "Transaction ID",
      "Student Name",
      "Student Email",
      "Subscription Title",
      "Price",
      "Discount",
      "Status",
      "Created Date",
    ];

    // CSV Rows
    const rows = orders.map((order) => {
      const userId = order.userId as any;
      const subscriptionId = order.subscriptionId as any;

      return [
        order.transactionId || "",
        userId?.name || "",
        userId?.email || "",
        subscriptionId?.title || "",
        order.price?.toString() || "0",
        order.discount?.toString() || "0",
        order.status || "",
        order.createdAt ? new Date(order.createdAt).toISOString().split("T")[0] : "",
      ];
    });

    // Escape CSV values (handle commas, quotes, newlines)
    const escapeCSV = (value: string): string => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Combine headers and rows
    const csvLines = [headers.map(escapeCSV).join(","), ...rows.map((row) => row.map(escapeCSV).join(","))];

    return csvLines.join("\n");
  }

  async remove(id: string): Promise<void> {
    const result = await this.orderModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
  }
}
