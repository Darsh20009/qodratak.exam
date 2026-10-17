import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103163cd9c24f9f40e66", page: 97, number: 1, subcategory: "النباتات - تصنيف النباتات", text: "أي مجموعة نباتية لا تمتلك أنسجة وعائية حقيقية؟", options: ["السرخسيات", "النباتات الصولجانية", "الكنباث", "الحزازيات"], answer: 3, explanation: "الحزازيات نباتات لاوعائية، فلا تمتلك أوعية خشب ولحاء حقيقية. أما السرخسيات والصولجانيات والكنباث فنباتات وعائية لا بذرية." },
  { id: "6ad0103163cd9c24f9f40e67", page: 97, number: 2, subcategory: "النباتات - تصنيف النباتات", text: "إلى أي مورد جيولوجي أسهمت نباتات صولجانية قديمة في تكوينه؟", options: ["الغاز الطبيعي", "الفحم الأحفوري", "البذور", "الأزهار"], answer: 1, explanation: "أسهمت بقايا نباتات وعائية قديمة، ومنها نباتات صولجانية، في تكوين رواسب الفحم عبر الأزمنة الجيولوجية." },
  { id: "6ad0103163cd9c24f9f40e68", page: 97, number: 3, subcategory: "النباتات - تصنيف النباتات", text: "أي النباتات الآتية نبات وعائي لا بذري؟", options: ["الحزازيات", "السرخسيات", "الحشائش الكبدية", "الحشائش البوقية"], answer: 1, explanation: "السرخسيات تمتلك أنسجة وعائية وتتكاثر بالأبواغ لا بالبذور." },
  { id: "6ad0103163cd9c24f9f40e69", page: 97, number: 4, subcategory: "النباتات - تصنيف النباتات", text: "أي النباتات الآتية يُصنف ضمن السرخسيات وحلفائها؟", options: ["الحشائش الكبدية", "الكنباث", "الصنوبر", "العرعر"], answer: 1, explanation: "الكنباث من النباتات الوعائية اللابذرية القريبة من السرخسيات؛ أما الصنوبر والعرعر فمن معراة البذور." },
  { id: "6ad0103163cd9c24f9f40e6a", page: 97, number: 5, subcategory: "النباتات - تصنيف النباتات", text: "من أي مجموعة نباتية يُستخلص الإيفيدرين من نبات الإفيدرا؟", options: ["الجنكيات", "الحزازيات", "السرخسيات", "الجنتويات"], answer: 3, explanation: "ينتمي نبات الإفيدرا إلى الجنتويات، وتحتوي بعض أنواعه على الإيفيدرين المستخدم دوائيًا كمزيل للاحتقان." },
  { id: "6ad0103163cd9c24f9f40e6b", page: 97, number: 6, subcategory: "النباتات - تصنيف النباتات", text: "لماذا تعتمد النباتات اللاوعائية على البيئات الرطبة لإتمام التكاثر؟", options: ["لوجود الطور البوغي السائد", "لأن أعضائها التكاثرية على نباتات منفصلة دائمًا", "لأن الماء يساعد المشيج الذكري على الوصول إلى البويضة", "لأنها تمتلك أنسجة وعائية حقيقية"], answer: 2, explanation: "تحتاج النباتات اللاوعائية إلى الماء كي تتحرك الأمشاج الذكرية نحو البويضة، لذلك يرتبط تكاثرها بالبيئات الرطبة." },
  { id: "6ad0103163cd9c24f9f40e6e", page: 98, number: 1, subcategory: "النباتات - الأنسجة والهرمونات", text: "ما النسيج الذي يسمح للأعشاب باستمرار النمو بعد قص القمة النامية؟", options: ["الكامبيوم الفليني", "الأنسجة المولدة البينية", "الأنسجة المولدة الجانبية", "الكامبيوم الوعائي"], answer: 1, explanation: "توجد الأنسجة المولدة البينية قرب قواعد الأوراق أو العقد في بعض النباتات، فتتيح استمرار نموها بعد قص القمم." },
  { id: "6ad0103163cd9c24f9f40e6f", page: 98, number: 2, subcategory: "النباتات - الأنسجة والهرمونات", text: "ما التركيب النباتي الذي يستخدم عادة في صناعة الحبال والأقمشة؟", options: ["الخلايا الكولنشيمية", "الخلايا الحجرية", "الخلايا البرنشيمية", "الألياف"], answer: 3, explanation: "تستفاد من الألياف النباتية الطويلة والمتينة في صناعة الحبال والأقمشة." },
  { id: "6ad0103163cd9c24f9f40e70", page: 98, number: 3, subcategory: "النباتات - الأنسجة والهرمونات", text: "ما سبب الصلابة الحبيبية في بعض أجزاء ثمرة الجوافة؟", options: ["الخلايا البرنشيمية", "الخلايا الحجرية", "الخلايا الكولنشيمية", "الألياف الطويلة"], answer: 1, explanation: "الخلايا الحجرية نوع من خلايا الإسكلرنشيم ذات جدران سميكة وصلبة، وقد تعطي أجزاء من الثمرة قوامًا حبيبيًا." },
  { id: "6ad0103163cd9c24f9f40e71", page: 98, number: 4, subcategory: "النباتات - الأنسجة والهرمونات", text: "ما الظاهرة التي تفسر ميل ساق النبات نحو مصدر الضوء؟", options: ["انتحاء ضوئي موجب", "انتحاء أرضي موجب", "انتحاء لمسي", "انتحاء مائي"], answer: 0, explanation: "ينمو الساق باتجاه الضوء في الانتحاء الضوئي الموجب." },
  { id: "6ad0103163cd9c24f9f40e72", page: 98, number: 5, subcategory: "النباتات - الأنسجة والهرمونات", text: "أي الخلايا النباتية الآتية لا تنقسم عادة بعد اكتمال نضجها؟", options: ["البرنشيمية", "الإسكلرنشيمية", "الإنشائية", "الكولنشيمية"], answer: 1, explanation: "تكون خلايا الإسكلرنشيم غالبًا ميتة عند النضج، فلا تنقسم بعد اكتمال نموها." },
  { id: "6ad0103163cd9c24f9f40e73", page: 98, number: 6, subcategory: "النباتات - الأنسجة والهرمونات", text: "أي هرمون نباتي يشارك في توجيه النمو والانتحاء؟", options: ["الإيثيلين", "الأكسين", "السيتوكاينين", "الجبرلين"], answer: 1, explanation: "يسهم الأكسين في تنظيم استطالة الخلايا، وتوزعه غير المتساوي يساعد على حدوث بعض استجابات الانتحاء." },
  { id: "6ad0103163cd9c24f9f40e74", page: 98, number: 7, subcategory: "النباتات - الأنسجة والهرمونات", text: "أي كائن من الآتي تحتوي خلاياه على جدار من السليلوز؟", options: ["خلية حيوانية", "خلية نباتية", "خلية فطرية", "خلية بدائية"], answer: 1, explanation: "تتكون جدران الخلايا النباتية أساسًا من السليلوز؛ أما الفطريات فجدرانها من الكايتين، ولا تملك الخلايا الحيوانية جدارًا خلويًا." },
  { id: "6ad0103163cd9c24f9f40e75", page: 98, number: 8, subcategory: "النباتات - الأنسجة والهرمونات", text: "إذا انحنى ساق النبات باتجاه مصباح، فما العامل الذي سبب الاستجابة؟", options: ["الحرارة", "الإضاءة", "الجاذبية", "الرطوبة"], answer: 1, explanation: "اتجاه نمو الساق نحو مصدر الإضاءة استجابة للضوء، وتسمى انتحاءً ضوئيًا موجبًا." },
  { id: "6ad0103163cd9c24f9f40e77", page: 98, number: 10, subcategory: "النباتات - الأنسجة والهرمونات", text: "كيف يستجيب ساق النبات للجاذبية بعد وضعه أفقيًا؟", options: ["ينمو إلى أعلى بعيدًا عن اتجاه الجاذبية", "ينمو إلى أسفل باتجاه الجاذبية", "لا يغير اتجاه نموه", "ينمو باتجاه مركز الأرض بعد أن كان أفقيًا فقط"], answer: 0, explanation: "يظهر الساق انتحاءً أرضيًا سالبًا، فينمو عكس اتجاه الجاذبية. أما الجذر فيظهر غالبًا انتحاءً أرضيًا موجبًا." },
  { id: "6ad0103163cd9c24f9f40e78", page: 98, number: 11, subcategory: "النباتات - الأنسجة والهرمونات", text: "ما نوع الانتحاء الذي يجعل محلاق النبات يلتف حول دعامة عند ملامستها؟", options: ["الضوئي", "الأرضي", "اللمسي", "الأفقي"], answer: 2, explanation: "استجابة نمو النبات للمس تسمى الانتحاء اللمسي، وتظهر في التفاف المحاليق حول الدعامات." },
  { id: "6ad0103163cd9c24f9f40e79", page: 99, number: 12, subcategory: "النباتات - الأنسجة والهرمونات", text: "أي هرمون نباتي غازي يساعد على نضج الثمار؟", options: ["الإيثيلين", "الأكسين", "الأوكسيتوسين", "الجبرلين"], answer: 0, explanation: "الإيثيلين هرمون نباتي غازي يسرّع نضج كثير من الثمار." },
  { id: "6ad0103163cd9c24f9f40e7a", page: 99, number: 13, subcategory: "النباتات - الأنسجة والهرمونات", text: "ما الوظيفة الأساسية لخلايا الإسكلرنشيم في النبات؟", options: ["الدعامة", "تبادل الغازات", "البناء الضوئي", "تخزين الغذاء"], answer: 0, explanation: "تمنح خلايا الإسكلرنشيم النبات دعامة ميكانيكية بفضل جدرانها السميكة والملجننة." },
  { id: "6ad0103163cd9c24f9f40e7c", page: 99, number: 15, subcategory: "النباتات - الأنسجة والهرمونات", text: "أي هرمون نباتي ينظم استطالة الخلايا ويسهم في توجيه نمو الجذر؟", options: ["الأكسين", "الإيثيلين", "السيتوكاينين", "الجبرلين"], answer: 0, explanation: "يسهم الأكسين في تنظيم استطالة الخلايا وتوجيه النمو، ويعتمد أثره على تركيزه والجزء النباتي." },
  { id: "6ad0103163cd9c24f9f40e7d", page: 99, number: 16, subcategory: "النباتات - الأنسجة والهرمونات", text: "أي نسيج يسبب النمو الثانوي وزيادة سمك الساق؟", options: ["النسيج المولد القمي", "النسيج المولد الجانبي", "البشرة", "النسيج البرنشيمي"], answer: 1, explanation: "تنقسم الأنسجة المولدة الجانبية، ومنها الكامبيوم الوعائي والفليني، فتسهم في النمو الثانوي وزيادة سمك الساق والجذر." },
  { id: "6ad0103163cd9c24f9f40e7e", page: 99, number: 17, subcategory: "النباتات - الأنسجة والهرمونات", text: "أي نسيج يوفر دعامة مرنة للأجزاء النباتية الفتية أثناء نموها؟", options: ["الكولنشيم", "الإسكلرنشيم", "البشرة", "البرنشيم"], answer: 0, explanation: "توفر خلايا الكولنشيم دعامة مرنة للأجزاء الفتية التي ما زالت تنمو؛ أما الإسكلرنشيم فيدعم الأجزاء الناضجة غالبًا." },
  { id: "6ad0103163cd9c24f9f40e7f", page: 99, number: 18, subcategory: "النباتات - الأنسجة والهرمونات", text: "ما العامل الذي يفسر انحناء النبات في الشكل نحو جهة المصباح؟", options: ["الحرارة", "الإضاءة", "الجاذبية", "الرطوبة"], answer: 1, explanation: "ينحني الساق باتجاه الضوء بسبب الانتحاء الضوئي الموجب." },
  { id: "6ad0103163cd9c24f9f40e80", page: 99, number: 19, subcategory: "النباتات - الأنسجة والهرمونات", text: "أي نسيج مسؤول عن الزيادة في طول الجذر؟", options: ["النسيج المولد القمي", "النسيج المولد الجانبي", "البشرة", "النسيج الوعائي"], answer: 0, explanation: "توجد الأنسجة المولدة القمية عند قمم الجذور والسيقان، وتنتج خلايا جديدة تسهم في الاستطالة والنمو الأولي." },
  { id: "6ad0103163cd9c24f9f40e81", page: 99, number: 20, subcategory: "النباتات - الأنسجة والهرمونات", text: "ما الوصف الصحيح للانتحاء الضوئي الموجب؟", options: ["ينمو النبات بعيدًا عن مصدر الضوء", "ينمو النبات باتجاه مصدر الضوء", "ينمو بعيدًا عن مركز الجاذبية", "ينمو باتجاه مركز الجاذبية"], answer: 1, explanation: "الانتحاء الضوئي الموجب هو نمو الجزء النباتي باتجاه مصدر الضوء." },
  { id: "6ad0103163cd9c24f9f40e82", page: 99, number: 21, subcategory: "النباتات - الأنسجة والهرمونات", text: "انخفاض أي هرمون قد يضعف تثبيط منطقة الانفصال ويسهم في سقوط الثمار الناضجة؟", options: ["الإيثيلين", "الأكسين", "السيتوكاينين", "الجبرلين"], answer: 1, explanation: "يساعد الأكسين في الحد من الانفصال؛ وقد يؤدي انخفاضه مع إشارات نضج أخرى إلى تسهيل انفصال الثمرة. كما يسهم الإيثيلين في تنظيم النضج والانفصال." },
  { id: "6ad0103163cd9c24f9f40e83", page: 99, number: 22, subcategory: "النباتات - الأنسجة والهرمونات", text: "ما الوظيفة الأساسية لخلايا الإسكلرنشيم؟", options: ["الدعامة الميكانيكية", "تبادل الغازات", "البناء الضوئي", "تخزين الغذاء"], answer: 0, explanation: "تدعم خلايا الإسكلرنشيم النبات، وغالبًا تكون خلاياها الناضجة ذات جدران سميكة ملجننة." },
] as const;
const rejections = [
  { id: "6ad0103163cd9c24f9f40e6c", page: 97, number: 7, reason: "جميع الخيارات نباتات لها DNA؛ لذا لا يوجد خيار صحيح للسؤال كما صيغ في المصدر." },
  { id: "6ad0103163cd9c24f9f40e6d", page: 97, number: 8, reason: "كل الخيارات المعروضة تمتلك نواة أو بلاستيدات أو جدارًا خلويًا بحسب نوعها، كما أن ملاحظة المصدر التي تنسب غياب تسلسل DNA للحشائش الكبدية غير صحيحة. لا يمكن اعتماد السؤال أو مفتاحه." },
  { id: "6ad0103163cd9c24f9f40e7b", page: 99, number: 14, reason: "لا يحتوي أي خيار على مادة الأنابيب الغربالية/اللحاء التي تنقل الغذاء؛ الخيارات المطروحة (أغشية إندوبلازمية، ميتوكوندريا، ريبوسومات، مريكزات) لا تقدم إجابة صحيحة ووحيدة." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const ids = [...approvals.map((item) => item.id), ...rejections.map((item) => item.id)];
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: ids }, sourceId: SOURCE_ID })
    .select("_id questionId sourceKey sourceId sourceOrdinal sourcePage sourceBlockIndex sourceBook topic difficulty status")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== ids.length) failures.push(`expected ${ids.length} source rows, found ${drafts.length}`);
  for (const item of approvals) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey || !["pending_review", "approved"].includes(draft.status)) failures.push(`q${item.number} p${item.page}: source/page/status mismatch`);
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.options.some((option) => !option.trim()) || item.answer < 0 || item.answer > 3) failures.push(`q${item.number} p${item.page}: invalid cleaned options/key`);
    const published = draft?.sourceKey ? await TahsiliQuestion.findOne({ sourceKey: draft.sourceKey }).select("text correctOptionIndex").lean() as any : null;
    if (draft?.status === "approved" && (!published || published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number} p${item.page}: approved draft does not match its published record`);
    if (published && (published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number} p${item.page}: published record conflicts with this review`);
  }
  for (const item of rejections) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey || !["pending_review", "rejected"].includes(draft.status)) failures.push(`q${item.number} p${item.page}: rejection source/page/status mismatch`);
    if (draft?.sourceKey && await TahsiliQuestion.exists({ sourceKey: draft.sourceKey })) failures.push(`q${item.number} p${item.page}: rejected draft already has a published row`);
  }
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: drafts.length, approved: approvals.length, rejected: rejections.length, changed: false };
  if (!apply) { console.log(JSON.stringify(summary, null, 2)); return; }
  const reviewedAt = new Date();
  for (const item of approvals) {
    const draft = byId.get(item.id)!;
    const sourceQuestionNumber = draft.sourceOrdinal * 100_000 + draft.sourcePage * 100 + draft.sourceBlockIndex;
    await TahsiliQuestion.findOneAndUpdate({ sourceKey: draft.sourceKey }, { $set: {
      questionId: draft.questionId, sourceId: draft.sourceId, sourceKey: draft.sourceKey, sourceOrdinal: draft.sourceOrdinal,
      subject: "أحياء", subcategory: item.subcategory, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate", topic: item.subcategory, explanation: item.explanation,
      sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
      ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
      sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
    }, $setOnInsert: { createdAt: reviewedAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } }, { $set: {
      status: "approved", subject: "أحياء", subcategory: item.subcategory, text: item.text, options: [...item.options], explanation: item.explanation,
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة الإجابة والصياغة مع محتوى المصدر، وتصحيح أو حذف الاعتماد غير الضروري على الأشكال.", updatedAt: reviewedAt,
    } });
  }
  for (const item of rejections) {
    const draft = byId.get(item.id)!;
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "rejected"] } }, { $set: {
      status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: item.reason, updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
