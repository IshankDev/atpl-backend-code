import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Question } from "./schemas/question.schema";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { MockTestResult, MockTestResultSchema } from "../mock-test-results/schemas/mock-test-result.schema";

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(MockTestResult.name) private mockTestResultModel: Model<MockTestResult>
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
    const createdQuestion = new this.questionModel(createQuestionDto);
    return createdQuestion.save();
  }

  async findAll(filters?: {
    linkedNodeId?: string;
    linkedNodeType?: string;
    type?: string;
    difficulty?: string;
    searchQuery?: string;
  }): Promise<Question[]> {
    const query: any = {};

    if (filters?.linkedNodeId && filters?.linkedNodeType) {
      query.linkedNodeId = filters.linkedNodeId;
      query.linkedNodeType = filters.linkedNodeType;
    }

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.difficulty) {
      query.difficulty = filters.difficulty;
    }

    if (filters?.searchQuery) {
      const searchRegex = new RegExp(filters.searchQuery, "i");
      query.$or = [
        { "question.text": { $regex: searchRegex } },
        { "answer.text": { $regex: searchRegex } },
        { "explanation.text": { $regex: searchRegex } },
      ];
    }

    return this.questionModel.find(query).exec();
  }

  async findOne(id: string): Promise<Question> {
    const question = await this.questionModel.findById(id).exec();
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }

  async findByLinkedNode(linkedNodeId: string, linkedNodeType: string): Promise<Question[]> {
    return this.findAll({ linkedNodeId, linkedNodeType });
  }

  async findByType(type: string): Promise<Question[]> {
    return this.findAll({ type });
  }

  async findByDifficulty(difficulty: string): Promise<Question[]> {
    return this.findAll({ difficulty });
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto): Promise<Question> {
    const updatedQuestion = await this.questionModel.findByIdAndUpdate(id, updateQuestionDto, { new: true }).exec();
    if (!updatedQuestion) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return updatedQuestion;
  }

  async remove(id: string): Promise<void> {
    const result = await this.questionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
  }

  async importFromCSV(file: Express.Multer.File): Promise<{ count: number; errors?: string[] }> {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    if (!file.mimetype.includes("csv") && !file.originalname.toLowerCase().endsWith(".csv")) {
      throw new BadRequestException("File must be a CSV file");
    }

    const csvContent = file.buffer.toString("utf-8");
    const lines = csvContent.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      throw new BadRequestException("CSV file must contain at least a header row and one data row");
    }

    // Parse header
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    // Expected headers (flexible matching)
    const expectedHeaders = [
      "linkednodeid",
      "linkednodetype",
      "type",
      "difficulty",
      "questiontext",
      "questionimageurl",
      "option1text",
      "option1imageurl",
      "option2text",
      "option2imageurl",
      "option3text",
      "option3imageurl",
      "option4text",
      "option4imageurl",
      "answertext",
      "answerimageurl",
      "explanationtext",
      "explanationimageurl",
      "explanationvideourl",
    ];

    const errors: string[] = [];
    const questions: CreateQuestionDto[] = [];
    let successCount = 0;

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);

        if (values.length < headers.length) {
          errors.push(`Row ${i + 1}: Insufficient columns`);
          continue;
        }

        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || "";
        });

        // Build question object
        const question: CreateQuestionDto = {
          linkedNodeId: row.linkednodeid || row["linked node id"],
          linkedNodeType: row.linkednodetype || row["linked node type"],
          type: row.type,
          difficulty: row.difficulty || "medium",
          question: {
            text: row.questiontext || row["question text"],
            imageUrl: row.questionimageurl || row["question image url"] || undefined,
          },
          answer: {
            text: row.answertext || row["answer text"],
            imageUrl: row.answerimageurl || row["answer image url"] || undefined,
          },
        };

        // Add options if present
        const options: any[] = [];
        for (let optNum = 1; optNum <= 4; optNum++) {
          const optText = row[`option${optNum}text`] || row[`option ${optNum} text`];
          if (optText) {
            options.push({
              text: optText,
              imageUrl: row[`option${optNum}imageurl`] || row[`option ${optNum} image url`] || undefined,
            });
          }
        }
        if (options.length > 0) {
          question.options = options;
        }

        // Add explanation if present
        if (row.explanationtext || row["explanation text"]) {
          question.explanation = {
            text: row.explanationtext || row["explanation text"] || undefined,
            imageUrl: row.explanationimageurl || row["explanation image url"] || undefined,
            videoUrl: row.explanationvideourl || row["explanation video url"] || undefined,
          };
        }

        // Validate required fields
        if (
          !question.linkedNodeId ||
          !question.linkedNodeType ||
          !question.type ||
          !question.question?.text ||
          !question.answer?.text
        ) {
          errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        // Create question
        await this.create(question);
        successCount++;
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message || "Unknown error"}`);
      }
    }

    return {
      count: successCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // End of field
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current);

    return result;
  }

  async getMostViewedQuestionDaily(): Promise<{
    questionId: string;
    questionText: string;
    viewCount: number;
    dailyViewCount: number;
    type: string;
    difficulty: string;
    subject?: string;
    chapter?: string;
    topic?: string;
    correctAnswers: number;
    incorrectAnswers: number;
    averageTime: number;
    accuracy: number;
    date: string;
  } | null> {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all mock test results completed today
    const todayResults = await this.mockTestResultModel
      .find({
        completedAt: {
          $gte: today,
          $lt: tomorrow,
        },
      })
      .populate("answers.questionId")
      .exec();

    // Count question views (each answer is a view)
    const questionViewCounts: Map<string, { count: number; correct: number; incorrect: number; totalTime: number }> = new Map();

    todayResults.forEach((result) => {
      if (result.answers && result.answers.length > 0) {
        result.answers.forEach((answer: any) => {
          // Handle both populated and non-populated questionId
          let questionId: string | null = null;
          if (answer.questionId) {
            if (typeof answer.questionId === "string") {
              questionId = answer.questionId;
            } else if (answer.questionId._id) {
              questionId = answer.questionId._id.toString();
            } else if (answer.questionId.toString) {
              questionId = answer.questionId.toString();
            }
          }
          
          if (questionId) {
            const existing = questionViewCounts.get(questionId) || { count: 0, correct: 0, incorrect: 0, totalTime: 0 };
            existing.count += 1;
            if (answer.isCorrect) {
              existing.correct += 1;
            } else {
              existing.incorrect += 1;
            }
            existing.totalTime += answer.timeTakenSeconds || 0;
            questionViewCounts.set(questionId, existing);
          }
        });
      }
    });

    if (questionViewCounts.size === 0) {
      return null;
    }

    // Find the most viewed question today
    let mostViewedQuestionId = "";
    let maxDailyViews = 0;

    questionViewCounts.forEach((stats, questionId) => {
      if (stats.count > maxDailyViews) {
        maxDailyViews = stats.count;
        mostViewedQuestionId = questionId;
      }
    });

    if (!mostViewedQuestionId) {
      return null;
    }

    // Get the question details
    const question = await this.questionModel.findById(mostViewedQuestionId).populate("linkedNodeId").exec();
    if (!question) {
      return null;
    }

    // Get total view count (all time) for this question
    const allResults = await this.mockTestResultModel.find().populate("answers.questionId").exec();
    let totalViewCount = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalTime = 0;

    allResults.forEach((result) => {
      if (result.answers && result.answers.length > 0) {
        result.answers.forEach((answer: any) => {
          // Handle both populated and non-populated questionId
          let qId: string | null = null;
          if (answer.questionId) {
            if (typeof answer.questionId === "string") {
              qId = answer.questionId;
            } else if (answer.questionId._id) {
              qId = answer.questionId._id.toString();
            } else if (answer.questionId.toString) {
              qId = answer.questionId.toString();
            }
          }
          
          if (qId === mostViewedQuestionId) {
            totalViewCount += 1;
            if (answer.isCorrect) {
              totalCorrect += 1;
            } else {
              totalIncorrect += 1;
            }
            totalTime += answer.timeTakenSeconds || 0;
          }
        });
      }
    });

    const dailyStats = questionViewCounts.get(mostViewedQuestionId)!;
    const averageTime = dailyStats.count > 0 ? Math.round(totalTime / totalViewCount) : 0;
    const accuracy = totalViewCount > 0 ? Math.round((totalCorrect / totalViewCount) * 100 * 10) / 10 : 0;

    // Get subject/chapter/topic from linkedNodeId
    const linkedNode = question.linkedNodeId as any;
    let subject = "";
    let chapter = "";
    let topic = "";

    if (linkedNode) {
      if (linkedNode.type === "subject") {
        subject = linkedNode.name || "";
      } else if (linkedNode.type === "chapter") {
        chapter = linkedNode.name || "";
        // Try to get parent subject
        if (linkedNode.parentId) {
          const parent = await this.questionModel.db.collection("subjects").findOne({ _id: linkedNode.parentId });
          if (parent) {
            subject = parent.name || "";
          }
        }
      } else if (linkedNode.type === "topic") {
        topic = linkedNode.name || "";
        // Try to get parent chapter and subject
        if (linkedNode.parentId) {
          const parent = await this.questionModel.db.collection("subjects").findOne({ _id: linkedNode.parentId });
          if (parent) {
            if (parent.type === "chapter") {
              chapter = parent.name || "";
              if (parent.parentId) {
                const grandParent = await this.questionModel.db.collection("subjects").findOne({ _id: parent.parentId });
                if (grandParent) {
                  subject = grandParent.name || "";
                }
              }
            } else if (parent.type === "subject") {
              subject = parent.name || "";
            }
          }
        }
      }
    }

    return {
      questionId: mostViewedQuestionId,
      questionText: question.question?.text || "",
      viewCount: totalViewCount,
      dailyViewCount: maxDailyViews,
      type: question.type,
      difficulty: question.difficulty || "medium",
      subject,
      chapter,
      topic,
      correctAnswers: totalCorrect,
      incorrectAnswers: totalIncorrect,
      averageTime,
      accuracy,
      date: today.toISOString().split("T")[0],
    };
  }

  async getStats(): Promise<{
    total: number;
    mcq: number;
    truefalse: number;
    fillblank: number;
  }> {
    const [total, mcq, truefalse, fillblank] = await Promise.all([
      this.questionModel.countDocuments().exec(),
      this.questionModel.countDocuments({ type: "mcq" }).exec(),
      this.questionModel.countDocuments({ type: "truefalse" }).exec(),
      this.questionModel.countDocuments({ type: "fillblank" }).exec(),
    ]);

    return {
      total,
      mcq,
      truefalse,
      fillblank,
    };
  }
}
