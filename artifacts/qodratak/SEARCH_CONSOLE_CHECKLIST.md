# فهرسة منصة قدراتك بعد النشر

هذه الخطوات تُنفّذ بعد نشر النسخة الحالية وربط النطاق الرسمي `https://qodratak.sa`.

## 1. فحص النطاق والملفات العامة

- افتح `https://qodratak.sa/` وتأكد أن الصفحة تعمل دون تحويل إلى نطاق آخر.
- افتح `https://qodratak.sa/robots.txt`.
- افتح `https://qodratak.sa/sitemap.xml`.
- افتح `https://qodratak.sa/qodratak-app-icon.png`.
- افحص صفحات `/faq` و`/pricing` و`/platform-guide` بعد إعادة تحميل كل رابط مباشرة.

## 2. إضافة النطاق في Google Search Console

1. أضف خاصية من نوع **Domain** باسم `qodratak.sa`.
2. انسخ سجل التحقق `TXT` الذي تعرضه Google.
3. أضف السجل في إعدادات DNS للنطاق، ثم انتظر انتشاره.
4. ارجع إلى Search Console واضغط **Verify**.

يتطلب التحقق وصول مالك النطاق إلى DNS؛ لا يمكن إكماله من داخل التطبيق وحده.

## 3. إرسال خريطة الموقع

1. افتح قسم **Sitemaps**.
2. أرسل `https://qodratak.sa/sitemap.xml`.
3. تأكد أن الحالة **Success** وأن الخريطة لا تعرض صفحات تسجيل الدخول أو الإدارة أو لوحة الطالب.

## 4. طلب الفهرسة

استخدم **URL Inspection** بهذا الترتيب:

1. `https://qodratak.sa/`
2. `https://qodratak.sa/faq`
3. `https://qodratak.sa/platform-guide`
4. `https://qodratak.sa/qiyas-hub`
5. `https://qodratak.sa/learn`

لكل رابط، شغّل **Test live URL** أولًا ثم **Request indexing** إذا نجح الاختبار.

## 5. المراجعة بعد الإرسال

- راقب تقارير **Pages** و**Enhancements** خلال الأيام التالية.
- صحح فقط الأخطاء المؤكدة؛ حالات مثل **Discovered – currently not indexed** قد تحتاج وقتًا ومحتوى وروابط خارجية.
- أعد إرسال الخريطة عند إضافة صفحات عامة جديدة.
- لا تطلب فهرسة صفحات الحساب أو الاختبارات الخاصة؛ هذه الصفحات مهيأة بـ`noindex`.

الفهرسة والترتيب ليسا فوريين ولا يمكن ضمانهما؛ القرار النهائي لمحرك البحث بعد الزحف وتقييم المحتوى.