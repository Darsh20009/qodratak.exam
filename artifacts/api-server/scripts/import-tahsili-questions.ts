import fs from "node:fs/promises";
import path from "node:path";
import { connectToMongoDB, disconnectFromMongoDB } from "../src/mongodb/connection";
import { TahsiliQuestion } from "../src/mongodb/models";

type ImportQuestion = {
  questionId: number;
  subject: string;
  subcategory: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  topic?: string;
  sourcePage: number;
  sourceQuestionNumber?: number;
  sourceBook: string;
  answerConfidence: "verified" | "review";
};

async function main() {
  const inputPath = path.resolve(
    process.cwd(),
    process.argv[2] ?? ".agents/outputs/tahsili-question-review.json",
  );
  const payload = JSON.parse(await fs.readFile(inputPath, "utf8")) as {
    questions: ImportQuestion[];
  };

  if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
    throw new Error("The import file does not contain any questions.");
  }

  const validQuestions = payload.questions.filter(
    (question) =>
      question.text.trim().length >= 8 &&
      question.options.length === 4 &&
      question.options.every((option) => option.trim().length > 0),
  );

  if (validQuestions.length !== payload.questions.length) {
    throw new Error(
      `Refusing partial import: ${payload.questions.length - validQuestions.length} question(s) failed validation.`,
    );
  }

  await connectToMongoDB();
  try {
    const operations = validQuestions.map((question) => ({
      updateOne: {
        filter: { questionId: question.questionId },
        update: {
          $set: {
            ...question,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await TahsiliQuestion.bulkWrite(operations, { ordered: false });
    console.log(
      JSON.stringify({
        input: payload.questions.length,
        matched: result.matchedCount,
        modified: result.modifiedCount,
        inserted: result.upsertedCount,
      }),
    );
  } finally {
    await disconnectFromMongoDB();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});