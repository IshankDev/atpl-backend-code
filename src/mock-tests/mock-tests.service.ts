import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MockTest } from "./schemas/mock-test.schema";
import { CreateMockTestDto } from "./dto/create-mock-test.dto";
import { UpdateMockTestDto } from "./dto/update-mock-test.dto";

@Injectable()
export class MockTestsService {
  constructor(@InjectModel(MockTest.name) private mockTestModel: Model<MockTest>) {}

  async create(createMockTestDto: CreateMockTestDto): Promise<MockTest> {
    const createdMockTest = new this.mockTestModel(createMockTestDto);
    return createdMockTest.save();
  }

  async findAll(): Promise<MockTest[]> {
    return this.mockTestModel.find().populate("linkedNodeId").populate("questionIds").populate("createdBy").exec();
  }

  async findOne(id: string): Promise<MockTest> {
    const mockTest = await this.mockTestModel
      .findById(id)
      .populate("linkedNodeId")
      .populate("questionIds")
      .populate("createdBy")
      .exec();
    if (!mockTest) {
      throw new NotFoundException(`MockTest with ID ${id} not found`);
    }
    return mockTest;
  }

  async findByLinkedNode(linkedNodeId: string): Promise<MockTest[]> {
    return this.mockTestModel
      .find({ linkedNodeId })
      .populate("linkedNodeId")
      .populate("questionIds")
      .populate("createdBy")
      .exec();
  }

  async findByCreatedBy(createdBy: string): Promise<MockTest[]> {
    return this.mockTestModel
      .find({ createdBy })
      .populate("linkedNodeId")
      .populate("questionIds")
      .populate("createdBy")
      .exec();
  }

  async findByDurationRange(minDuration: number, maxDuration: number): Promise<MockTest[]> {
    return this.mockTestModel
      .find({
        durationMinutes: { $gte: minDuration, $lte: maxDuration },
      })
      .populate("linkedNodeId")
      .populate("questionIds")
      .populate("createdBy")
      .exec();
  }

  async addQuestions(id: string, questionIds: string[]): Promise<MockTest> {
    const mockTest = await this.mockTestModel.findById(id).exec();
    if (!mockTest) {
      throw new NotFoundException(`MockTest with ID ${id} not found`);
    }

    const objectIdQuestionIds = questionIds.map((id) => new Types.ObjectId(id));
    mockTest.questionIds = [...new Set([...mockTest.questionIds, ...objectIdQuestionIds])];
    mockTest.totalQuestions = mockTest.questionIds.length;
    return mockTest.save();
  }

  async removeQuestions(id: string, questionIds: string[]): Promise<MockTest> {
    const mockTest = await this.mockTestModel.findById(id).exec();
    if (!mockTest) {
      throw new NotFoundException(`MockTest with ID ${id} not found`);
    }

    const objectIdQuestionIds = questionIds.map((id) => new Types.ObjectId(id));
    mockTest.questionIds = mockTest.questionIds.filter(
      (qId) => !objectIdQuestionIds.some((objId) => objId.equals(qId))
    );
    mockTest.totalQuestions = mockTest.questionIds.length;
    return mockTest.save();
  }

  async update(id: string, updateMockTestDto: UpdateMockTestDto): Promise<MockTest> {
    const updatedMockTest = await this.mockTestModel
      .findByIdAndUpdate(id, updateMockTestDto, { new: true })
      .populate("linkedNodeId")
      .populate("questionIds")
      .populate("createdBy")
      .exec();
    if (!updatedMockTest) {
      throw new NotFoundException(`MockTest with ID ${id} not found`);
    }
    return updatedMockTest;
  }

  async remove(id: string): Promise<void> {
    const result = await this.mockTestModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`MockTest with ID ${id} not found`);
    }
  }
}
