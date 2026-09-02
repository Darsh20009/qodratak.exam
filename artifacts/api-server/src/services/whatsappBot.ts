import mongoose from "mongoose";
import {
  ExamBooking,
  Question,
  TestResult,
  User,
  WhatsAppQuizSession,
  type IExamBooking,
  type IQuestion,
} from "../mongodb/models";
import { mongoStorage } from "../mongodb/mongoStorage";
import { onWhatsAppMessage, sendWhatsAppText, type WhatsAppMessageEvent } from "./whatsappService";

const QUIZ_LENGTH = 5;
const phoneLocks = new Map<string, Promise<void>>();

function phoneVariants(rawPhone: string) {
  const digits = rawPhone.replace(/\D/g, "");
  const variants = new Set<string>([digits, `+${digits}`]);
  if (digits.startsWith("966") && digits.length === 12) {
    variants.add(`0${digits.slice(3)}`);
  }
  if (digits.startsWith("05") && digits.length === 10) {
    variants.add(`966${digits.slice(1)}`);
    variants.add(`+966${digits.slice(1)}`);
  }
  if (digits.startsWith("5") && digits.length === 9) {
    variants.add(`966${digits}`);
    variants.add(`+966${digits}`);
    variants.add(`0${digits}`);
  }
  return { digits, values: [...variants] };
}

function normalizeCommand(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[؟?!.,،:؛]/g, "")
    .replace(/\s+/g, " ");
}

function answerIndex(text: string) {
  const normalized = normalizeCommand(text).replace(/[٠١٢٣٤]/g, (digit) => String("٠١٢٣٤".indexOf(digit)));
  const arabicLetters: Record<string, number> = { "أ": 0, "ا": 0, "ب": 1, "ج": 2, "د": 3 };
  if (/^[1-4]$/.test(normalized)) return Number(normalized) - 1;
  if (arabicLetters[normalized] !== undefined) return arabicLetters[normalized];
  const latin = normalized.toUpperCase();
  if (/^[A-D]$/.test(latin)) return latin.charCodeAt(0) - 65;
  return null;
}

function displayName(user: any) {
  return user?.fullName || user?.username || "الطالب";
}

