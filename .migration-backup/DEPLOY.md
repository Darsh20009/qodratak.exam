# نشر التطبيق على Render

## نظرة عامة

تم إصلاح مشكلة النشر على Render التي كانت تؤدي إلى خطأ `ERR_MODULE_NOT_FOUND` للحزمة `@vitejs/plugin-react`.

## المشكلة التي تم حلها

**الخطأ الأصلي:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@vitejs/plugin-react' imported from /app/dist/index.js
```

**السبب:**
- Server يستورد `vite.config` الذي يتطلب dev dependencies
- Docker كان يحذف هذه الحزم في بيئة الإنتاج باستخدام `npm prune --omit=dev`

## الحل المطبق

### 1. تحديث Dockerfile
```dockerfile
# إزالة خطوة حذف dev dependencies
# npm prune --omit=dev

# بدلاً من ذلك، الاحتفاظ بجميع الحزم المطلوبة للسيرفر
```

### 2. إنشاء render.yaml
```yaml
services:
  - type: web
    name: qodratak
    env: node
    plan: free
    buildCommand: npm run build
    startCommand: npm run start
    healthCheckPath: /
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
```

## خطوات النشر

1. **رفع الكود على GitHub**:
   ```bash
   git add .
   git commit -m "Fix Render deployment configuration"
   git push origin main
   ```

2. **ربط المستودع بـ Render**:
   - اذهب إلى [render.com](https://render.com)
   - اختر "New Web Service"
   - اربط مستودع GitHub الخاص بك

3. **إعدادات النشر**:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Environment**: Node
   - **Plan**: Free

## متغيرات البيئة المطلوبة

أضف هذه المتغيرات في إعدادات Render:

```
NODE_ENV=production
PORT=3000
ANTHROPIC_API_KEY=your_api_key_here
MAILJET_API_KEY=your_mailjet_key
MAILJET_SECRET_KEY=your_mailjet_secret
```

## استكشاف الأخطاء

### خطأ في الحزم المفقودة
إذا ظهر خطأ `module not found`:
1. تأكد من أن الحزمة موجودة في `dependencies` وليس `devDependencies`
2. أعد البناء في Render

### خطأ في البورت
إذا لم يعمل التطبيق:
1. تأكد من أن متغير `PORT=3000` مضبوط
2. تأكد من أن التطبيق يستمع على `0.0.0.0`

### مشاكل البيانات
- تأكد من وجود ملف `attached_assets/user.json`
- تأكد من وجود ملف `server/questions.json`

### مشكلة عدم تحميل الاختبارات التحصيلية (تم الحل)
**المشكلة:** رسالة "لم يتم العثور على أسئلة الاختبار المحدد" عند فتح اختبارات التحصيلي في الإنتاج

**السبب:** 
- الكود كان يستخدم `__dirname` للوصول إلى ملفات الأسئلة
- في الإنتاج، `__dirname` يشير إلى `dist/` بينما الملفات في `server/data/`

**الحل المطبق:**
```javascript
// قبل:
const filePath = path.join(__dirname, 'data', fileName);

// بعد:
const filePath = path.join(process.cwd(), 'server', 'data', fileName);
```

**التأكد:**
- تأكد من وجود مجلد `server/data/` في النشر
- يجب أن تحتوي على: `exam-50.json`, `exam-10.json`, `exam-100.json`, `exam-110.json`

## التحقق من نجاح النشر

بعد النشر، يجب أن ترى:
- ✅ البناء مكتمل بنجاح
- ✅ السيرفر يعمل على البورت 3000
- ✅ التطبيق يحمل الصفحة الرئيسية
- ✅ API endpoints تعمل بشكل صحيح

## دعم إضافي

إذا واجهت مشاكل أخرى:
1. تحقق من logs في Render Dashboard
2. تأكد من أن جميع الملفات المطلوبة موجودة
3. تأكد من صحة إعدادات متغيرات البيئة