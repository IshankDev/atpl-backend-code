import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
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

  async findAll(): Promise<MockTestResult[]> {
    return this.mockTestResultModel
      .find()
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
}
