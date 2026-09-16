# Phase 06 — Error Detection & Error Taxonomy

هذه المرحلة تجمع **أدلة قابلة للتتبع عن المحاولة**، ولا تحوّل محاولة واحدة
إلى حكم ثابت على الطالب. `LearningAttempt` يجيب عن سؤال: ماذا حدث؟
و`LearningErrorEvidence` يجيب عن سؤال: ما الأدلة المتاحة حول سبب محتمل؟

## Taxonomy المعتمدة

القائمة محدودة ومضبوطة:

`CONCEPT_GAP`, `CALCULATION_ERROR`, `READING_ERROR`, `MISUNDERSTANDING`,
`WRONG_STRATEGY`, `RUSHED`, `GUESS`, `CONFUSED_OPTIONS`,
`FAILED_TO_IDENTIFY_RELATION`, `MEMORY_GAP`, `PARTIAL_UNDERSTANDING`,
`TIME_PRESSURE`, `UNKNOWN`.

`UNKNOWN` هي القيمة الصحيحة عندما لا توجد أدلة كافية. لا يتم إنشاء `Skill` أو
`SubSkill` أو `Concept` من `category` أو `subcategory` القديمة.

## نموذج evidence

يحفظ `LearningErrorEvidence`:

- `studentId`
- `attemptId` المرتبط بـ `LearningAttempt`
- `questionId`, `sourceType`, `sourceKey`, و`sourceIdentity`
- `programId` و`subjectId` إن وُجدا
- `errorType` و`confidence`
- قائمة evidence signals
- `inferenceRule`
- observed attempt data: حالة الإجابة، correctness، الزمن، والإجابة المختارة
- metadata السؤال الموثوقة فقط عند توفرها
- `detectedAt` و`idempotencyKey`

كل سجل مستقل ويمكن أن تظهر سجلات متعددة عبر محاولات مختلفة. لا يوجد تجميع
Mastery ولا حكم دائم على الطالب.

## Observed مقابل Inferred

### Observed

أمثلة على observed evidence:

- المحاولة كانت صحيحة أو خاطئة.
- الطالب أجاب أو ترك السؤال.
- `responseTime`.
- الإجابة المختارة.
- `category`, `subcategory`, `difficulty`, `topic`, ووجود شرح إذا كانت من
  سجل السؤال الخادمي.
- self-report صريح من القائمة المسموحة.

### Inferred

`errorType`, `confidence`, و`inferenceRule` هي inference خادمية قابلة
للمراجعة. لا يرسل العميل `correctness` أو `errorType` أو `confidence` النهائي.

## Detection rules

1. إجابة خاطئة وحدها تنتج `UNKNOWN` بثقة `LOW`.
2. زمن إجابة بين 1 و3 ثوانٍ مع إجابة خاطئة يضيف إشارة زمنية ويستنتج
   `RUSHED` بثقة `LOW` فقط.
3. self-report صريح يحدد الفئة المقابلة على الخادم، بثقة `HIGH` للدليل
   المصرح به، وليس لمستوى الطالب.
4. المحاولة الصحيحة أو غير المجابة لا تنشئ auto-error judgment.
5. metadata السؤال دليل سياقي فقط، ولا تتحول تلقائيًا إلى مفهوم أو فجوة.
6. لا يتم استخدام LLM أو خدمة خارجية في هذه المرحلة.

## Self-report

الـ API يقبل فقط:

- `did_not_understand_concept`
- `calculation_mistake`
- `did_not_understand_question`
- `rushed`
- `did_not_know_where_to_start`
- `guessing`
- `confused_options`
- `not_sure`

لا توجد واجهة إجبارية أو modal بعد كل سؤال في هذه المرحلة. يمكن لواجهة لاحقة
إرسال self-report عند توفر سياق مناسب.

## العلاقة مع ErrorLog

`ErrorLog` بقي كما هو للتوافق مع التدفقات القديمة وتحليلها الحالي. لم يتم
حذف السجلات التاريخية أو إعادة تصنيفها أو تحويلها إلى `LearningErrorEvidence`.

العلاقة المقصودة:

```text
LearningAttempt       -> ماذا حدث؟
LearningErrorEvidence -> ما الدليل على سبب محتمل؟
ErrorLog              -> legacy/compatibility record
```

مسار `ErrorLog` القديم لا يُستخدم كمصدر حقيقة للمحاولات الموثوقة الجديدة.

## APIs

### تسجيل self-report

`POST /api/learning/error-evidence`

يحتاج جلسة طالب، ويقبل:

```json
{
  "attemptId": "...",
  "selfReport": "guessing",
  "idempotencyKey": "optional-client-key"
}
```

الطالب يملك المحاولة فقط إذا كان `attemptId` تابعًا لجلسة الطالب. يعاد السجل
السابق عند تكرار نفس المفتاح، ويرفض المفتاح إذا استُخدم لدليل مختلف.

### قراءة الأدلة

`GET /api/learning/error-evidence?limit=30`

أو للبحث في محاولة محددة:

`GET /api/learning/error-evidence?attemptId=<attemptId>`

المساران محميان بجلسة الطالب ويعيدان أدلة الطالب نفسه فقط.

## Data safety and scope lock

- لا تعديل للبيانات التاريخية.
- لا bulk classification.
- لا Mastery Engine أو Recommendations أو Diagnostic Engine جديد.
- لا Adaptive Learning أو Spaced Repetition أو AI Tutor.
- لا تظهر كلمات AI أو badges أو chatbot للمستخدم.