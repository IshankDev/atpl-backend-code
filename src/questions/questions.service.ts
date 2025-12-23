import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Question } from "./schemas/question.schema";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";

@Injectable()
export class QuestionsService {
  constructor(@InjectModel(Question.name) private questionModel: Model<Question>) {}

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
}
