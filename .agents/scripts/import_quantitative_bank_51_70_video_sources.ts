import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { FoundationContent, Question } from "../../artifacts/api-server/src/mongodb/models";
import { fetchR2VerbalObject } from "../../artifacts/api-server/src/services/qudratVerbalBookFilesService";
import { equalPartitionClipBounds } from "../../artifacts/api-server/src/services/questionVideoClip";

type BankVideo = {
  number: number;
  durationSeconds: number;
  videoUrl: string;
};

async function main() {
  const root = resolve(process.cwd(), "..");
  const sourcePath = resolve(
    root,
    "artifacts/api-server/src/data/quantitative-computer-bank-video-sources-51-70.json",
  );
  const payload = JSON.parse(await readFile(sourcePath, "utf8")) as {
    banks: BankVideo[];
  };
  const bankNumbers = payload.banks.map((bank) => bank.number).sort((a, b) => a - b);
  if (bankNumbers.join(",") !== Array.from({ length: 20 }, (_, index) => index + 51).join(",")) {
    throw new Error("Expected video sources for all 20 banks (51–70).");
  }

  for (const bank of payload.banks) {
    const expectedUrl =
      `/api/learning/computerized/quantitative/computer-bank-${bank.number}.mp4`;
    if (bank.number < 51 || bank.number > 70 ||
        !Number.isFinite(bank.durationSeconds) || bank.durationSeconds <= 0 ||
        bank.videoUrl !== expectedUrl) {
      throw new Error(`Invalid video source for bank ${bank.number}.`);
    }
    const remote = await fetchR2VerbalObject(
      `foundation/quantitative/computer-banks/computer-bank-${bank.number}.mp4`,
      { method: "HEAD" },
    );
    if (!remote.ok) {
      throw new Error(`The R2 video for bank ${bank.number} is not available yet.`);
    }
  }

  await connectToMongoDB();
  try {
    if (Question.db.name !== "test") {
      throw new Error("Refusing to update anything except the development test database.");
    }
    const lessonUpdates = [];
    const questionUpdates = [];
    const expectedTimings = new Map<string, { startSeconds: number; endSeconds: number }>();
    for (const bank of payload.banks) {
      const lesson = await FoundationContent.findOne({
        published: true,
        subjectId: "subject.qudrat.quantitative",
        title: `بنك الكمي المحوسب ${bank.number}`,
      }).select("_id quiz.questionIds").lean();
      if (!lesson || !Array.isArray(lesson.quiz?.questionIds) ||
          lesson.quiz.questionIds.length !== 48) {
        throw new Error(`The published 48-question lesson for bank ${bank.number} is missing.`);
      }
      const questionIds = Array.from({ length: 48 }, (_, index) =>
        `quantitative-computer-bank-${bank.number}-${index + 1}`,
      );
      const sourceQuestions = await Question.find({
        category: "quantitative",
        "source.questionId": { $in: questionIds },
      }).select("_id").lean();
      const lessonQuestionIds = new Set(lesson.quiz.questionIds.map(String));
      if (sourceQuestions.length !== 48 ||
          sourceQuestions.some((question) => !lessonQuestionIds.has(String(question._id)))) {
        throw new Error(`The lesson and source-question records do not match for bank ${bank.number}.`);
      }
      for (let index = 0; index < 48; index += 1) {
        const { startSeconds, endSeconds } = equalPartitionClipBounds(
          bank.durationSeconds,
          index + 1,
        );
        const questionId = `quantitative-computer-bank-${bank.number}-${index + 1}`;
        expectedTimings.set(questionId, { startSeconds, endSeconds });
        questionUpdates.push({
          updateOne: {
            filter: {
              category: "quantitative",
              "source.questionId": questionId,
            },
            update: {
              $set: {
                "source.videoTimestampSeconds": startSeconds,
                "source.videoEndTimestampSeconds": endSeconds,
                "source.videoTimestampInferred": true,
                "source.videoEndTimestampInferred": true,
                "source.videoTimingVerified": false,
                "source.videoTimingMethod": "duration_divided_by_48_120s",
              },
            },
          },
        });
      }

      lessonUpdates.push({
        updateOne: {
          filter: { _id: lesson._id },
          update: { $set: { questionSolutionVideoUrl: bank.videoUrl } },
        },
      });
    }

    const questionResult = await Question.bulkWrite(questionUpdates, { ordered: true });
    if (questionResult.matchedCount !== 960) {
      throw new Error(`Matched ${questionResult.matchedCount}/960 bank questions.`);
    }
    const persistedQuestions = await Question.find({
      category: "quantitative",
      "source.questionId": { $in: [...expectedTimings.keys()] },
    }).select(
      "source.questionId source.videoTimestampSeconds source.videoEndTimestampSeconds " +
      "source.videoTimestampInferred source.videoEndTimestampInferred " +
      "source.videoTimingVerified source.videoTimingMethod",
    ).lean();
    const persistedTimings = new Map(
      persistedQuestions.map((question) => [question.source?.questionId, question.source]),
    );
    if (persistedTimings.size !== 960 ||
        [...expectedTimings].some(([questionId, expected]) => {
          const saved = persistedTimings.get(questionId);
          return !saved ||
            saved.videoTimestampSeconds !== expected.startSeconds ||
            saved.videoEndTimestampSeconds !== expected.endSeconds ||
            saved.videoTimestampInferred !== true ||
            saved.videoEndTimestampInferred !== true ||
            saved.videoTimingVerified !== false ||
            saved.videoTimingMethod !== "duration_divided_by_48_120s";
        })) {
      throw new Error("The saved timestamps for all 960 questions could not be verified.");
    }
    const lessonResult = await FoundationContent.bulkWrite(lessonUpdates, { ordered: true });
    if (lessonResult.matchedCount !== 20) {
      throw new Error(`Matched ${lessonResult.matchedCount}/20 bank lessons.`);
    }
    const persistedLessons = await FoundationContent.find({
      published: true,
      subjectId: "subject.qudrat.quantitative",
      title: { $in: payload.banks.map((bank) => `بنك الكمي المحوسب ${bank.number}`) },
    }).select("title questionSolutionVideoUrl").lean();
    const persistedSources = new Map(
      persistedLessons.map((lesson) => [lesson.title, lesson.questionSolutionVideoUrl]),
    );
    if (persistedSources.size !== 20 ||
        payload.banks.some((bank) =>
          persistedSources.get(`بنك الكمي المحوسب ${bank.number}`) !== bank.videoUrl)) {
      throw new Error("The saved bank video links could not be verified.");
    }
    console.log(JSON.stringify({
      database: "current configured MongoDB environment",
      banks: lessonResult.matchedCount,
      questionTimings: persistedTimings.size,
      clipWindowSeconds: 120,
      timingBasis: "video duration divided into 48 equal positions",
      verifiedLinks: persistedSources.size,
      playback: "estimated two-minute clips, centered on each equal-duration position",
    }));
  } finally {
    await disconnectFromMongoDB();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
