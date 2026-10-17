import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const subject = "أحياء";
const fish = "الفقاريات - الأسماك";
const amphibians = "الفقاريات - البرمائيات";
const approvals = [
  { id: "6ad0103063cd9c24f9f40d18", page: 49, number: 1, subcategory: fish, text: "أي عضو يساعد الأسماك العظمية على ضبط الطفو في الماء؟", options: ["مثانة العوم", "الذيل", "المعي الأعور", "الفم"], answer: 0, explanation: "تساعد مثانة العوم معظم الأسماك العظمية على ضبط الطفو وتغيير العمق دون بذل جهد كبير." },
  { id: "6ad0103063cd9c24f9f40d1a", page: 49, number: 3, subcategory: fish, text: "أي الصفات الآتية لا توجد في الأسماك؟", options: ["الخياشيم", "الزعانف", "قلب ثلاثي الحجرات", "النفرونات"], answer: 2, explanation: "قلب السمكة مكوّن من حجرتين رئيسيتين، أذين وبطين؛ أما القلب ثلاثي الحجرات فيوجد لدى البرمائيات ومعظم الزواحف." },
  { id: "6ad0103063cd9c24f9f40d1b", page: 49, number: 4, subcategory: fish, text: "أي الأسماك الآتية عديمة الفكوك؟", options: ["القرش", "الورنك", "الجلكي", "الراي"], answer: 2, explanation: "الجلكي من الأسماك اللافكية؛ أما القروش والورنك والراي فلها فكوك." },
  { id: "6ad0103063cd9c24f9f40d1c", page: 49, number: 5, subcategory: fish, text: "أي تركيب يساعد السمكة على استشعار حركة الماء والاهتزازات حولها؟", options: ["جهاز الخط الجانبي", "الزعانف", "الفكوك", "الخياشيم"], answer: 0, explanation: "يستشعر جهاز الخط الجانبي حركة الماء والاهتزازات، ويساعد السمكة على إدراك ما يحيط بها." },
  { id: "6ad0103063cd9c24f9f40d1d", page: 49, number: 6, subcategory: fish, text: "ما الوظيفة الأساسية لزعانف الأسماك؟", options: ["الحركة والاتزان", "التغذية", "الإخراج", "التنفس"], answer: 0, explanation: "تساعد الزعانف على دفع السمكة وتوجيهها والمحافظة على اتزانها." },
  { id: "6ad0103063cd9c24f9f40d1e", page: 49, number: 7, subcategory: fish, text: "كيف توصف الدورة الدموية في الأسماك؟", options: ["دورة واحدة مغلقة", "دورة واحدة مفتوحة", "دورتان مفتوحتان", "دورتان مغلقتان"], answer: 0, explanation: "للأسماك دورة دموية واحدة مغلقة؛ يمر الدم بالقلب مرة واحدة في كل دورة كاملة." },
  { id: "6ad0103063cd9c24f9f40d1f", page: 49, number: 8, subcategory: fish, text: "إذا تضرر جهاز الخط الجانبي لدى السمكة، فأي قدرة تتأثر مباشرة؟", options: ["الرؤية", "التنفس", "الهضم", "استشعار الحركة والاهتزازات في الماء"], answer: 3, explanation: "الخط الجانبي مسؤول عن استشعار حركة الماء والاهتزازات، لذلك تتأثر قدرة السمكة على إدراك الحركة المحيطة." },
  { id: "6ad0103063cd9c24f9f40d20", page: 49, number: 9, subcategory: fish, text: "ما نوع القشور التي تغطي سمكة السردين؟", options: ["قرصية", "صفائحية", "مشطية", "معينية لامعة"], answer: 0, explanation: "تغطي الأسماك العظمية مثل السردين قشور قرصية رقيقة؛ أما القشور الصفائحية فتوجد لدى القروش." },
  { id: "6ad0103063cd9c24f9f40d21", page: 49, number: 10, subcategory: fish, text: "ما وظيفة مثانة العوم في السمكة؟", options: ["استشعار الحركة", "الرؤية", "التحكم في الطفو والعمق", "التنفس بالخياشيم"], answer: 2, explanation: "تساعد مثانة العوم السمكة العظمية على تنظيم طفوها وضبط العمق الذي تسبح فيه." },
  { id: "6ad0103063cd9c24f9f40d22", page: 49, number: 11, subcategory: fish, text: "أي تركيب جنيني يسهم في تكوين بعض عظام الجمجمة وأجزاء من أعضاء الحس؟", options: ["السائل العصبي", "العرف العصبي", "العمود الفقري", "الذيل"], answer: 1, explanation: "تسهم خلايا العرف العصبي في تكوين تراكيب متعددة، منها أجزاء من عظام الوجه والجمجمة وبعض مكونات أعضاء الحس." },
  { id: "6ad0103063cd9c24f9f40d23", page: 49, number: 12, subcategory: fish, text: "كيف تساعد بعض الأسماك على البقاء في البحار شديدة البرودة؟", options: ["تحتوي سوائل جسمها على بروتينات مضادة للتجمد", "تعتمد على الذيل وحده", "تستخدم الزعانف لتدفئة الماء", "تحيط بها قشور تمنع تجمد البحر"], answer: 0, explanation: "تنتج بعض أسماك المياه القطبية بروتينات مضادة للتجمد تقلل تكوّن بلورات الجليد في سوائل الجسم." },
  { id: "6ad0103063cd9c24f9f40d24", page: 50, number: 13, subcategory: fish, text: "في أي الحيوانات الآتية يكون الإخصاب خارجيًا غالبًا؟", options: ["الثعبان", "طائر الطنان", "سمك البلطي", "منقار البط"], answer: 2, explanation: "تطلق أسماك البلطي البيوض والحيوانات المنوية في الماء، ويحدث الإخصاب خارجيًا غالبًا." },
  { id: "6ad0103063cd9c24f9f40d25", page: 50, number: 14, subcategory: fish, text: "ما التركيب الذي يساعد الأسماك على اكتشاف الحركة والاهتزازات في الماء؟", options: ["جهاز الخط الجانبي", "القشور", "جهاز الدوران", "الزعانف"], answer: 0, explanation: "يستشعر جهاز الخط الجانبي تغيرات حركة الماء والاهتزازات حول السمكة." },
  { id: "6ad0103063cd9c24f9f40d26", page: 50, number: 15, subcategory: fish, text: "أي وصف ينطبق على الدورة الدموية في الأسماك؟", options: ["مزدوجة", "متغيرة", "واحدة مفتوحة", "واحدة مغلقة"], answer: 3, explanation: "يمر الدم في الأسماك خلال دورة واحدة مغلقة من القلب إلى الخياشيم ثم إلى الجسم ويعود للقلب." },
  { id: "6ad0103063cd9c24f9f40d27", page: 50, number: 16, subcategory: fish, text: "قلب مكوّن من حجرتين رئيسيتين: أذين وبطين. إلى أي مجموعة ينتمي الحيوان غالبًا؟", options: ["البرمائيات", "الزواحف", "الطيور", "الأسماك"], answer: 3, explanation: "يتكون قلب السمكة من أذين وبطين، ويضخ الدم في دورة دموية واحدة." },
  { id: "6ad0103063cd9c24f9f40d28", page: 50, number: 17, subcategory: fish, text: "أي الأسماك الآتية تمتلك مثانة عوم؟", options: ["سمك القرش", "الهامور", "الدلفين", "كلب البحر"], answer: 1, explanation: "الهامور من الأسماك العظمية التي تمتلك مثانة عوم؛ أما القرش وكلب البحر فأسماك غضروفية، والدلفين ثديي." },
  { id: "6ad0103063cd9c24f9f40d29", page: 50, number: 18, subcategory: fish, text: "أي الأنواع الآتية له فم بطني نموذجي؟", options: ["السلمون", "القرش", "الدلفين", "الجلكي"], answer: 1, explanation: "يقع الفم في الجهة البطنية لدى القروش. استُبدلت الخيارات المتداخلة في المصدر بأنواع محددة لتكون الإجابة واحدة." },
  { id: "6ad0103163cd9c24f9f40d2a", page: 50, number: 19, subcategory: fish, text: "أي تركيب جنيني يتطور إلى الدماغ والحبل الشوكي؟", options: ["العرف العصبي", "الحبل العصبي", "الحبل الظهري", "العمود الفقري"], answer: 1, explanation: "يتطور الأنبوب العصبي، ويسمى في هذه المرحلة الحبل العصبي، إلى الدماغ والحبل الشوكي. استُبدل السؤال المعتمد على سهم الشكل بصياغة نصية." },
  { id: "6ad0103163cd9c24f9f40d2b", page: 51, number: 1, subcategory: amphibians, text: "في أي الحيوانات الآتية يحدث الإخصاب خارج الجسم غالبًا؟", options: ["الصقر", "البطريق", "الضفدع", "السلحفاة"], answer: 2, explanation: "يحدث الإخصاب لدى معظم الضفادع خارجيًا في الماء، بعد إطلاق البيوض والحيوانات المنوية." },
  { id: "6ad0103163cd9c24f9f40d2c", page: 51, number: 2, subcategory: amphibians, text: "ما الذي يساعد الضفدع على التنفس عندما يكون في تربة رطبة؟", options: ["أنابيب ملبيجي", "الأرجل", "الجلد الرطب", "الرئات فقط"], answer: 2, explanation: "يسمح جلد الضفدع الرطب بتبادل الغازات، خصوصًا عندما يكون في بيئة رطبة." },
  { id: "6ad0103163cd9c24f9f40d2d", page: 51, number: 3, subcategory: amphibians, text: "إذا حدث جفاف في موطن مائي، فأي الحيوانات الآتية يُتوقع أن يتأثر تكاثره أكثر؟", options: ["الضب", "الضفدع", "التمساح", "الأفعى"], answer: 1, explanation: "يعتمد تكاثر كثير من الضفادع على الماء لوضع البيوض ونمو اليرقات؛ لذلك يتأثر عند جفاف الموطن المائي. صُحح مفتاح المصدر الذي لا يطابق المعلومة الواردة فيه." },
  { id: "6ad0103163cd9c24f9f40d2e", page: 51, number: 4, subcategory: amphibians, text: "أي الحيوانات الآتية يستمد حرارة جسمه من البيئة الخارجية؟", options: ["ثابت الحرارة", "متعادلة الحرارة", "متوازية الحرارة", "متغيرة درجة الحرارة"], answer: 3, explanation: "الحيوانات متغيرة درجة الحرارة تعتمد على مصادر خارجية لتنظيم حرارة جسمها." },
  { id: "6ad0103163cd9c24f9f40d2f", page: 51, number: 5, subcategory: amphibians, text: "أي الحيوانات الآتية يتأثر تكاثره أكثر إذا جف موطنه المائي؟", options: ["الضفدع", "السلاحف المائية", "التمساح", "الدب"], answer: 0, explanation: "تحتاج كثير من الضفادع إلى الماء لوضع البيوض ومرور اليرقات بمراحل نموها الأولى." },
  { id: "6ad0103163cd9c24f9f40d30", page: 51, number: 6, subcategory: amphibians, text: "ما الصفة المشتركة بين أبو ذنيبة وسمك القرش؟", options: ["القشور", "الخياشيم", "الزعانف", "مثانة العوم"], answer: 1, explanation: "يتنفس أبو ذنيبة في مرحلته اليرقية بالخياشيم، كما تتنفس الأسماك ومنها القرش بالخياشيم." },
  { id: "6ad0103163cd9c24f9f40d31", page: 51, number: 7, subcategory: fish, text: "ما الصفة المشتركة بين الجلكي والقرش في مخطط فن؟", options: ["الرئات", "الفكوك", "الزعانف المزدوجة", "الخياشيم"], answer: 3, explanation: "كلاهما يتنفس بالخياشيم؛ لكن الجلكي عديم الفكوك، بينما يمتلك القرش فكوكًا." },
  { id: "6ad0103163cd9c24f9f40d32", page: 51, number: 8, subcategory: amphibians, text: "كم حجرة يتكون منها قلب معظم البرمائيات؟", options: ["حجرتان", "ثلاث حجرات", "أربع حجرات", "خمس حجرات"], answer: 1, explanation: "يتكون قلب معظم البرمائيات من أذينين وبطين واحد، أي ثلاث حجرات." },
  { id: "6ad0103163cd9c24f9f40d33", page: 51, number: 9, subcategory: amphibians, text: "ما الصفة التي تميز العلجوم عن كثير من الضفادع؟", options: ["الأطراف", "الجلد الرطب", "العيون الصغيرة", "غدد نكفية تفرز سمًا"], answer: 3, explanation: "تمتلك العلاجم غددًا جلدية بارزة، منها الغدد النكفية التي تفرز مواد سامة للدفاع." },
  { id: "6ad0103163cd9c24f9f40d34", page: 51, number: 10, subcategory: amphibians, text: "كيف يستطيع الضفدع البقاء حيًا مدفونًا في الطين شتاءً؟", options: ["يتبادل الغازات عبر الجلد الرطب", "يتنفس عبر تجويف الفم فقط", "يستخدم الخياشيم", "يتنفس بالرئتين فقط"], answer: 0, explanation: "أثناء السكون الشتوي يمكن للضفدع تبادل الغازات عبر جلده الرطب، مع انخفاض نشاطه." },
  { id: "6ad0103163cd9c24f9f40d35", page: 51, number: 11, subcategory: amphibians, text: "ما الصفة المشتركة بين السيسيليا والسلمندر والضفدع بوصفها برمائيات؟", options: ["وجود أطراف في الأنواع كلها", "قلب يتكون من ثلاث حجرات", "التغذية النباتية", "تنفس اليرقات بالرئتين"], answer: 1, explanation: "للقلب في البرمائيات أذينان وبطين واحد؛ وتختلف الأنواع في وجود الأطراف وطريقة تنفس اليرقات." },
] as const;
const rejections = [
  { id: "6ad0103063cd9c24f9f40d19", page: 49, number: 2, note: "حُجب السؤال: لا يوجد ضمن الخيارات جواب صحيح عن وظيفة الخياشيم، وهي تبادل الغازات/التنفس؛ الخيارات المعروضة لا تتضمن ذلك." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const reviewed = [...approvals, ...rejections];
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: reviewed.map((item) => item.id) }, sourceId: SOURCE_ID })
    .select("_id questionId sourceKey sourceId sourceOrdinal sourcePage sourceBlockIndex sourceBook topic difficulty status")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== reviewed.length) failures.push(`expected ${reviewed.length} source rows, found ${drafts.length}`);
  for (const item of approvals) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey || !["pending_review", "approved"].includes(draft.status)) failures.push(`q${item.number}: source/page/status mismatch`);
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.options.some((option) => !option.trim()) || item.answer < 0 || item.answer > 3) failures.push(`q${item.number}: invalid cleaned options/key`);
    const published = draft?.sourceKey ? await TahsiliQuestion.findOne({ sourceKey: draft.sourceKey }).select("text correctOptionIndex").lean() as any : null;
    if (draft?.status === "approved" && (!published || published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number}: approved draft does not match its published record`);
    if (published && (published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number}: published record conflicts with this review`);
  }
  for (const item of rejections) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !["pending_review", "rejected"].includes(draft.status)) failures.push(`q${item.number}: rejection source/page/status mismatch`);
    if (draft?.sourceKey && await TahsiliQuestion.exists({ sourceKey: draft.sourceKey })) failures.push(`q${item.number}: rejected item unexpectedly exists in published bank`);
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
      subject, subcategory: item.subcategory, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate", topic: item.subcategory, explanation: item.explanation,
      sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
      ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
      sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
    }, $setOnInsert: { createdAt: reviewedAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } }, { $set: {
      status: "approved", subject, subcategory: item.subcategory, text: item.text, options: [...item.options], explanation: item.explanation,
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة السؤال وخياراته ومفتاحه مع المصدر والمعلومة العلمية، وتعديل الصياغة لتكون مستقلة عن الشكل عند الحاجة.", updatedAt: reviewedAt,
    } });
  }
  for (const item of rejections) {
    const draft = byId.get(item.id)!;
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "rejected"] } }, { $set: {
      status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: item.note, updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