function formatDate(value: Date | string | undefined) {
  if (!value) return "غير محدد";
  return new Date(value).toLocaleString("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function examTypeName(type: string) {
  return {
    qudrat_scientific: "قدرات علمي",
    qudrat_literary: "قدرات أدبي",
    tahsili: "تحصيلي",
  }[type] || type;
}

function helpMessage(userName = "الطالب") {
  return [
    `أهلًا ${userName}، أنا مساعد قدراتك عبر واتساب.`,
    "",
    "أرسل أحد الأوامر:",
    "1) نتائجي — آخر نتائجك ونتائج الاختبارات المحجوزة",
    "2) حجوزاتي — مواعيد وحالة اختباراتك",
    "3) ابدأ اختبار — اختبار تدريبي من 5 أسئلة",
    "4) إلغاء — إلغاء الاختبار الجاري",
    "5) أجهزتي — عرض الأجهزة المسجلة وحذف جهاز",
    "6) مساعدة — عرض هذه القائمة",
    "",
    "أثناء الاختبار أرسل رقم الإجابة 1 أو 2 أو 3 أو 4.",
  ].join("\n");
}

async function findStudent(phone: string) {
  const { values } = phoneVariants(phone);
  return User.findOne({
    role: "student",
    $or: [
      { phone: { $in: values } },
      { whatsappPhone: { $in: values } },
    ],
  }).lean();
}

function formatQuestion(question: IQuestion, index: number, total: number) {
  const options = (question.options || [])
    .map((option, optionIndex) => `${optionIndex + 1}) ${option}`)
    .join("\n");
  return [
    `السؤال ${index + 1} من ${total}`,
    "",
    question.text,
    "",
    options,
    "",
    "أرسل رقم الإجابة فقط: 1 أو 2 أو 3 أو 4",
  ].join("\n");
}

async function loadSessionQuestions(session: any) {
  const ids = (session.questionIds || []).map((id: string) => Number(id)).filter(Number.isFinite);
  const questions = await Question.find({ questionId: { $in: ids } }).lean();
  const byId = new Map(questions.map((question: IQuestion) => [String(question.questionId), question]));
  return ids.map((id) => byId.get(String(id))).filter(Boolean) as IQuestion[];
}

async function startQuiz(phone: string, user: any) {
  const activeSession = await WhatsAppQuizSession.findOne({ phone, status: "active" });
  if (activeSession) {
    const questions = await loadSessionQuestions(activeSession);
    const currentQuestion = questions[activeSession.currentIndex];
    if (currentQuestion) {
      return formatQuestion(currentQuestion, activeSession.currentIndex, questions.length);
    }
  }

  const questions = await Question.aggregate<IQuestion>([{ $sample: { size: QUIZ_LENGTH } }]);
  if (questions.length === 0) {
    return "لا توجد أسئلة متاحة حاليًا. حاول مرة أخرى لاحقًا.";
  }

  await WhatsAppQuizSession.findOneAndUpdate(
    { phone },
    {
      phone,
      userId: String(user._id),
      questionIds: questions.map((question) => String(question.questionId)),
      currentIndex: 0,
      answers: [],
      status: "active",
      startedAt: new Date(),
      completedAt: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return [
    "بدأنا اختبارًا تدريبيًا سريعًا من 5 أسئلة.",
    "ستحصل بعد كل إجابة على التصحيح والشرح.",
    "",
    formatQuestion(questions[0], 0, questions.length),
  ].join("\n");
}

async function resultsMessage(user: any) {
  const userId = String(user._id);
  const [results, bookings] = await Promise.all([
    TestResult.find({ userId }).sort({ completedAt: -1 }).limit(5).lean(),
    ExamBooking.find({ userId, status: "completed" }).sort({ completedAt: -1 }).limit(5).lean(),
  ]);
  const visibleBookings = bookings.filter(
    (booking) => !booking.resultVisibleAt || new Date(booking.resultVisibleAt).getTime() <= Date.now(),
  );
  const pendingBookings = bookings.filter(
    (booking) => booking.resultVisibleAt && new Date(booking.resultVisibleAt).getTime() > Date.now(),
  );

  const lines = [`نتائج ${displayName(user)}`, ""];
  if (results.length > 0) {
    lines.push("نتائج التدريب:");
    results.forEach((result, index) => {
      lines.push(
        `${index + 1}) ${result.testName || result.testType || "اختبار"} — ${result.correctAnswers}/${result.totalQuestions} (${Math.round(result.percentage)}%)`,
        `   ${formatDate(result.completedAt)}`,
      );
    });
  }
  if (visibleBookings.length > 0) {
    lines.push("", "نتائج الاختبارات المحجوزة:");
    visibleBookings.forEach((booking, index) => {
      lines.push(
        `${index + 1}) ${examTypeName(booking.examType)} — ${Math.round(booking.totalScoreOutOf100 || 0)}/100`,
        `   صح: ${booking.correctAnswers || 0} | خطأ: ${booking.wrongAnswers || 0} | ${formatDate(booking.completedAt)}`,
      );
    });
  }
  if (pendingBookings.length > 0) {
    lines.push("", `هناك ${pendingBookings.length} نتيجة محجوزة قيد المراجعة وستظهر تلقائيًا بعد اعتمادها.`);
  }
  if (results.length === 0 && visibleBookings.length === 0 && pendingBookings.length === 0) {
    lines.push("لا توجد نتائج مسجلة حتى الآن.");
  }
  lines.push("", "أرسل «حجوزاتي» للمواعيد أو «ابدأ اختبار» للتدريب.");
  return lines.join("\n");
}

async function bookingsMessage(user: any) {
  const bookings = await ExamBooking.find({ userId: String(user._id) })
    .sort({ scheduledAt: -1 })
    .limit(8)
    .lean();
  if (bookings.length === 0) {
    return "لا توجد حجوزات مرتبطة بحسابك حاليًا.";
  }
  const lines = ["حجوزاتك في قدراتك:", ""];
  bookings.forEach((booking, index) => {
    const status = booking.status === "completed"
      ? booking.resultVisibleAt && new Date(booking.resultVisibleAt).getTime() > Date.now()
        ? "مكتمل — النتيجة قيد المراجعة"
        : `مكتمل — النتيجة ${Math.round(booking.totalScoreOutOf100 || 0)}/100`
      : booking.status === "active"
        ? "جارٍ الآن"
        : booking.status === "pending"
          ? "مؤكد"
          : "ملغى";
    lines.push(`${index + 1}) ${examTypeName(booking.examType)}`);
    lines.push(`   الموعد: ${formatDate(booking.scheduledAt)}`);
    lines.push(`   الحالة: ${status}`, "");
  });
  return lines.join("\n").trim();
}

function normalizeArabicDigits(text: string) {
  return text.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function deviceSelectionIndex(text: string) {
  const normalized = normalizeArabicDigits(normalizeCommand(text));
  const match = normalized.match(/^(?:احذف|حذف|delete)\s+(?:(?:جهاز|device)\s*)?(\d{1,2})$/);
  return match ? Number(match[1]) - 1 : null;
}

async function devicesMessage(user: any) {
  const devices = Array.isArray(user.devices) ? user.devices.filter((device: any) => device?.deviceKey) : [];
  if (devices.length === 0) {
    return "لا توجد أجهزة مسجلة على حسابك حاليًا.";
  }

  const lines = [
    "الأجهزة المسجلة على حسابك:",
    "",
    ...devices.flatMap((device: any, index: number) => [
      `${index + 1}) ${device.label || "جهاز متصفح"}`,
      `   آخر استخدام: ${formatDate(device.lastSeenAt)}`,
    ]),
    "",
    "لحذف جهاز أرسل: حذف جهاز 1",
    "استبدل الرقم برقم الجهاز المطلوب حذفه.",
  ];
  return lines.join("\n");
}

async function removeDeviceByIndex(user: any, index: number) {
  const userDocument = await User.findById(user._id);
  const devices = (userDocument?.devices || []).filter((device: any) => device?.deviceKey);
  if (!userDocument || index < 0 || index >= devices.length) {
    return "رقم الجهاز غير صحيح. أرسل «أجهزتي» لعرض القائمة من جديد.";
  }

  const removed = devices[index];
  userDocument.devices = devices.filter((device: any) => device.deviceKey !== removed.deviceKey) as any;
  await userDocument.save();
  return [
    `تم حذف الجهاز: ${removed.label || "جهاز متصفح"}.`,
    "",
    "يمكنك الآن تسجيل الدخول من جهاز جديد.",
    "أرسل «أجهزتي» لعرض الأجهزة المتبقية.",
  ].join("\n");
}

async function answerCurrentQuestion(phone: string, text: string) {
  const session = await WhatsAppQuizSession.findOne({ phone, status: "active" });
  if (!session) return null;
  const selectedIndex = answerIndex(text);
  if (selectedIndex === null) {
    return "أرسل رقم الإجابة فقط: 1 أو 2 أو 3 أو 4، أو أرسل «إلغاء».";
  }

  const questions = await loadSessionQuestions(session);
  const question = questions[session.currentIndex];
  if (!question) {
    session.status = "completed";
    session.completedAt = new Date();
    await session.save();
    return "انتهت جلسة الاختبار. أرسل «ابدأ اختبار» لبدء اختبار جديد.";
  }
  if (selectedIndex < 0 || selectedIndex >= question.options.length) {
    return `هذه الإجابة غير متاحة. اختر رقمًا من 1 إلى ${question.options.length}.`;
  }

  const isCorrect = selectedIndex === question.correctOptionIndex;
  session.answers.push({
    questionId: String(question.questionId),
    selectedIndex,
    correctIndex: question.correctOptionIndex,
    isCorrect,
  });
  session.currentIndex += 1;

  const feedback = [
    isCorrect ? "إجابة صحيحة ✅" : "إجابة غير صحيحة ❌",
    `الإجابة الصحيحة: ${question.correctOptionIndex + 1}) ${question.options[question.correctOptionIndex] || ""}`,
    question.explanation ? `الشرح: ${question.explanation}` : "لا يوجد شرح إضافي لهذا السؤال.",
  ];

  const nextQuestion = questions[session.currentIndex];
  if (!nextQuestion) {
    session.status = "completed";
    session.completedAt = new Date();
    await session.save();

    const correctAnswers = session.answers.filter((answer) => answer.isCorrect).length;
    const totalQuestions = session.answers.length;
    if (mongoose.Types.ObjectId.isValid(String(session.userId))) {
      await mongoStorage.createTestResult({
        userId: String(session.userId),
        testType: "custom",
        testName: "اختبار واتساب التدريبي",
        difficulty: "mixed",
        score: correctAnswers,
        totalQuestions,
        correctAnswers,
        wrongAnswers: totalQuestions - correctAnswers,
        skippedQuestions: 0,
        percentage: (correctAnswers / totalQuestions) * 100,
        timeTaken: Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000),
        pointsEarned: correctAnswers * 10 - (totalQuestions - correctAnswers),
        isOfficial: false,
        questionDetails: session.answers,
      } as any);
    }
    feedback.push(
      "",
      `انتهى الاختبار. نتيجتك: ${correctAnswers}/${totalQuestions} (${Math.round((correctAnswers / totalQuestions) * 100)}%).`,
      "تم حفظ النتيجة في حسابك. أرسل «نتائجي» لعرضها.",
    );
  } else {
    await session.save();
    feedback.push("", formatQuestion(nextQuestion, session.currentIndex, questions.length));
  }
  return feedback.join("\n");
}

async function processInboundMessage(message: WhatsAppMessageEvent) {
  const { digits } = phoneVariants(message.phone);
  if (!digits || !message.content.trim()) return;

  const user = await findStudent(digits);
  if (!user) {
    await sendWhatsAppText(
      digits,
      "لم أجد حساب طالب مرتبطًا بهذا الرقم. أنشئ حسابًا أو اربط رقم الجوال أولًا من منصة قدراتك.",
    );
    return;
  }

  const command = normalizeCommand(message.content);
  const session = await WhatsAppQuizSession.findOne({ phone: digits, status: "active" });
  let reply: string | null = null;
  const selectedDeviceIndex = deviceSelectionIndex(message.content);

  if (selectedDeviceIndex !== null) {
    reply = await removeDeviceByIndex(user, selectedDeviceIndex);
  } else if (
    command === "أجهزتي" ||
    command === "اجهزتي" ||
    command === "أجهزتي المسجلة" ||
    command === "الأجهزة" ||
    command === "الاجهزة" ||
    command === "devices"
  ) {
    reply = await devicesMessage(user);
  } else if (session && (command === "إلغاء" || command === "الغاء" || command === "cancel")) {
    session.status = "cancelled";
    await session.save();
    reply = "تم إلغاء الاختبار التدريبي. أرسل «ابدأ اختبار» في أي وقت للبدء من جديد.";
  } else if (session && answerIndex(message.content) !== null) {
    reply = await answerCurrentQuestion(digits, message.content);
  } else if (command === "مساعدة" || command === "help" || command === "قائمة" || command === "مرحبا" || command === "اهلا" || command === "أهلا") {
    reply = helpMessage(displayName(user));
  } else if (command.includes("نتائج") || command.includes("نتيجة") || command === "درجاتي") {
    reply = await resultsMessage(user);
  } else if (command.includes("حجوز") || command.includes("مواعيدي")) {
    reply = await bookingsMessage(user);
  } else if (command.includes("ابدأ اختبار") || command === "اختبار" || command === "ابدأ" || command === "ابدء اختبار") {
    reply = await startQuiz(digits, user);
  } else if (session) {
    reply = "لديك اختبار جارٍ. أرسل رقم الإجابة 1 أو 2 أو 3 أو 4، أو أرسل «إلغاء».";
  } else {
    reply = helpMessage(displayName(user));
  }

  if (reply) await sendWhatsAppText(digits, reply);
}

export function registerWhatsAppBot() {
  return onWhatsAppMessage((message) => {
    if (message.direction !== "inbound") return;
    const phone = phoneVariants(message.phone).digits;
    const previous = phoneLocks.get(phone) || Promise.resolve();
    const current = previous
      .catch(() => undefined)
      .then(() => processInboundMessage(message))
      .catch((error) => console.error("[WhatsApp Bot] inbound message failed:", error));
    phoneLocks.set(phone, current);
    void current.finally(() => {
      if (phoneLocks.get(phone) === current) phoneLocks.delete(phone);
    });
  });
}

export async function sendStudentExamResult(phone: string | undefined, booking: Partial<IExamBooking>) {
  if (!phone) return;
  const message = [
    "تم اعتماد نتيجة اختبارك المحجوز في منصة قدراتك 🎓",
    `الاختبار: ${examTypeName(String(booking.examType || ""))}`,
    `النتيجة: ${Math.round(Number(booking.totalScoreOutOf100 || 0))}/100`,
    `الإجابات الصحيحة: ${Number(booking.correctAnswers || 0)}`,
    `الإجابات الخاطئة: ${Number(booking.wrongAnswers || 0)}`,
    "",
    "أرسل «نتائجي» لعرض آخر نتائجك عبر واتساب.",
  ].join("\n");
  await sendWhatsAppText(phone, message);
}