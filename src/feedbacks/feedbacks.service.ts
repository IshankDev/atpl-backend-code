import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Feedback } from "./schemas/feedback.schema";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { UpdateFeedbackDto } from "./dto/update-feedback.dto";

@Injectable()
export class FeedbacksService {
  constructor(@InjectModel(Feedback.name) private feedbackModel: Model<Feedback>) {}

  async create(createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
    const createdFeedback = new this.feedbackModel(createFeedbackDto);
    return createdFeedback.save();
  }

  async findAll(searchQuery?: string, mockTestResultId?: string): Promise<Feedback[]> {
    // Build base query
    const baseQuery: any = {};
    
    if (mockTestResultId) {
      baseQuery.mockTestResultId = mockTestResultId;
    }
    
    if (!searchQuery) {
      return this.feedbackModel
        .find(baseQuery)
        .populate("userId", "name email")
        .populate("mockTestId", "title")
        .populate("submittedBy", "name email")
        .populate("mockTestResultId")
        .sort({ createdAt: -1 })
        .exec();
    }

    // Use aggregation pipeline to search in populated fields
    const searchRegex = new RegExp(searchQuery, "i");

    const pipeline: any[] = [
      // Add mockTestResultId filter if provided
      ...(mockTestResultId
        ? [
            {
              $match: {
                mockTestResultId: mockTestResultId,
              },
            },
          ]
        : []),
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
          from: "mocktests",
          localField: "mockTestId",
          foreignField: "_id",
          as: "mockTest",
        },
      },
      {
        $match: {
          $or: [
            { "user.name": { $regex: searchRegex } },
            { "user.email": { $regex: searchRegex } },
            { "mockTest.title": { $regex: searchRegex } },
            { overallFeedback: { $regex: searchRegex } },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ];

    const results = await this.feedbackModel.aggregate(pipeline).exec();

    // Populate the fields manually
    const populatedResults = await Promise.all(
      results.map(async (result) => {
        const feedback = await this.feedbackModel
          .findById(result._id)
          .populate("userId", "name email")
          .populate("mockTestId", "title")
          .populate("submittedBy", "name email")
          .populate("mockTestResultId")
          .exec();
        return feedback;
      })
    );

    return populatedResults.filter((f) => f !== null) as Feedback[];
  }

  async findOne(id: string): Promise<Feedback> {
    const feedback = await this.feedbackModel
      .findById(id)
      .populate("userId", "name email")
      .populate("mockTestId", "title")
      .populate("submittedBy", "name email")
      .populate("mockTestResultId")
      .exec();

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    return feedback;
  }

  async update(id: string, updateFeedbackDto: UpdateFeedbackDto): Promise<Feedback> {
    const updatedFeedback = await this.feedbackModel
      .findByIdAndUpdate(id, updateFeedbackDto, { new: true })
      .populate("userId", "name email")
      .populate("mockTestId", "title")
      .populate("submittedBy", "name email")
      .populate("mockTestResultId")
      .exec();

    if (!updatedFeedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    return updatedFeedback;
  }

  async remove(id: string): Promise<void> {
    const result = await this.feedbackModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }
  }

  async getStats(): Promise<{ total: number; thisMonth: number; thisWeek: number; unread: number }> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [total, thisMonth, thisWeek, unread] = await Promise.all([
      this.feedbackModel.countDocuments().exec(),
      this.feedbackModel.countDocuments({ createdAt: { $gte: startOfMonth } }).exec(),
      this.feedbackModel.countDocuments({ createdAt: { $gte: startOfWeek } }).exec(),
      // For now, we'll consider all feedbacks as "read" - you can add a read status field later if needed
      this.feedbackModel.countDocuments().exec(),
    ]);

    return {
      total,
      thisMonth,
      thisWeek,
      unread: 0, // Placeholder - can be enhanced with a read status field
    };
  }

