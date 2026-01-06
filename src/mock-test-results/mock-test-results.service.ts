import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MockTestResult } from "./schemas/mock-test-result.schema";
import { CreateMockTestResultDto } from "./dto/create-mock-test-result.dto";
import { UpdateMockTestResultDto } from "./dto/update-mock-test-result.dto";

@Injectable()
export class MockTestResultsService {
  constructor(@InjectModel(MockTestResult.name) private mockTestResultModel: Model<MockTestResult>) {}

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

    // Use aggregation pipeline to search in populated fields
    // Escape special regex characters in search query
    const escapedSearchQuery = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearchQuery, "i");

    // First, find matching users and mock tests using direct collection queries
    const usersCollection = this.mockTestResultModel.db.collection("users");
    const mockTestsCollection = this.mockTestResultModel.db.collection("mocktests");
    
    const [matchingUsers, matchingMockTests] = await Promise.all([
      usersCollection
        .find({
          $or: [
            { name: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
          ],
        })
        .project({ _id: 1 })
        .toArray(),
      mockTestsCollection
        .find({
          title: { $regex: searchRegex },
        })
        .project({ _id: 1 })
        .toArray(),
    ]);

    // Convert to ObjectIds for proper matching
    const matchingUserIds = matchingUsers
      .map((u: any) => {
        if (!u || !u._id) return null;
        try {
          // Handle both ObjectId and string formats
          if (u._id instanceof Types.ObjectId) {
            return u._id;
          }
          // Convert string to ObjectId
          const idString = String(u._id);
          if (Types.ObjectId.isValid(idString)) {
            return new Types.ObjectId(idString);
          }
          return null;
        } catch (error) {
          console.error("Error converting user ID to ObjectId:", error, u._id);
          return null;
        }
      })
      .filter((id) => id !== null) as Types.ObjectId[];
    
    const matchingMockTestIds = matchingMockTests
      .map((m: any) => {
        if (!m || !m._id) return null;
        try {
          // Handle both ObjectId and string formats
          if (m._id instanceof Types.ObjectId) {
            return m._id;
          }
          // Convert string to ObjectId
          const idString = String(m._id);
          if (Types.ObjectId.isValid(idString)) {
            return new Types.ObjectId(idString);
          }
          return null;
        } catch (error) {
          console.error("Error converting mock test ID to ObjectId:", error, m._id);
          return null;
        }
      })
      .filter((id) => id !== null) as Types.ObjectId[];

    // Build query to find results matching user or mock test
    const orConditions: any[] = [];
    
    if (matchingUserIds.length > 0) {
      orConditions.push({ userId: { $in: matchingUserIds } });
    }
    
    if (matchingMockTestIds.length > 0) {
      orConditions.push({ mockTestId: { $in: matchingMockTestIds } });
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
