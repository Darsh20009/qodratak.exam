import fs from 'fs';
import path from 'path';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const CHAT_MODEL = 'openai/gpt-4o-mini';
const ANALYSIS_MODEL = 'openai/gpt-4o-mini';

// Check API key on startup
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  [AI Service] OPENAI_API_KEY غير مضبوط — خدمات الذكاء الاصطناعي معطّلة');
} else {
  console.log('✅ [AI Service] OPENAI_API_KEY مضبوط — الذكاء الاصطناعي جاهز (OpenRouter)');
}

const SYSTEM_PROMPT = `أنت "مساعد قدراتك" — مساعد ذكي متخصص في اختبار القدرات العامة (قياس) السعودي.

مهامك:
1. شرح الأسئلة وتوضيح لماذا الإجابة صحيحة أو خاطئة
2. تحليل أداء الطالب وتحديد نقاط الضعف
3. تقديم نصائح وإستراتيجيات لرفع الدرجة
4. الإجابة على أسئلة الطالب حول القياس
5. إنشاء خطط دراسية مخصصة

قواعد التواصل:
- تحدث بالعربية الفصحى المبسطة دائماً
- كن واضحاً ومحدداً وعملياً
- استخدم الأمثلة والتشبيهات لتوضيح المفاهيم
- شجع الطالب وكن إيجابياً
- لا تتحدث إلا عن ما يخص القياس والتعليم

مواضيع القياس التي تتقنها:
- القسم اللفظي: القياس اللغوي، التناظر اللفظي، إكمال الجمل، الفهم المقروء
- القسم الكمي: الأعداد، الجبر، الهندسة، الإحصاء، المنطق الرياضي
- استراتيجيات حل الاختبار وإدارة الوقت`;

export async function aiChat(messages: { role: 'user' | 'assistant'; content: string }[], systemContext?: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.';

  const systemMessage = systemContext
    ? `${SYSTEM_PROMPT}\n\nمعلومات إضافية عن الطالب:\n${systemContext}`
    : SYSTEM_PROMPT;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://qodratak.sa',
        'X-Title': 'Qodratak AI Assistant',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [{ role: 'system', content: systemMessage }, ...messages],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const data = await response.json() as any;
    return data?.choices?.[0]?.message?.content ?? 'عذراً، لم أتمكن من الإجابة الآن.';
  } catch (err) {
    console.error('[AI Service] chat error:', err);
    return 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.';
  }
}

