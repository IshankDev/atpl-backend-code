import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Subject } from "./schemas/subject.schema";
import { Question } from "../questions/schemas/question.schema";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { UpdateSubjectDto } from "./dto/update-subject.dto";

@Injectable()
export class SubjectsService {
  constructor(
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
    @InjectModel(Question.name) private questionModel: Model<Question>
  ) {}

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

  // Get all children recursively
  async getAllChildrenIds(parentId: string): Promise<string[]> {
    const children = await this.subjectModel.find({ parentId }).exec();
    const allIds: string[] = [];
    
    for (const child of children) {
      const childId = child._id.toString();
      allIds.push(childId);
      // Recursively get children of this child
      const childIds = await this.getAllChildrenIds(childId);
      allIds.push(...childIds);
    }
    
    return allIds;
  }

  // Get delete preview information
  async getDeletePreview(id: string): Promise<{
    subject: Subject;
    childrenCount: number;
    children: Array<{ _id: string; name: string; type: string }>;
    questionsCount: number;
    allAffectedIds: string[];
  }> {
    const subject = await this.subjectModel.findById(id).exec();
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    // Get all children recursively (excluding the subject itself)
    const allChildrenIds = await this.getAllChildrenIds(id);
    const allAffectedIds = [id, ...allChildrenIds];

    // Get all children details
    const children = await this.subjectModel
      .find({ _id: { $in: allChildrenIds.map((id) => new Types.ObjectId(id)) } })
      .select("_id name type")
      .exec();

    // Build query conditions for all affected items (subject + children)
    // Questions must match both linkedNodeId AND linkedNodeType
    const allAffectedItems = [
      { _id: subject._id, type: subject.type },
      ...children.map((c) => ({ _id: c._id, type: c.type })),
    ];

    // Build $or conditions for all items
    // IMPORTANT: linkedNodeId might be stored as string or ObjectId in the database
    // We need to try both formats
    const questionQueryConditions = allAffectedItems.map((item) => {
      const linkedNodeType = item.type.charAt(0).toUpperCase() + item.type.slice(1); // "book" -> "Book"
      const itemIdString = item._id.toString();
      
      // Try both ObjectId and string formats
      return {
        $or: [
          { linkedNodeId: item._id, linkedNodeType: linkedNodeType }, // ObjectId format
          { linkedNodeId: itemIdString, linkedNodeType: linkedNodeType }, // String format
        ],
      };
    });

    // Count questions linked to this subject and all its children using $or
    let totalQuestionsCount = 0;
    if (questionQueryConditions.length > 0) {
      // Try the $or query with nested $or for each item (to handle both ObjectId and string)
      totalQuestionsCount = await this.questionModel.countDocuments({
        $or: questionQueryConditions,
      }).exec();

      // If still 0, try alternative approaches to handle potential data format issues
      if (totalQuestionsCount === 0) {
        // Try querying by ID only (without type filter) - try both ObjectId and string formats
        const allObjectIds = allAffectedItems.map(item => item._id);
        const allStringIds = allAffectedItems.map(item => item._id.toString());

        // Try ObjectId format first
        let questionsByIdOnly = await this.questionModel.countDocuments({
          linkedNodeId: { $in: allObjectIds },
        }).exec();

        // If no results, try string format
        if (questionsByIdOnly === 0) {
          questionsByIdOnly = await this.questionModel.countDocuments({
            linkedNodeId: { $in: allStringIds },
          }).exec();
        }

        if (questionsByIdOnly > 0) {
          // Questions exist - try individual queries for each item (both ObjectId and string formats)
          for (const item of allAffectedItems) {
            const itemType = item.type.charAt(0).toUpperCase() + item.type.slice(1);
            const itemIdString = item._id.toString();
            
            // Try ObjectId format
            let count = await this.questionModel.countDocuments({
              linkedNodeId: item._id,
              linkedNodeType: itemType,
            }).exec();

            // Try string format if ObjectId didn't work
            if (count === 0) {
              count = await this.questionModel.countDocuments({
                linkedNodeId: itemIdString,
                linkedNodeType: itemType,
              }).exec();
            }
            
            totalQuestionsCount += count;
          }
        }
      }
    }

    return {
      subject,
      childrenCount: allChildrenIds.length,
      children: children.map((c) => ({ _id: c._id.toString(), name: c.name, type: c.type })),
      questionsCount: totalQuestionsCount,
      allAffectedIds,
    };
  }

  async remove(id: string): Promise<{ deletedSubjects: number; deletedQuestions: number }> {
    const subject = await this.subjectModel.findById(id).exec();
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    // Get all children IDs recursively (excluding the subject itself)
    const allChildrenIds = await this.getAllChildrenIds(id);
    const allAffectedIds = [id, ...allChildrenIds];

    // Get all affected items with their types
    const allAffectedItems = await this.subjectModel
      .find({ _id: { $in: allAffectedIds.map((id) => new Types.ObjectId(id)) } })
      .select("_id type")
      .exec();

    // Build $or conditions for deleting questions
    // Questions must match both linkedNodeId AND linkedNodeType
    // Handle both ObjectId and string formats for linkedNodeId
    const questionDeleteConditions = allAffectedItems.map((item) => {
      const linkedNodeType = item.type.charAt(0).toUpperCase() + item.type.slice(1); // "book" -> "Book"
      const itemIdString = item._id.toString();
      
      // Try both ObjectId and string formats
      return {
        $or: [
          { linkedNodeId: item._id, linkedNodeType: linkedNodeType }, // ObjectId format
          { linkedNodeId: itemIdString, linkedNodeType: linkedNodeType }, // String format
        ],
      };
    });

    // Delete all questions in one query using $or (with nested $or for format handling)
    const deleteQuestionsResult = questionDeleteConditions.length > 0
      ? await this.questionModel.deleteMany({
          $or: questionDeleteConditions,
        }).exec()
      : { deletedCount: 0 };

    // Delete all children and the subject itself
    const objectIds = allAffectedIds.map((id) => new Types.ObjectId(id));
    const deleteSubjectsResult = await this.subjectModel.deleteMany({
      _id: { $in: objectIds },
    }).exec();

    return {
      deletedSubjects: deleteSubjectsResult.deletedCount || 0,
      deletedQuestions: deleteQuestionsResult.deletedCount || 0,
    };
  }
}
