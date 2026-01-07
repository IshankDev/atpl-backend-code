import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MockTestResult } from "./schemas/mock-test-result.schema";
import { User } from "../users/schemas/user.schema";
import { MockTest } from "../mock-tests/schemas/mock-test.schema";
import { CreateMockTestResultDto } from "./dto/create-mock-test-result.dto";
import { UpdateMockTestResultDto } from "./dto/update-mock-test-result.dto";

@Injectable()
export class MockTestResultsService {
  constructor(
    @InjectModel(MockTestResult.name) private mockTestResultModel: Model<MockTestResult>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(MockTest.name) private mockTestModel: Model<MockTest>
  ) {}

  async create(createMockTestResultDto: CreateMockTestResultDto): Promise<MockTestResult> {
    const createdMockTestResult = new this.mockTestResultModel(createMockTestResultDto);
    return createdMockTestResult.save();
  }

  async findAll(searchQuery?: string, minPercentage?: number, maxPercentage?: number): Promise<MockTestResult[]> {
    // Build base query
    const baseQuery: any = {};
    
    // Add percentage filter if provided
    if (minPercentage !== undefined && maxPercentage !== undefined) {
      baseQuery.percentage = { $gte: minPercentage, $lte: maxPercentage };
    }
    
    // If no search query, return filtered results
    if (!searchQuery || searchQuery.trim() === "") {
      return this.mockTestResultModel
        .find(baseQuery)
        .populate("mockTestId")
        .populate("userId")
        .populate("answers.questionId")
        .exec();
    }

    // Use Mongoose models to search for matching users and mock tests
    const trimmedQuery = searchQuery.trim();
    const searchRegex = new RegExp(trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    
    // Find matching users and mock tests using Mongoose models
    // Don't use .lean() to ensure we get proper Mongoose documents with ObjectIds
    const [matchingUsers, matchingMockTests] = await Promise.all([
      this.userModel
        .find({
          $or: [
            { name: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
          ],
        })
        .select("_id")
        .exec(),
      this.mockTestModel
        .find({
          title: { $regex: searchRegex },
        })
        .select("_id")
        .exec(),
    ]);


    // Extract ObjectIds from matching users and mock tests
    // Since we're not using .lean(), _id should already be ObjectId instances
    const matchingUserIds: (Types.ObjectId | string)[] = matchingUsers
      .map((u) => u._id)
      .filter((id) => id != null);
    
    const matchingMockTestIds: (Types.ObjectId | string)[] = matchingMockTests
      .map((m) => m._id)
      .filter((id) => id != null);

    // Build query to find results matching user or mock test
    // Since userIds are stored as strings in the DB, convert to strings for the query
    const orConditions: any[] = [];
    
    if (matchingUserIds.length > 0) {
      // Convert to strings since the DB stores them as strings
      const userIds = matchingUserIds.map((id: Types.ObjectId | string) => {
        if (id instanceof Types.ObjectId) {
          return id.toString();
        }
        return String(id);
      });
      orConditions.push({ userId: { $in: userIds } });
    }
    
    if (matchingMockTestIds.length > 0) {
      // Convert to strings since the DB stores them as strings
      const mockTestIds = matchingMockTestIds.map((id: Types.ObjectId | string) => {
        if (id instanceof Types.ObjectId) {
          return id.toString();
        }
        return String(id);
      });
      orConditions.push({ mockTestId: { $in: mockTestIds } });
    }

    // If no matches found in users or mock tests, return empty array
    if (orConditions.length === 0) {
      return [];
    }

    // Build the search condition
    const searchCondition = orConditions.length === 1 ? orConditions[0] : { $or: orConditions };

    // Build the final query combining search and percentage filter
    let finalQuery: any;
    
    if (Object.keys(baseQuery).length > 0) {
      // We have both search and percentage filter, use $and
      finalQuery = {
        $and: [searchCondition, baseQuery],
      };
    } else {
      // Only search condition
      finalQuery = searchCondition;
    }


    // Find and populate results
    return this.mockTestResultModel
      .find(finalQuery)
      .populate("mockTestId")
      .populate("userId")
      .populate("answers.questionId")
      .exec();
  }

  async findOne(id: string): Promise<MockTestResult> {
    const mockTestResult = await this.mockTestResultModel
      .findById(id)
      .populate("mockTestId")
      .populate("userId")
      .populate("answers.questionId")
      .exec();
    if (!mockTestResult) {
      throw new NotFoundException(`MockTestResult with ID ${id} not found`);
    }
    return mockTestResult;
  }

  async findByUserId(userId: string): Promise<MockTestResult[]> {
    return this.mockTestResultModel
      .find({ userId })
      .populate("mockTestId")
      .populate("userId")
      .populate("answers.questionId")
      .exec();
  }

  async findByMockTestId(mockTestId: string): Promise<MockTestResult[]> {
    return this.mockTestResultModel
      .find({ mockTestId })
      .populate("mockTestId")
      .populate("userId")
      .populate("answers.questionId")
      .exec();
  }

  async findByScoreRange(minScore: number, maxScore: number): Promise<MockTestResult[]> {
    return this.mockTestResultModel
      .find({
        score: { $gte: minScore, $lte: maxScore },
      })
      .populate("mockTestId")
      .populate("userId")
      .populate("answers.questionId")
      .exec();
  }

  async findByPercentageRange(minPercentage: number, maxPercentage: number): Promise<MockTestResult[]> {
    return this.mockTestResultModel
      .find({
        percentage: { $gte: minPercentage, $lte: maxPercentage },
      })
      .populate("mockTestId")
      .populate("userId")
      .populate("answers.questionId")
      .exec();
  }

  async findTopPerformers(limit: number = 10): Promise<MockTestResult[]> {
    return this.mockTestResultModel
      .find()
      .sort({ percentage: -1, score: -1 })
      .limit(limit)
      .populate("mockTestId")
      .populate("userId")
      .populate("answers.questionId")
      .exec();
  }

  async getUserTestHistory(userId: string, mockTestId: string): Promise<MockTestResult[]> {
    return this.mockTestResultModel
      .find({ userId, mockTestId })
      .sort({ completedAt: -1 })
      .populate("mockTestId")
      .populate("userId")
      .populate("answers.questionId")
      .exec();
  }

  async update(id: string, updateMockTestResultDto: UpdateMockTestResultDto): Promise<MockTestResult> {
    const updatedMockTestResult = await this.mockTestResultModel
      .findByIdAndUpdate(id, updateMockTestResultDto, { new: true })
      .populate("mockTestId")
      .populate("userId")
      .populate("answers.questionId")
      .exec();
    if (!updatedMockTestResult) {
      throw new NotFoundException(`MockTestResult with ID ${id} not found`);
    }
    return updatedMockTestResult;
  }

  async remove(id: string): Promise<void> {
    const result = await this.mockTestResultModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`MockTestResult with ID ${id} not found`);
    }
  }

  async getStats(): Promise<{
    totalResults: number;
    averageScore: number;
    totalStudents: number;
    totalTests: number;
  }> {
    const allResults = await this.mockTestResultModel.find().exec();

    const totalResults = allResults.length;
    const totalScore = allResults.reduce((sum, result) => sum + (result.percentage || 0), 0);
    const averageScore = totalResults > 0 ? totalScore / totalResults : 0;

    // Get unique students
    const uniqueUserIds = new Set(allResults.map((result) => result.userId.toString()));
    const totalStudents = uniqueUserIds.size;

    // Get unique mock tests
    const uniqueMockTestIds = new Set(allResults.map((result) => result.mockTestId.toString()));
    const totalTests = uniqueMockTestIds.size;

    return {
      totalResults,
      averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal place
      totalStudents,
      totalTests,
    };
  }
}
