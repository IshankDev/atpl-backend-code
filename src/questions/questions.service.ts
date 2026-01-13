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
    // For MCQ questions, convert answer text to option index format if needed
    if (createQuestionDto.type === "mcq" && createQuestionDto.options && createQuestionDto.options.length > 0) {
      const answerText = createQuestionDto.answer?.text || "";
      
      // Check if answer is already in option index format
      if (!answerText.match(/^option_\d+$/i)) {
        // Answer is text, find matching option and convert to index format
        const matchingIndex = createQuestionDto.options.findIndex(
          (opt) => opt.text.trim().toLowerCase() === answerText.trim().toLowerCase()
        );
        
        if (matchingIndex !== -1) {
          // Convert to option index format (1-based: option_1, option_2, etc.)
          createQuestionDto.answer.text = `option_${matchingIndex + 1}`;
        }
      }
    }
    
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
    // For MCQ questions, convert answer text to option index format if needed
    if (updateQuestionDto.type === "mcq" || (!updateQuestionDto.type && updateQuestionDto.options)) {
      // Get existing question to check type if not provided
      const existingQuestion = await this.questionModel.findById(id).exec();
      const questionType = updateQuestionDto.type || existingQuestion?.type;
      
      if (questionType === "mcq" && updateQuestionDto.options && updateQuestionDto.options.length > 0) {
        const answerText = updateQuestionDto.answer?.text || "";
        
        // Check if answer is already in option index format
        if (answerText && !answerText.match(/^option_\d+$/i)) {
          // Answer is text, find matching option and convert to index format
          const matchingIndex = updateQuestionDto.options.findIndex(
            (opt) => opt.text.trim().toLowerCase() === answerText.trim().toLowerCase()
          );
          
          if (matchingIndex !== -1) {
            // Convert to option index format (1-based: option_1, option_2, etc.)
            if (updateQuestionDto.answer) {
              updateQuestionDto.answer.text = `option_${matchingIndex + 1}`;
            } else {
              updateQuestionDto.answer = {
                text: `option_${matchingIndex + 1}`,
                imageUrl: undefined,
              };
            }
          }
        }
      }
    }
    
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

  async importFromCSV(
    file: Express.Multer.File,
    linkedNodeId: string,
    linkedNodeType: string
  ): Promise<{ 
    count: number; 
    errors?: string[]; 
    totalRows?: number; 
    successCount?: number; 
    failedCount?: number; 
  }> {
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

    // Detect format type based on headers
    const hasNewFormat = headers.includes("question_id") || headers.includes("question_text") || headers.includes("option_1");
    const hasOldFormat = headers.includes("linkednodeid") || headers.includes("questiontext") || headers.includes("option1text");

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

        let question: CreateQuestionDto;

        if (hasNewFormat) {
          // New format: question_id, question_number, question_text, option_1-4, correct_option, explanation, images, weight
          question = this.parseNewFormatCSV(row, linkedNodeId, linkedNodeType);
        } else {
          // Old format: linkednodeid, linkednodetype, type, difficulty, questiontext, etc.
          question = this.parseOldFormatCSV(row);
          // Override with provided values if not in CSV
          if (!question.linkedNodeId) question.linkedNodeId = linkedNodeId;
          if (!question.linkedNodeType) question.linkedNodeType = linkedNodeType;
        }

        // Validate required fields
        if (
          !question.type ||
          !question.question?.text ||
          !question.answer?.text
        ) {
          errors.push(`Row ${i + 1}: Missing required fields (question text and answer are required)`);
          continue;
        }

        // Create question
        await this.create(question);
        successCount++;
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message || "Unknown error"}`);
      }
    }

    const totalRows = lines.length - 1; // Exclude header row
    const failedCount = errors.length;

    return {
      count: successCount,
      errors: errors.length > 0 ? errors : undefined,
      totalRows,
      successCount,
      failedCount,
    };
  }

  private parseNewFormatCSV(row: any, linkedNodeId: string, linkedNodeType: string): CreateQuestionDto {
    // Map weight to difficulty (1=easy, 2=medium, 3=hard, default=medium)
    const weight = parseInt(row.weight || "2");
    let difficulty = "medium";
    if (weight === 1) difficulty = "easy";
    else if (weight === 2) difficulty = "medium";
    else if (weight >= 3) difficulty = "hard";

    // Use provided type or auto-detect based on options
    const hasOption1 = row.option_1 && row.option_1.trim();
    const hasOption2 = row.option_2 && row.option_2.trim();
    const hasOption3 = row.option_3 && row.option_3.trim();
    const hasOption4 = row.option_4 && row.option_4.trim();
    
    let questionType = row.type;
    if (!questionType) {
      // Auto-detect type based on options
      if (hasOption1 && hasOption2 && !hasOption3 && !hasOption4) {
        questionType = "truefalse";
      } else if (!hasOption1 && !hasOption2 && !hasOption3 && !hasOption4) {
        questionType = "fillblank";
      } else {
        questionType = "mcq";
      }
    }

    // Build options array
    const options: any[] = [];
    if (hasOption1) {
      options.push({ text: row.option_1.trim() });
    }
    if (hasOption2) {
      options.push({ text: row.option_2.trim() });
    }
    if (hasOption3) {
      options.push({ text: row.option_3.trim() });
    }
    if (hasOption4) {
      options.push({ text: row.option_4.trim() });
    }

    // Determine correct answer from correct_option
    // For MCQ/TrueFalse: correct_option can be either:
    //   - A number (1-4) indicating which option is correct
    //   - The actual answer text that matches one of the options
    // For FillBlank: correct_option contains the answer text directly
    let answerText = "";
    if (questionType === "fillblank") {
      // For fillblank, correct_option contains the answer text
      answerText = (row.correct_option || "").trim();
    } else if (questionType === "truefalse") {
      // For True/False, normalize the answer
      const correctOptionValue = (row.correct_option || "").trim().toLowerCase();
      // Check if it matches "True" or "False" (case-insensitive)
      if (correctOptionValue === "true" || correctOptionValue === "1" || correctOptionValue === "t") {
        answerText = "True";
      } else if (correctOptionValue === "false" || correctOptionValue === "0" || correctOptionValue === "f") {
        answerText = "False";
      } else {
        // Try to find matching option
        const matchingIndex = options.findIndex(
          (opt) => opt.text.trim().toLowerCase() === correctOptionValue
        );
        if (matchingIndex !== -1) {
          answerText = options[matchingIndex].text.trim();
        } else if (options.length > 0) {
          // Fallback to first option
          answerText = options[0].text.trim();
        }
      }
    } else {
      // For MCQ, check if correct_option is a number or text
      const correctOptionValue = (row.correct_option || "").trim();
      
      // Try parsing as number first
      const correctOptionNum = parseInt(correctOptionValue);
      if (!isNaN(correctOptionNum) && correctOptionNum >= 1 && correctOptionNum <= 4 && options.length >= correctOptionNum) {
        // It's a number (1-based from CSV), convert to 0-based index and store as option index
        // Store as "option_1", "option_2", etc. (1-based to match CSV format)
        answerText = `option_${correctOptionNum}`;
      } else {
        // It's text, find matching option (case-insensitive, trimmed comparison)
        const matchingIndex = options.findIndex(
          (opt) => opt.text.trim().toLowerCase() === correctOptionValue.toLowerCase()
        );
        
        if (matchingIndex !== -1) {
          // Found matching option, store the option index (1-based: option_1, option_2, etc.)
          answerText = `option_${matchingIndex + 1}`;
        } else if (options.length > 0) {
          // No match found, fallback to first option
          answerText = "option_1";
        }
      }
    }

    // Parse images field (could be comma-separated URLs or JSON)
    let questionImageUrl: string | undefined;
    let answerImageUrl: string | undefined;
    let explanationImageUrl: string | undefined;
    let explanationVideoUrl: string | undefined;

    if (row.images) {
      try {
        // Try parsing as JSON first
        const imagesData = JSON.parse(row.images);
        if (typeof imagesData === "object") {
          questionImageUrl = imagesData.question || imagesData.questionImageUrl;
          answerImageUrl = imagesData.answer || imagesData.answerImageUrl;
          explanationImageUrl = imagesData.explanation || imagesData.explanationImageUrl;
          explanationVideoUrl = imagesData.video || imagesData.videoUrl || imagesData.explanationVideoUrl;
        }
      } catch {
        // If not JSON, try comma-separated format: question,answer,explanation,video
        const imageUrls = row.images.split(",").map((url: string) => url.trim()).filter(Boolean);
        if (imageUrls.length > 0) questionImageUrl = imageUrls[0];
        if (imageUrls.length > 1) answerImageUrl = imageUrls[1];
        if (imageUrls.length > 2) explanationImageUrl = imageUrls[2];
        if (imageUrls.length > 3) explanationVideoUrl = imageUrls[3];
      }
    }

    const question: CreateQuestionDto = {
      linkedNodeId: linkedNodeId, // Use provided linkedNodeId
      linkedNodeType: linkedNodeType, // Use provided linkedNodeType
      type: questionType,
      difficulty: row.difficulty || difficulty,
      question: {
        text: row.question_text || row["question_text"] || "",
        imageUrl: questionImageUrl,
      },
      answer: {
        text: answerText || "",
        imageUrl: answerImageUrl,
      },
      options: options.length > 0 ? options : undefined,
      explanation: row.explanation
        ? {
            text: row.explanation,
            imageUrl: explanationImageUrl,
            videoUrl: explanationVideoUrl,
          }
        : undefined,
    };

    return question;
  }

  private parseOldFormatCSV(row: any): CreateQuestionDto {
    // Build question object (old format)
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

    return question;
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