// Helper: convert a local image URL (/uploads/...) to base64 data URI
function imageUrlToBase64(imageUrl: string): string | null {
  try {
    const localPath = path.resolve(process.cwd(), imageUrl.replace(/^\//, ''));
    if (!fs.existsSync(localPath)) return null;
    const buffer = fs.readFileSync(localPath);
    const ext = path.extname(localPath).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function explainQuestion(params: {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  studentOptionIndex: number | null;
  category: string;
  explanation?: string;
  imageUrl?: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return 'خدمة الشرح غير متاحة حالياً.';

  const { questionText, options, correctOptionIndex, studentOptionIndex, category, explanation, imageUrl } = params;
  const correctOption = options[correctOptionIndex] ?? '';
  const studentOption = studentOptionIndex !== null ? (options[studentOptionIndex] ?? 'لم يُجب') : 'لم يُجب';
  const isCorrect = studentOptionIndex === correctOptionIndex;

  const prompt = `السؤال: ${questionText}${imageUrl ? '\n[ملاحظة: السؤال يحتوي على صورة مرفقة - راجعها عند الشرح]' : ''}

الخيارات:
${options.map((o, i) => `${['أ', 'ب', 'ج', 'د'][i] || i + 1}) ${o}`).join('\n')}

الإجابة الصحيحة: ${correctOption}
إجابة الطالب: ${studentOption}
${isCorrect ? '✅ الطالب أجاب بشكل صحيح.' : '❌ الطالب أجاب بشكل خاطئ.'}
${explanation ? `\nالشرح المتوفر: ${explanation}` : ''}

اشرح للطالب:
1. لماذا "${correctOption}" هي الإجابة الصحيحة؟
2. ${!isCorrect ? `لماذا "${studentOption}" خاطئة؟` : 'ما الذي يجعل هذا السؤال مميزاً؟'}
3. نصيحة لتجنب الخطأ في أسئلة مماثلة

كن موجزاً ومباشراً (3-4 جمل لكل نقطة).`;

  // Build user message content — use vision if image is available
  let userContent: any = prompt;
  if (imageUrl) {
    const base64 = imageUrlToBase64(imageUrl);
    if (base64) {
      userContent = [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: base64 } },
      ];
    }
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://qodratak.sa',
        'X-Title': 'Qodratak Question Explainer',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        temperature: 0.5,
        max_tokens: 800,
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const data = await response.json() as any;
    return data?.choices?.[0]?.message?.content ?? 'تعذّر الشرح في الوقت الحالي.';
  } catch (err) {
    console.error('[AI Service] explainQuestion error:', err);
    return 'تعذّر الشرح في الوقت الحالي. يرجى المحاولة لاحقاً.';
  }
}

export async function analyzePerformance(stats: {
  totalTests: number;
  avgScore: number;
  verbalAvg: number;
  quantAvg: number;
  weakSubcategories: { name: string; accuracy: number }[];
  strongSubcategories: { name: string; accuracy: number }[];
  recentTrend: 'improving' | 'declining' | 'stable';
  streakDays: number;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return 'تحليل الأداء غير متاح حالياً.';

  const prompt = `بيانات أداء الطالب:
- إجمالي الاختبارات: ${stats.totalTests}
- متوسط الدرجة: ${stats.avgScore}%
- القسم اللفظي: ${stats.verbalAvg}%
- القسم الكمي: ${stats.quantAvg}%
- الاتجاه: ${stats.recentTrend === 'improving' ? 'تحسّن 📈' : stats.recentTrend === 'declining' ? 'انخفاض 📉' : 'مستقر ➡️'}
- أيام الإنجاز المتواصل: ${stats.streakDays}
- أضعف المواضيع: ${stats.weakSubcategories.map(s => `${s.name} (${s.accuracy}%)`).join(', ')}
- أقوى المواضيع: ${stats.strongSubcategories.map(s => `${s.name} (${s.accuracy}%)`).join(', ')}

قدّم تحليلاً شاملاً يتضمن:
1. **تقييم عام**: نقاط قوة الطالب وما يتميز فيه
2. **نقاط التحسين**: ما يحتاج للعمل عليه بشكل عاجل
3. **خطة أسبوعية**: 3 إجراءات محددة يجب فعلها هذا الأسبوع
4. **توقع الدرجة**: إذا استمر الطالب بهذا النهج، ما توقع درجته؟
5. **رسالة تحفيزية**: جملة تحفيزية شخصية

استخدم ✅❌⚡🎯🔥 لتنسيق الإجابة.`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://qodratak.sa',
        'X-Title': 'Qodratak Performance Analyzer',
      },
      body: JSON.stringify({
        model: ANALYSIS_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const data = await response.json() as any;
    return data?.choices?.[0]?.message?.content ?? 'تعذّر التحليل في الوقت الحالي.';
  } catch (err) {
    console.error('[AI Service] analyzePerformance error:', err);
    return 'تعذّر تحليل الأداء في الوقت الحالي. يرجى المحاولة لاحقاً.';
  }
}

export async function explainMistakes(params: {
  wrongQuestions: {
    questionText: string;
    options: string[];
    studentAnswerIndex: number | null;
    correctAnswerIndex: number;
    category?: string;
    subcategory?: string;
    imageUrl?: string;
  }[];
  totalQuestions: number;
  score: number;
}): Promise<{ questionIndex: number; explanation: string; tip: string; conceptError: string }[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  const { wrongQuestions, totalQuestions, score } = params;
  if (wrongQuestions.length === 0) return [];

  const scorePct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const level = scorePct >= 70 ? 'متقدم' : scorePct >= 50 ? 'متوسط' : 'مبتدئ';

  const questionsData = wrongQuestions.map((q, i) => ({
    index: i,
    text: q.questionText,
    options: q.options,
    studentAnswer: q.studentAnswerIndex !== null ? (q.options[q.studentAnswerIndex] ?? 'لم يُجب') : 'لم يُجب',
    correctAnswer: q.options[q.correctAnswerIndex] ?? '',
    subcategory: q.subcategory || q.category || 'عام',
    hasImage: !!q.imageUrl,
  }));

  const prompt = `الطالب مستواه ${level} (${scorePct}%). أجاب بشكل خاطئ على الأسئلة التالية في اختبار القياس:

${JSON.stringify(questionsData, null, 2)}

${questionsData.some(q => q.hasImage) ? 'ملاحظة: بعض الأسئلة تحتوي على صور مرفقة — راعها عند الشرح.\n' : ''}
لكل سؤال، قدّم:
1. "explanation": شرح سهل وواضح لماذا الإجابة الصحيحة صحيحة (2-3 جمل مناسبة لمستوى الطالب ${level})
2. "tip": نصيحة عملية محددة لتجنب نفس الخطأ في المستقبل (جملة واحدة)
3. "conceptError": اسم المفهوم أو المهارة التي أخطأ فيها الطالب (2-4 كلمات)

أجب بـ JSON array فقط:
[{"questionIndex":0,"explanation":"...","tip":"...","conceptError":"..."},...]`;

  // Build user message content — include images via vision if any question has one
  const hasImages = wrongQuestions.some(q => q.imageUrl);
  let userContent: any = prompt;
  if (hasImages) {
    const contentParts: any[] = [{ type: 'text', text: prompt }];
    wrongQuestions.forEach((q, i) => {
      if (q.imageUrl) {
        const base64 = imageUrlToBase64(q.imageUrl);
        if (base64) {
          contentParts.push({ type: 'text', text: `[صورة السؤال رقم ${i}:]` });
          contentParts.push({ type: 'image_url', image_url: { url: base64 } });
        }
      }
    });
    if (contentParts.length > 1) userContent = contentParts;
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://qodratak.sa',
        'X-Title': 'Qodratak Mistake Explainer',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        temperature: 0.4,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const data = await response.json() as any;
    const content = data?.choices?.[0]?.message?.content ?? '';

    let parsed: any;
    try {
      const trimmed = content.trim();
      const cleanedJson = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      if (cleanedJson.startsWith('[')) {
        parsed = JSON.parse(cleanedJson);
      } else {
        const match = cleanedJson.match(/\[[\s\S]*\]/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          const obj = JSON.parse(cleanedJson);
          const arrVal = obj.explanations || obj.questions || obj.results || obj.mistakes || obj.data;
          if (Array.isArray(arrVal)) {
            parsed = arrVal;
          } else {
            const firstVal = Object.values(obj)[0];
            parsed = Array.isArray(firstVal) ? firstVal : [obj];
          }
        }
      }
    } catch {
      console.error('[AI explainMistakes] Failed to parse:', content.slice(0, 300));
      return [];
    }

    if (!Array.isArray(parsed)) return [];
    return parsed.map((r: any) => ({
      questionIndex: Number(r.questionIndex ?? r.index ?? 0),
      explanation: String(r.explanation || ''),
      tip: String(r.tip || ''),
      conceptError: String(r.conceptError || ''),
    }));
  } catch (err) {
    console.error('[AI explainMistakes] error:', err);
    return [];
  }
}

export async function generateTeacherPlan(params: {
  examType: 'qudrat' | 'tahsili';
  totalQuestions: number;
  correctCount: number;
  wrongQuestions: Array<{
    questionText: string;
    category: string;
    subcategory?: string;
    timeTaken: number; // seconds
    options: string[];
    correctOptionIndex: number;
    studentOptionIndex: number | null;
  }>;
  slowQuestions: Array<{
    questionText: string;
    category: string;
    subcategory?: string;
    timeTaken: number;
  }>;
  categoryBreakdown: Array<{ name: string; correct: number; total: number }>;
}): Promise<{
  overallGrade: string;
  scorePercent: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  roadmap: Array<{ week: number; title: string; tasks: string[]; priority: 'high' | 'medium' | 'low' }>;
  timingTips: string[];
  encouragement: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;

  const fallback = {
    overallGrade: params.correctCount / params.totalQuestions >= 0.8 ? 'ممتاز' : params.correctCount / params.totalQuestions >= 0.6 ? 'جيد' : 'يحتاج مراجعة',
    scorePercent: Math.round(params.correctCount / params.totalQuestions * 100),
    summary: 'بناءً على إجاباتك في هذا الاختبار التشخيصي، تم إعداد مسار تعليمي مخصص لك.',
    strengths: params.categoryBreakdown.filter(c => c.correct / c.total >= 0.7).map(c => c.name).slice(0, 3),
    weaknesses: params.categoryBreakdown.filter(c => c.correct / c.total < 0.5).map(c => c.name).slice(0, 3),
    roadmap: [
      { week: 1, title: 'مراجعة الأساسيات', tasks: ['راجع القواعد الأساسية', 'حل 30 سؤال يومياً', 'راجع أخطاءك'], priority: 'high' as const },
      { week: 2, title: 'التركيز على نقاط الضعف', tasks: ['حل أسئلة من بنك الأسئلة', 'اعمل على المواضيع الضعيفة', 'اختبار قسم واحد'], priority: 'high' as const },
      { week: 3, title: 'رفع المستوى', tasks: ['اختبارات كاملة', 'راجع الاستراتيجيات', 'تحسين سرعة الحل'], priority: 'medium' as const },
      { week: 4, title: 'المراجعة النهائية', tasks: ['محاكاة اختبار كامل', 'مراجعة الملاحظات', 'الراحة قبل الاختبار'], priority: 'medium' as const },
    ],
    timingTips: ['ابدأ بالأسئلة السهلة أولاً', 'لا تقضي أكثر من دقيقة في سؤال واحد', 'استخدم التخمين المدروس عند الحاجة'],
    encouragement: 'أنت على الطريق الصحيح! مع الممارسة المنتظمة ستحقق نتائج رائعة.',
  };

  if (!apiKey) return fallback;

  const wrongList = params.wrongQuestions.map(q =>
    `- "${q.questionText.slice(0, 60)}..." (${q.category}/${q.subcategory || ''}) — استغرق ${q.timeTaken}ث`
  ).join('\n');
  const slowList = params.slowQuestions.map(q =>
    `- "${q.questionText.slice(0, 60)}..." — ${q.timeTaken}ث`
  ).join('\n');
  const catList = params.categoryBreakdown.map(c =>
    `${c.name}: ${c.correct}/${c.total} (${Math.round(c.correct/c.total*100)}%)`
  ).join(', ');

  const prompt = `أنت معلم خبير في ${params.examType === 'qudrat' ? 'اختبار القدرات العامة قياس' : 'الاختبار التحصيلي'}. حلّل أداء الطالب وأنشئ مساراً تعليمياً.

نتائج الاختبار التشخيصي:
- الدرجة: ${params.correctCount}/${params.totalQuestions} (${Math.round(params.correctCount/params.totalQuestions*100)}%)
- الأداء حسب القسم: ${catList}

الأسئلة الخاطئة:
${wrongList || 'لا يوجد'}

الأسئلة التي استغرقت وقتاً طويلاً:
${slowList || 'لا يوجد'}

أنشئ خطة تعليمية شاملة بصيغة JSON فقط (بدون أي نص خارج الـ JSON):
{
  "overallGrade": "ممتاز|جيد جداً|جيد|مقبول|يحتاج مراجعة",
  "scorePercent": number,
  "summary": "جملتان ملخص موجز للأداء",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2", "نقطة ضعف 3"],
  "roadmap": [
    { "week": 1, "title": "عنوان الأسبوع", "tasks": ["مهمة 1", "مهمة 2", "مهمة 3"], "priority": "high|medium|low" },
    { "week": 2, "title": "عنوان الأسبوع", "tasks": ["مهمة 1", "مهمة 2", "مهمة 3"], "priority": "high|medium|low" },
    { "week": 3, "title": "عنوان الأسبوع", "tasks": ["مهمة 1", "مهمة 2", "مهمة 3"], "priority": "medium|low" },
    { "week": 4, "title": "عنوان الأسبوع", "tasks": ["مهمة 1", "مهمة 2", "مهمة 3"], "priority": "low" }
  ],
  "timingTips": ["نصيحة وقت 1", "نصيحة وقت 2", "نصيحة وقت 3"],
  "encouragement": "جملة تحفيزية شخصية قصيرة"
}`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://qodratak.sa',
        'X-Title': 'Qodratak Teacher System',
      },
      body: JSON.stringify({
        model: ANALYSIS_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const data = await response.json() as any;
    let raw = data?.choices?.[0]?.message?.content ?? '';

    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // Extract JSON object
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[Teacher Plan] No JSON object found in response, using fallback');
      return fallback;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.warn('[Teacher Plan] JSON parse failed, using fallback:', parseErr);
      return fallback;
    }

    // Validate required fields
    if (!parsed.overallGrade || !parsed.roadmap || !Array.isArray(parsed.roadmap)) {
      return { ...fallback, ...parsed };
    }

    return {
      overallGrade: parsed.overallGrade ?? fallback.overallGrade,
      scorePercent: typeof parsed.scorePercent === 'number' ? parsed.scorePercent : fallback.scorePercent,
      summary: parsed.summary ?? fallback.summary,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : fallback.strengths,
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 5) : fallback.weaknesses,
      roadmap: parsed.roadmap.slice(0, 4).map((w: any, i: number) => ({
        week: w.week ?? i + 1,
        title: w.title ?? `الأسبوع ${i + 1}`,
        tasks: Array.isArray(w.tasks) ? w.tasks : [],
        priority: ['high', 'medium', 'low'].includes(w.priority) ? w.priority : 'medium',
      })),
      timingTips: Array.isArray(parsed.timingTips) ? parsed.timingTips : fallback.timingTips,
      encouragement: parsed.encouragement ?? fallback.encouragement,
    };
  } catch (err) {
    console.error('[Teacher Plan] error:', err);
    return fallback;
  }
}

export async function generateStudyPlan(params: {
  weakAreas: string[];
  daysUntilExam: number;
  dailyHours: number;
  currentLevel: number;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return 'خطة الدراسة غير متاحة حالياً.';

  const prompt = `أنشئ خطة دراسة مخصصة لاختبار القياس:
- نقاط الضعف: ${params.weakAreas.join(', ')}
- الأيام المتبقية: ${params.daysUntilExam}
- ساعات الدراسة اليومية: ${params.dailyHours}
- المستوى الحالي: ${params.currentLevel}%

الخطة يجب أن تشمل:
1. جدول أسبوعي واضح (الأحد إلى الخميس)
2. المواضيع المخصصة لكل يوم بالوقت التقريبي
3. عدد الأسئلة المقترحة يومياً
4. نصيحة خاصة لكل منطقة ضعف
5. أسلوب مراجعة نهاية الأسبوع

استخدم جداول وقوائم لسهولة القراءة.`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://qodratak.sa',
        'X-Title': 'Qodratak Study Planner',
      },
      body: JSON.stringify({
        model: ANALYSIS_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const data = await response.json() as any;
    return data?.choices?.[0]?.message?.content ?? 'تعذّر إنشاء الخطة الدراسية.';
  } catch (err) {
    console.error('[AI Service] generateStudyPlan error:', err);
    return 'تعذّر إنشاء الخطة الدراسية في الوقت الحالي.';
  }
}
