import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Subject } from "./schemas/subject.schema";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { UpdateSubjectDto } from "./dto/update-subject.dto";

@Injectable()
export class SubjectsService {
  constructor(@InjectModel(Subject.name) private subjectModel: Model<Subject>) {}

  async create(createSubjectDto: CreateSubjectDto): Promise<Subject> {
    const createdSubject = new this.subjectModel(createSubjectDto);
    return createdSubject.save();
  }

  async findAll(): Promise<Subject[]> {
    return this.subjectModel.find().exec();
  }

  async findOne(id: string): Promise<Subject> {
    const subject = await this.subjectModel.findById(id).exec();
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    return subject;
  }

  async findByType(type: string): Promise<Subject[]> {
    return this.subjectModel.find({ type }).exec();
  }

  async findByParentId(parentId: string): Promise<Subject[]> {
    return this.subjectModel.find({ parentId }).exec();
  }

  async findRootSubjects(): Promise<Subject[]> {
    return this.subjectModel.find({ parentId: null }).exec();
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto): Promise<Subject> {
    const updatedSubject = await this.subjectModel.findByIdAndUpdate(id, updateSubjectDto, { new: true }).exec();
    if (!updatedSubject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    return updatedSubject;
  }

  async remove(id: string): Promise<void> {
    const result = await this.subjectModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
  }
}