  async findStudentFeedbacks(searchQuery?: string): Promise<Feedback[]> {
    // Find feedbacks where submittedBy equals userId (student submitted feedback themselves)
    const query: any = {
      $expr: {
        $eq: ["$submittedBy", "$userId"],
      },
    };

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      // Use aggregation pipeline to search in populated fields
      const pipeline: any[] = [
        {
          $match: {
            $expr: {
              $eq: ["$submittedBy", "$userId"],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "submittedBy",
            foreignField: "_id",
            as: "submittedByUser",
          },
        },
        {
          $match: {
            $or: [
              { "submittedByUser.name": { $regex: searchRegex } },
              { "submittedByUser.email": { $regex: searchRegex } },
              { overallFeedback: { $regex: searchRegex } },
            ],
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ];

      const results = await this.feedbackModel.aggregate(pipeline).exec();

      // Populate the fields manually
      const populatedResults = await Promise.all(
        results.map(async (result) => {
          const feedback = await this.feedbackModel
            .findById(result._id)
            .populate("userId", "name email")
            .populate("submittedBy", "name email")
            .populate("mockTestId", "title")
            .populate("mockTestResultId")
            .exec();
          return feedback;
        })
      );

      return populatedResults.filter((f) => f !== null) as Feedback[];
    }

    // Without search, use regular find with $expr
    return this.feedbackModel
      .find(query)
      .populate("userId", "name email")
      .populate("submittedBy", "name email")
      .populate("mockTestId", "title")
      .populate("mockTestResultId")
      .sort({ createdAt: -1 })
      .exec();
  }

  async getStudentFeedbackStats(): Promise<{ total: number; thisMonth: number; thisWeek: number; unread: number }> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const studentFeedbackQuery = {
      $expr: {
        $eq: ["$submittedBy", "$userId"],
      },
    };

    const [total, thisMonth, thisWeek, unread] = await Promise.all([
      this.feedbackModel.countDocuments(studentFeedbackQuery).exec(),
      this.feedbackModel
        .countDocuments({
          ...studentFeedbackQuery,
          createdAt: { $gte: startOfMonth },
        })
        .exec(),
      this.feedbackModel
        .countDocuments({
          ...studentFeedbackQuery,
          createdAt: { $gte: startOfWeek },
        })
        .exec(),
      // For now, we'll consider all feedbacks as "read" - you can add a read status field later if needed
      this.feedbackModel.countDocuments(studentFeedbackQuery).exec(),
    ]);

    return {
      total,
      thisMonth,
      thisWeek,
      unread: 0, // Placeholder - can be enhanced with a read status field
    };
  }

  async findOneStudentFeedback(id: string): Promise<Feedback> {
    const feedback = await this.feedbackModel
      .findOne({
        _id: id,
        $expr: {
          $eq: ["$submittedBy", "$userId"],
        },
      })
      .populate("userId", "name email")
      .populate("submittedBy", "name email")
      .populate("mockTestId", "title")
      .populate("mockTestResultId")
      .exec();

    if (!feedback) {
      throw new NotFoundException(`Student feedback with ID ${id} not found`);
    }

    return feedback;
  }

  async updateStudentFeedback(id: string, updateFeedbackDto: UpdateFeedbackDto): Promise<Feedback> {
    // First verify it's a student feedback
    const existingFeedback = await this.feedbackModel
      .findOne({
        _id: id,
        $expr: {
          $eq: ["$submittedBy", "$userId"],
        },
      })
      .exec();

    if (!existingFeedback) {
      throw new NotFoundException(`Student feedback with ID ${id} not found`);
    }

    const updatedFeedback = await this.feedbackModel
      .findByIdAndUpdate(id, updateFeedbackDto, { new: true })
      .populate("userId", "name email")
      .populate("submittedBy", "name email")
      .populate("mockTestId", "title")
      .populate("mockTestResultId")
      .exec();

    return updatedFeedback!;
  }

  async removeStudentFeedback(id: string): Promise<void> {
    // First verify it's a student feedback
    const existingFeedback = await this.feedbackModel
      .findOne({
        _id: id,
        $expr: {
          $eq: ["$submittedBy", "$userId"],
        },
      })
      .exec();

    if (!existingFeedback) {
      throw new NotFoundException(`Student feedback with ID ${id} not found`);
    }

    await this.feedbackModel.findByIdAndDelete(id).exec();
  }

  async createStudentFeedback(userId: string, createStudentFeedbackDto: { mockTestResultId?: string; mockTestId?: string; overallFeedback: string }): Promise<Feedback> {
    // For student feedbacks, submittedBy should equal userId
    const feedbackData = {
      ...createStudentFeedbackDto,
      userId,
      submittedBy: userId, // Student is submitting feedback themselves
    };

    const createdFeedback = new this.feedbackModel(feedbackData);
    const savedFeedback = await createdFeedback.save();
    
    // Populate fields before returning
    return this.feedbackModel
      .findById(savedFeedback._id)
      .populate("userId", "name email")
      .populate("submittedBy", "name email")
      .populate("mockTestId", "title")
      .populate("mockTestResultId")
      .exec() as Promise<Feedback>;
  }
}
