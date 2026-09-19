# تجربة الكتاب الرقمي التعليمي — Phase 12

هذه الوثيقة تصف حدود تجربة المحتوى التعليمي التي أضيفت في Phase 12 فقط.

## Content contract

يُعرض المحتوى المنشور عبر:

`GET /api/learning/content/:contentId`

العقد العام هو `LearningContentDocument`:

- `id`
- `programId`
- `subjectId` عند توفره
- `taxonomyNodeId` عند توفر mapping معتمد
- `title`
- `description`
- `estimatedMinutes`
- `sections`
- `status`
- `version`
- `publishedAt`
- `videoUrl` و`thumbnailUrl` عند توفرهما
- `linkedQuizRoute` عند توفره
- `hasPractice`

المحتوى القديم الذي لا يملك sections لا يُعاد بناؤه من نص مخترع. يُمثّل الوصف الحالي فقط بقسم `INTRO` اسمه `overview` حتى يبقى قابلاً للقراءة والتتبع.

## Section model

كل section مستقل وله `id` و`type`. الأنواع المدعومة:

`INTRO`, `CONCEPT`, `RULE`, `EXAMPLE`, `NOTE`, `WARNING`, `SUMMARY`, `PRACTICE`

ويمكن لـ `EXAMPLE` حمل `problem`, `thinking`, `solution`, و`why`، لكن لا تُملأ هذه الحقول إذا لم تكن موجودة في المصدر.

## Progress model

يحفظ `LearningContentProgress` سجلًا واحدًا فريدًا لكل زوج:

`studentId + contentId`

ويدعم:

- `contentVersion`
- `currentSectionId`
- `progress`
- `state`
- `startedAt`
- `lastReadAt`
- `completedAt`
- `practiceCompletedAt`

الحالات:

`NOT_STARTED` → `READING` → `COMPLETED` → `PRACTICE_COMPLETED`

تحديث التقدم idempotent: لا ينشئ سجلًا ثانيًا، ولا يسمح بتخفيض نسبة القراءة، ولا يقبل قسمًا غير موجود في المحتوى.

## Completion semantics

- `COMPLETED` يعني أن الطالب سجّل إتمام القراءة.
- `PRACTICE_COMPLETED` يعني أن القراءة مكتملة وأن تدريب المحتوى أُجيب عنه.
- إتمام المحتوى لا يساوي mastery.
- قراءة المحتوى لا تسجل `LearningAttempt` ولا تعدّل mastery.
- `complete` هو المسار الوحيد الذي يسجل إتمام القراءة على الخادم؛ قيمة `state` المرسلة من المتصفح لا تمنح الإتمام.

## Resume behavior

`GET /api/learning/content/:contentId/progress` يعيد `currentSectionId` المحفوظ. القارئ يضع الطالب على ذلك القسم، وتحديثات القراءة تحفظ القسم والنسبة في الخادم.

## Practice integration

يعرض القارئ سؤالًا من:

`GET /api/learning/content/:contentId/practice`

ويحفظ السؤال المعلّق داخل progress حتى لا يختار العميل السؤال النهائي. الاختيار يتم عبر Question Selection Engine وبنطاق البرنامج والمادة وtaxonomy المعتمدة فقط. لا يتكرر السؤال السابق تلقائيًا؛ retry الصريح موجود في engine ولا يُفتح لهذا التدفق ضمنيًا.

تُرسل الإجابة إلى:

`POST /api/learning/content/:contentId/practice/answer`

وتُتحقق server-side عبر `recordVerifiedLearningAttempt`. الاستجابة تعرض `isCorrect` وشرحًا عامًا وتصحيحًا وخطوة تالية عند توفرها، ولا تعرض `correctOptionIndex` أو مفتاح الإجابة.

## Security

كل هذه المسارات تتطلب جلسة طالب:

- `GET /api/learning/content/:contentId`
- `GET /api/learning/content/:contentId/progress`
- `POST /api/learning/content/:contentId/progress`
- `POST /api/learning/content/:contentId/complete`
- `GET /api/learning/content/:contentId/practice`
- `POST /api/learning/content/:contentId/practice/answer`

الهوية تؤخذ من session عبر `studentOnly`. لا يُقرأ `studentId` من body أو query. المحتوى يجب أن يكون منشورًا، والبرنامج وsubject وtaxonomy العميقة يجب أن تكون approved؛ وإلا يعاد `CONTENT_UNAVAILABLE` دون fallback إلى مادة أخرى.

## Frontend

المسار `/foundation/content/:contentId` يقدم قارئ RTL هادئًا للموبايل وiPad، مع:

- عنوان ووصف وزمن تقديري
- فهرس sections
- استئناف من آخر section
- progress قراءة بسيط
- blocks للأمثلة عند توفر تفاصيلها
- فصل واضح بين إتمام القراءة وإتمام التدريب
- practice entry وتغذية راجعة بعد الإجابة

لا توجد في هذه التجربة annotations أو drawing canvas أو handwriting recognition أو chat أو أي نص موجّه للطالب يذكر AI.

## Limitations

- لا تُنشأ sections تعليمية من تلقاء نفسها؛ البيانات الحالية قد تعرض INTRO فقط.
- لا يوجد نظام adaptive learning كامل أو spaced repetition.
- اختيار سؤال التدريب يتم من بنك الأسئلة المعتمد المتاح؛ إذا لم يوجد سؤال صالح يعاد `PRACTICE_UNAVAILABLE`.
- الفيديو يبقى مصدرًا خارجيًا عند وجود `videoUrl`; لا يتم نسخ أو تحليل محتواه.
- اختبارات التأسيس القديمة داخل `FoundationPage` لم تعد تُصحح client-side؛ التدريب المرتبط يبدأ من قارئ المحتوى الجديد.

هذه التغييرات محصورة في Phase 12 ولم تبدأ Phase 13.