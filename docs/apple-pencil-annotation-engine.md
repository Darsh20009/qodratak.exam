# Phase 13 — Apple Pencil / Digital Annotation Engine

هذه المرحلة تضيف طبقة شخصية للـ Digital Textbook الحالي. القراءة هي السطح الأساسي،
والـ annotations طبقة إضافية مرتبطة بالمحتوى والقسم وإصدار المحتوى.

## Architecture

- `FoundationContent` يبقى مصدر الكتاب الأصلي.
- `LearningContentProgress` يبقى مصدر تقدم القراءة والتدريب.
- `LearningContentAnnotation` مجموعة مستقلة مملوكة للطالب.
- `FoundationReaderPage` يحمل annotations الخاصة بالطالب للمحتوى الحالي فقط.
- `FoundationAnnotationSurface` يربط input events والـ drawing overlay بكل قسم.

لا يتم تعديل محتوى الكتاب الأصلي ولا تضمين ملاحظات الطالب داخله.

## Annotation model

كل سجل يحتوي على:

- `studentId`
- `contentId`
- `contentVersion`
- `sectionId` عند ارتباطه بقسم
- `type`
- `data`
- `createdAt`
- `updatedAt`

الأنواع:

- `HIGHLIGHT`
- `UNDERLINE`
- `DRAWING`
- `NOTE`

### Data contracts

- التمييز والتسطير يحفظان `selectedText` و`anchor.start/end`.
- الملاحظة تحفظ `text` ويمكن أن تحمل النص المحدد وموضعه.
- الرسم يحفظ stroke واحدًا بعد اكتماله، بنقاط `x/y` normalized بين `0` و`1`،
  مع `pressure` اختياري، ولون وعرض خط.
- لا يتم حفظ HTML كامل للصفحة.

## Input handling

القارئ يحتوي على:

- `READ`: قراءة وتصفح طبيعي.
- `PEN`: رسم عند تفعيل الوضع صراحة.
- `HIGHLIGHT`: يحفظ النص المحدد.
- `UNDERLINE`: يحفظ النص المحدد كتسطير.
- `NOTE`: يفتح محرر ملاحظة شخصية.
- `ERASE`: حذف annotation المحددة.

يستخدم الرسم `pointerdown`, `pointermove`, `pointerup`, و`pointercancel`.

- `pen` يرسم عند تفعيل Pen Mode.
- `touch` يعمل كـ fallback عند تفعيل Pen Mode، ولا يرسم في Read Mode.
- `mouse` لا يبدأ الرسم تلقائيًا.

لا يعتمد اكتشاف نوع الإدخال على user-agent.

## Persistence

المسارات:

```text
GET    /api/learning/content/:contentId/annotations
POST   /api/learning/content/:contentId/annotations
PATCH  /api/learning/content/:contentId/annotations/:annotationId
DELETE /api/learning/content/:contentId/annotations/:annotationId
```

الرسم يمر بالمسار التالي:

```text
pointer events
→ local stroke
→ completed stroke
→ annotation واحدة
→ POST واحد
```

لا يوجد request لكل نقطة، ولا database write لكل pointer event.

إذا فشل الحفظ، تبقى annotation في الواجهة بحالة `failed` بدل فقدها فورًا.

## Undo / Redo

يحتفظ القارئ بتاريخ محلي لإنشاء annotations. التراجع يحذف السجل المقصود عبر
المسار المملوك للطالب، والإعادة تنشئه من payload الأصلي. لا يتم حذف البيانات
بشكل تلقائي أو بسبب scroll أو تغيير وضع القراءة.

## Section and scroll behavior

- الرسم داخل surface مرتبط بالقسم وليس viewport ثابتًا.
- نقاط الرسم normalized، لذلك يعاد إسقاطها بعد resize أو orientation change.
- النص المحدد يحفظ anchor قابلًا لإعادة البناء بدل تخزين Range أو HTML.
- إذا تغيرت بنية النص، لا يفترض النظام أن anchor القديم صحيحًا.

## Versioning

كل annotation تحمل `contentVersion`.

- القائمة تعرض annotations المطابقة للإصدار الحالي فقط.
- السجلات القديمة لا تحذف تلقائيًا.
- يعاد في response عدد `legacyCount` للسجلات القديمة غير المعروضة تلقائيًا.
- الإنشاء والتحديث على إصدار قديم يرفضان بـ `VERSION_MISMATCH`.
- حذف سجل تاريخي يبقى عملية صريحة ومملوكة للطالب.

## Security

- كل endpoints تتطلب جلسة مصادقًا عليها.
- `studentId` مشتق من session فقط.
- كل القراءة والتعديل والحذف يفلتر بـ `studentId + contentId`.
- المحتوى يمر بنفس تحقق النشر والـ approved taxonomy المستخدم في Phase 12.
- القسم يتحقق منه server-side.
- نوع annotation يتحقق منه server-side.
- نقاط الرسم محدودة إلى `1200`.
- الملاحظات محدودة إلى `2000` حرف.
- النص المحدد محدود إلى `600` حرف.
- payload البيانات محدود إلى `80KB`.
- الإحداثيات والضغط وعرض الخط تتحقق من الحدود.

## UX and accessibility

الـ toolbar صغيرة ولا تحتوي على chatbot أو عناصر غير مرتبطة بالقراءة.
هي في تدفق الصفحة وليست طبقة fixed تغطي النص.

الأزرار تحتوي على:

- `aria-label`
- `aria-pressed` للأداة النشطة
- focus states
- touch targets مناسبة
- نصوص واضحة بالعربية

الملاحظات خاصة بالطالب ولا تظهر في محتوى طالب آخر.

## Performance

- strokes تبقى local أثناء الحركة.
- لا يعاد حفظ كل pointer event.
- drawing overlay يستخدم normalized SVG paths.
- highlight وunderline يعاد إسقاطهما من anchor عند فتح المحتوى.
- ResizeObserver يعيد حساب طبقات النص عند تغير أبعاد القسم.

## Tests

اختبارات backend تغطي model contract، ownership/content scoping، الأنواع،
anchors، حدود الملاحظات، حدود النقاط، الإحداثيات، الإصدارات، والـ payload.

اختبارات frontend تتحقق من lifecycle الخاص بالـ pointer events، التمييز بين
pen/touch، عدم وجود request لكل pointer event، ظهور الأدوات، وربط hooks
الحقيقية بالـ API.

## Limitations

- لا يوجد handwriting recognition أو OCR.
- لا يوجد تفسير آلي للرسم أو تحويله إلى نص.
- النص المحدد يعتمد على anchors نصية؛ تغييرات كبيرة في نص القسم قد تجعل annotation
  القديمة `legacy` أو غير قابلة لإعادة الإسقاط بدقة، لذلك لا تعرض تلقائيًا عند
  اختلاف الإصدار.
- Eraser يحذف annotation كاملة، وليس تحرير أجزاء vector من stroke.
- لا يوجد مزامنة realtime بين جهازين؛ إعادة فتح القارئ أو refetch يعيد البيانات.

Phase 14 وSpaced Repetition وFull Adaptive Learning غير مشمولة في هذه المرحلة.