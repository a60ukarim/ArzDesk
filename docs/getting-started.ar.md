# تشغيل ArzDesk v0.1.0

## المطلوب

- Node.js 24 وnpm.
- PostgreSQL، أو Docker لتشغيل قاعدة البيانات الجاهزة بالمشروع.
- محرر مثل VS Code.

## الخطوات على Windows

افتح مجلد المشروع في VS Code، ثم افتح Terminal:

```powershell
npm ci
Copy-Item .env.example .env
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

انسخ النص الناتج إلى ملف `.env` مكان قيمة `BETTER_AUTH_SECRET`. لا ترفع ملف `.env` على GitHub.

بعد تشغيل Docker Desktop:

```powershell
docker compose up -d db
npm run db:migrate
npm run dev
```

افتح http://localhost:3000، أنشئ حسابك ومؤسسة جديدة. بعدها أضف عميلاً، ثم مشروعاً لهذا العميل، ثم مهمة لهذا المشروع. الأرقام في لوحة التحكم تتغير حسب البيانات التي أضفتها.

إذا عندك PostgreSQL جاهز، عدّل `DATABASE_URL` في `.env` وشغّل migrations ثم التطبيق، بدون Docker.

## تجربة الفريق

من Team & settings اضغط Invite member، أدخل بريد الشخص ودوره، ثم انسخ رابط الدعوة وأرسله له بشكل خاص. يدخل بنفس البريد ويقبل الدعوة. الرابط صالح لسبعة أيام ولا يُرسل بالبريد تلقائياً.

- Owner: صلاحيات كاملة وتعديل أدوار الفريق.
- Admin: إدارة العمل والحذف ودعوة Member أو Viewer.
- Member: إضافة وتعديل العملاء والمشاريع والمهام.
- Viewer: مشاهدة فقط.

لإضافة بيانات تجريبية بعد إنشاء حسابك:

```powershell
npm run db:seed -- your-email@example.com
```

هذا ينشئ مؤسسة تجريبية مستقلة ولا يحذف شغلك.

## فحص الكود

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

لتجربة نسخة الإنتاج محلياً بعد نجاح البناء: `npm start`.

المشروع نسخة أولية فعلية. استعادة كلمة المرور، إرسال البريد، التعليقات، الملفات، وترجمة الواجهة للعربية ضمن المراحل القادمة.
