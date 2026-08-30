# تطبيق قدراتك للطالب

تطبيق Flutter أصلي باللغة العربية لمنصة **قدراتك**، مخصص للطالب على iOS وAndroid.

## الوظائف الحالية

- تسجيل الدخول برقم الجوال ورمز OTP المرسل عبر واتساب.
- إنشاء حساب جديد بعد التحقق من الجوال.
- تسجيل الدخول الثانوي باسم المستخدم أو البريد وكلمة المرور.
- حفظ جلسة Express والكوكيز بأمان على الجهاز.
- لوحة طالب تعرض النقاط والمستوى ومتوسط النتائج.
- اختبارات قدرات لفظية وكمية من بنك الأسئلة الحالي.
- إرسال النتائج والنقاط إلى خادم قدراتك.
- صفحة النتائج والملف الشخصي والاشتراك.
- حد الجهازين مطبق من خادم API.

## التشغيل

يتطلب التطبيق Flutter 3.22 أو أحدث:

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=https://your-api.example.com
```

القيمة الافتراضية لـ `API_BASE_URL` هي `https://qodratak.sa`. يمكن تغييرها في
Codemagic أو بأمر البناء دون تعديل ملفات المصدر.

## Codemagic

يوجد ملفان متطابقان في الغرض:

- `../codemagic.yaml` عند ربط مستودع قدراتك الكامل.
- `codemagic.yaml` عند رفع مجلد `flutter_app` كمستودع مستقل.

### مسار الآيفون (المسار المطلوب)

ابدأ بـ workflow المسمى **Qodratak iOS TestFlight**. هذا المسار ينشئ ملف IPA
ويرفعه إلى TestFlight، ولا يحتاج إلى إعدادات Android.

قبل التشغيل:

1. سجّل Bundle ID التالي في Apple Developer وApp Store Connect:
   `studio.qirox.qodratak`.
2. أضف مجموعة Codemagic باسم `app_store_connect`، ثم اربطها بالـ workflow.
3. تأكد من أن `API_BASE_URL` يشير إلى عنوان API الإنتاجي الصحيح.

يستخدم المشروع iOS 13.0 كحد أدنى، ويشغّل CocoaPods تلقائياً أثناء البناء.

### إعداد Android (اختياري، وليس مطلوباً للآيفون)

إذا أردت لاحقاً نشر نسخة Android، أضف مجموعتي البيئة:

- `android_signing`: القيم `CM_KEYSTORE`, `CM_KEYSTORE_PASSWORD`,
  `CM_KEY_ALIAS`, `CM_KEY_PASSWORD`.
- `google_play`: القيمة `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`.

لـ TestFlight أضف مجموعة `app_store_connect` بالقيم التي ينشئها App Store
Connect. لا تضع أي شهادة أو كلمة مرور داخل Git أو ملفات المشروع.

## معرفات التطبيق

- Android: `studio.qirox.qodratak`
- iOS: `studio.qirox.qodratak`
- Deep link: `qodratak://app`

يمكن تغيير المعرفات قبل أول نشر فقط إذا كان حساب المتجر يستخدم معرفاً آخر.