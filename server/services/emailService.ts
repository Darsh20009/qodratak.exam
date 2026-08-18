const SMTP2GO_API_KEY = process.env.SMTP2GO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@qodratak.site';
const FROM_NAME = process.env.FROM_NAME || 'منصة قدراتك';

async function sendEmail(to: string | string[], subject: string, htmlBody: string, textBody: string): Promise<boolean> {
  try {
    if (!SMTP2GO_API_KEY) {
      console.error('❌ SMTP2GO_API_KEY is not configured');
      return false;
    }
    const toList = Array.isArray(to) ? to : [to];
    const res = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: SMTP2GO_API_KEY,
        sender: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: toList,
        subject,
        html_body: htmlBody,
        text_body: textBody,
      }),
    });
    const data: any = await res.json();
    if (data?.data?.succeeded > 0) {
      console.log(`✅ Email sent to ${toList.join(', ')} | id: ${data?.data?.email_id}`);
      return true;
    }
    console.error('❌ SMTP2Go send failed:', JSON.stringify(data));
    return false;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

// ─── Shared layout helpers ───────────────────────────────────────────────────

function emailBase(accentColor: string, content: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f7;padding:48px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e8e8;">

        <!-- brand bar -->
        <tr>
          <td style="background:${accentColor};height:4px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- logo row -->
        <tr>
          <td style="padding:28px 36px 20px;border-bottom:1px solid #f0f0f0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <span style="font-size:20px;font-weight:900;color:${accentColor};font-family:'Segoe UI',Arial,sans-serif;letter-spacing:-0.5px;">قدراتك</span>
                  <span style="color:#999;font-size:13px;margin-right:6px;">· Qodratak</span>
                </td>
                <td align="left">
                  <span style="color:#bbb;font-size:11px;">qodratak.site</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- content -->
        <tr>
          <td style="padding:32px 36px;">
            ${content}
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #f0f0f0;background:#fafafa;">
            <p style="margin:0;color:#aaa;font-size:11px;text-align:center;line-height:1.8;">
              © 2025 منصة قدراتك &nbsp;·&nbsp; qodratak.site<br>
              هذا البريد أُرسل تلقائياً، يُرجى عدم الرد عليه.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function otpBox(code: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td align="center" style="background:#f9f9fb;border:1px solid #e8e8e8;border-radius:10px;padding:28px;">
        <p style="margin:0 0 8px;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:2px;">رمز التحقق</p>
        <p style="margin:0;font-size:44px;font-weight:900;color:#1a1a2e;letter-spacing:14px;font-family:monospace;">${code}</p>
        <p style="margin:12px 0 0;color:#bbb;font-size:12px;">صالح لمدة 10 دقائق</p>
      </td>
    </tr>
  </table>`;
}

function ctaButton(href: string, label: string, color: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
    <tr>
      <td align="center">
        <a href="${href}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">${label}</a>
      </td>
    </tr>
  </table>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f3f3f3;color:#888;font-size:13px;white-space:nowrap;padding-left:16px;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f3f3f3;color:#1a1a2e;font-size:14px;font-weight:600;">${value}</td>
  </tr>`;
}

function infoTable(rows: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#fafafa;border:1px solid #efefef;border-radius:8px;padding:4px 16px;">
    ${rows}
  </table>`;
}

function alertBox(text: string, color: string, bg: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td style="background:${bg};border-right:3px solid ${color};border-radius:6px;padding:14px 16px;">
        <p style="margin:0;color:${color};font-size:13px;line-height:1.7;">${text}</p>
      </td>
    </tr>
  </table>`;
}

function scoreWidget(score: number, label: string, color: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
    <tr>
      <td align="center" style="border:1px solid #e8e8e8;border-radius:10px;padding:32px 20px;">
        <p style="margin:0 0 4px;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;">النسبة الإجمالية</p>
        <p style="margin:0;font-size:64px;font-weight:900;color:${color};line-height:1;font-family:'Segoe UI',Arial,sans-serif;">${score.toFixed(1)}<span style="font-size:28px;color:#ccc;">%</span></p>
        <p style="margin:12px 0 0;display:inline-block;background:${color};color:#fff;padding:4px 18px;border-radius:100px;font-size:13px;font-weight:700;">${label}</p>
      </td>
    </tr>
  </table>`;
}

// ─── OTP Email ────────────────────────────────────────────────────────────────

export async function sendOTPEmail(email: string, fullName: string, otp: string): Promise<boolean> {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a2e;font-weight:800;">رمز التحقق</h2>
    <p style="margin:0 0 4px;color:#555;font-size:15px;line-height:1.8;">
      مرحباً <strong>${fullName || 'عزيزنا الطالب'}</strong>،
    </p>
    <p style="margin:0;color:#888;font-size:14px;line-height:1.8;">
      استخدم الرمز أدناه لإتمام تسجيلك في منصة قدراتك.
    </p>
    ${otpBox(otp)}
    ${alertBox('لا تشارك هذا الرمز مع أي شخص. فريق قدراتك لن يطلبه منك أبداً.', '#92400e', '#fffbeb')}
    <p style="margin:16px 0 0;color:#bbb;font-size:13px;">إذا لم تقم بإنشاء هذا الحساب، تجاهل هذا البريد.</p>
  `;

  return sendEmail(
    email,
    `${otp} — رمز التحقق من منصة قدراتك`,
    emailBase('#4f46e5', body),
    `رمز التحقق الخاص بك: ${otp}\nصالح لمدة 10 دقائق فقط.`
  );
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, fullName: string): Promise<boolean> {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a2e;font-weight:800;">أهلاً وسهلاً! 🎉</h2>
    <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.8;">
      مرحباً <strong>${fullName || 'الطالب المتميز'}</strong>،<br>
      انضممت رسمياً إلى منصة قدراتك. حسابك مفعّل وجاهز.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td width="31%" style="padding:0 4px 0 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background:#f9f9fb;border:1px solid #efefef;border-radius:8px;padding:16px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:900;color:#4f46e5;">4,500+</p>
              <p style="margin:4px 0 0;color:#999;font-size:11px;">سؤال في البنك</p>
            </td></tr>
          </table>
        </td>
        <td width="31%" style="padding:0 4px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background:#f9f9fb;border:1px solid #efefef;border-radius:8px;padding:16px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:900;color:#059669;">30</p>
              <p style="margin:4px 0 0;color:#999;font-size:11px;">نموذج ورقي</p>
            </td></tr>
          </table>
        </td>
        <td width="31%" style="padding:0 0 0 4px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background:#f9f9fb;border:1px solid #efefef;border-radius:8px;padding:16px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:900;color:#d97706;">7</p>
              <p style="margin:4px 0 0;color:#999;font-size:11px;">أيام مجانية</p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton('https://qodratak.site', 'ابدأ رحلتك الآن ←', '#4f46e5')}
  `;

  return sendEmail(
    email,
    'أهلاً بك في منصة قدراتك',
    emailBase('#4f46e5', body),
    `أهلاً ${fullName}! يسعدنا انضمامك لمنصة قدراتك. تم تفعيل حسابك وحصلت على 7 أيام مجانية.`
  );
}

// ─── Subscription Approval ────────────────────────────────────────────────────

export async function sendSubscriptionApprovalEmail(email: string, fullName: string, planName: string, endDate: Date): Promise<boolean> {
  const formattedDate = endDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a2e;font-weight:800;">تم تفعيل اشتراكك</h2>
    <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.8;">
      مرحباً <strong>${fullName}</strong>،<br>
      اشتراكك في خطة <strong>${planName}</strong> مفعّل ويمكنك الآن الاستمتاع بجميع المميزات.
    </p>
    ${infoTable(
      infoRow('الخطة', planName) +
      infoRow('تاريخ انتهاء الاشتراك', formattedDate)
    )}
    ${ctaButton('https://qodratak.site', 'الذهاب إلى المنصة ←', '#059669')}
  `;

  return sendEmail(
    email,
    `تم تفعيل اشتراكك في منصة قدراتك`,
    emailBase('#059669', body),
    `مرحباً ${fullName}، تم تفعيل اشتراكك في خطة ${planName} حتى ${formattedDate}.`
  );
}

// ─── Exam Results ─────────────────────────────────────────────────────────────

export async function sendExamResults(
  email: string,
  fullName: string,
  results: {
    bookingId: string;
    scheduledAt: string;
    totalScoreOutOf100: number;
    verbalPercent: number;
    quantPercent: number;
    correctAnswers: number;
    wrongAnswers: number;
    skippedAnswers: number;
    totalQuestions: number;
    cheatingFlag: boolean;
  }
): Promise<boolean> {
  const score = results.totalScoreOutOf100;
  const scoreColor = score >= 70 ? '#059669' : score >= 50 ? '#d97706' : '#dc2626';
  const scoreLabel = score >= 70 ? 'ممتاز' : score >= 50 ? 'جيد' : 'يحتاج تحسين';
  const firstName = (fullName || 'الطالب').split(' ')[0];

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#1a1a2e;font-weight:800;">نتيجة اختبار القدرات</h2>
    <p style="margin:0 0 24px;color:#888;font-size:13px;">${results.scheduledAt} · عزيزي الطالب ${firstName}</p>

    ${scoreWidget(score, scoreLabel, scoreColor)}

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td width="48%" style="padding-left:6px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;text-align:center;">
              <p style="margin:0 0 4px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;">القسم الكمي</p>
              <p style="margin:0;font-size:30px;font-weight:800;color:#4f46e5;">${results.quantPercent.toFixed(1)}<span style="font-size:14px;color:#bbb;">%</span></p>
            </td></tr>
          </table>
        </td>
        <td width="4%"></td>
        <td width="48%" style="padding-right:6px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;text-align:center;">
              <p style="margin:0 0 4px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;">القسم اللفظي</p>
              <p style="margin:0;font-size:30px;font-weight:800;color:#4f46e5;">${results.verbalPercent.toFixed(1)}<span style="font-size:14px;color:#bbb;">%</span></p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>

    ${infoTable(
      infoRow('إجابات صحيحة', `${results.correctAnswers}`) +
      infoRow('إجابات خاطئة', `${results.wrongAnswers}`) +
      infoRow('أسئلة متخطاة', `${results.skippedAnswers}`) +
      infoRow('إجمالي الأسئلة المحسوبة', `${results.totalQuestions}`)
    )}

    ${alertBox('الأسئلة التي أخطأت فيها محفوظة في مجلد الأخطاء بملفك الشخصي — راجعها لتحسين أدائك القادم.', '#92400e', '#fffbeb')}

    ${ctaButton('https://qodratak.site/folders', 'مراجعة أخطاء الاختبار ←', '#4f46e5')}
  `;

  return sendEmail(
    email,
    `نتيجتك في اختبار القدرات: ${score.toFixed(1)}%`,
    emailBase('#4f46e5', body),
    `عزيزي الطالب ${firstName}،\n\nنتيجتك: ${score.toFixed(1)}%\nالكمي: ${results.quantPercent.toFixed(1)}% | اللفظي: ${results.verbalPercent.toFixed(1)}%\n\nصحيح: ${results.correctAnswers} | خطأ: ${results.wrongAnswers} | متخطى: ${results.skippedAnswers}\n\nمنصة قدراتك | qodratak.site`
  );
}

// ─── Admin notification helpers ───────────────────────────────────────────────

const ADMIN_EMAIL = 'qoudratak@gmail.com';

export async function sendAdminNotificationEmail(subject: string, htmlBody: string, textBody: string): Promise<boolean> {
  return sendEmail(ADMIN_EMAIL, subject, htmlBody, textBody);
}

export async function notifyAdminNewSubscription(
  studentName: string,
  studentEmail: string,
  planName: string,
  paymentMethod: string,
  hasReceipt: boolean
): Promise<boolean> {
  const body = `
    <h2 style="margin:0 0 4px;font-size:20px;color:#1a1a2e;font-weight:800;">طلب اشتراك جديد</h2>
    <p style="margin:0 0 20px;color:#888;font-size:13px;">يحتاج هذا الطلب مراجعتك وتفعيله من لوحة التحكم.</p>
    ${infoTable(
      infoRow('الطالب', studentName) +
      infoRow('البريد', studentEmail) +
      infoRow('الخطة', planName) +
      infoRow('طريقة الدفع', paymentMethod) +
      infoRow('سند التحويل', hasReceipt ? 'مرفق ✓' : 'غير مرفق ✗')
    )}
    ${ctaButton('https://qodratak.site/admin', 'مراجعة الطلب في لوحة التحكم ←', '#d97706')}
  `;

  return sendAdminNotificationEmail(
    `طلب اشتراك جديد — ${studentName} (${planName})`,
    emailBase('#d97706', body),
    `طلب اشتراك جديد من ${studentName} (${studentEmail}) — الخطة: ${planName} — طريقة الدفع: ${paymentMethod} — سند التحويل: ${hasReceipt ? 'مرفق' : 'غير مرفق'}\n\nراجع الطلب: https://qodratak.site/admin`
  );
}

export async function notifyAdminReceiptUploaded(
  studentName: string,
  studentEmail: string,
  planName: string
): Promise<boolean> {
  const body = `
    <h2 style="margin:0 0 4px;font-size:20px;color:#1a1a2e;font-weight:800;">سند تحويل جديد</h2>
    <p style="margin:0 0 20px;color:#888;font-size:13px;">رفع طالب سند تحويل لاشتراكه — يحتاج مراجعة وتفعيل.</p>
    ${infoTable(
      infoRow('الطالب', studentName) +
      infoRow('البريد', studentEmail) +
      infoRow('الخطة', planName)
    )}
    ${ctaButton('https://qodratak.site/admin', 'مراجعة السند وتفعيل الاشتراك ←', '#059669')}
  `;

  return sendAdminNotificationEmail(
    `سند تحويل جديد — ${studentName} (${planName})`,
    emailBase('#059669', body),
    `رفع ${studentName} (${studentEmail}) سند تحويل للخطة ${planName}.\n\nراجع الطلب: https://qodratak.site/admin`
  );
}

export async function notifyAdminInstitutionRequest(
  institutionName: string,
  responsibleName: string,
  email: string,
  phone: string
): Promise<boolean> {
  const body = `
    <h2 style="margin:0 0 4px;font-size:20px;color:#1a1a2e;font-weight:800;">طلب انضمام مؤسسة</h2>
    <p style="margin:0 0 20px;color:#888;font-size:13px;">وصل طلب انضمام مؤسسة تعليمية جديدة للمنصة.</p>
    ${infoTable(
      infoRow('المؤسسة', institutionName) +
      infoRow('المسؤول', responsibleName) +
      infoRow('البريد', email) +
      infoRow('الهاتف', phone || 'غير محدد')
    )}
    ${ctaButton('https://qodratak.site/admin', 'مراجعة الطلب في لوحة التحكم ←', '#7c3aed')}
  `;

  return sendAdminNotificationEmail(
    `طلب مؤسسة جديدة — ${institutionName}`,
    emailBase('#7c3aed', body),
    `طلب مؤسسة جديد: ${institutionName}\nالمسؤول: ${responsibleName}\nالبريد: ${email}\nالهاتف: ${phone || 'غير محدد'}\n\nراجع الطلب: https://qodratak.site/admin`
  );
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, fullName: string, resetUrl: string): Promise<boolean> {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a2e;font-weight:800;">إعادة تعيين كلمة المرور</h2>
    <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.8;">
      مرحباً <strong>${fullName || 'عزيزنا الطالب'}</strong>،<br>
      تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك. اضغط الزر أدناه لإنشاء كلمة مرور جديدة.
    </p>

    ${ctaButton(resetUrl, 'إعادة تعيين كلمة المرور ←', '#4f46e5')}

    ${alertBox('هذا الرابط صالح لمدة ساعة واحدة فقط.', '#92400e', '#fffbeb')}
    ${alertBox('لم تطلب ذلك؟ تجاهل هذا البريد — لن يتغير شيء في حسابك.', '#1e40af', '#eff6ff')}

    <p style="margin:16px 0 0;color:#bbb;font-size:11px;word-break:break-all;">
      رابط مباشر: ${resetUrl}
    </p>
  `;

  return sendEmail(
    email,
    'إعادة تعيين كلمة المرور — منصة قدراتك',
    emailBase('#4f46e5', body),
    `مرحباً ${fullName}،\n\nرابط إعادة تعيين كلمة المرور (صالح ساعة واحدة):\n${resetUrl}\n\nإذا لم تطلب ذلك، تجاهل هذا البريد.`
  );
}

// ─── Test Email ───────────────────────────────────────────────────────────────

export async function sendTestEmail(to: string): Promise<boolean> {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a2e;font-weight:800;">نظام البريد يعمل بنجاح</h2>
    <p style="margin:0 0 16px;color:#888;font-size:14px;line-height:1.8;">
      تم استلام هذا البريد التجريبي من منصة قدراتك. نظام البريد الإلكتروني متصل عبر SMTP2Go.
    </p>
    ${infoTable(
      infoRow('المُرسِل', 'noreply@qodratak.site') +
      infoRow('الخدمة', 'SMTP2Go')
    )}
  `;

  return sendEmail(
    to,
    'بريد تجريبي من منصة قدراتك',
    emailBase('#4f46e5', body),
    'نظام البريد يعمل بنجاح! تم استلام هذا البريد التجريبي من منصة قدراتك.'
  );
}

export async function testEmailConnection(): Promise<boolean> {
  try {
    const res = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: SMTP2GO_API_KEY, sender: `test <${FROM_EMAIL}>`, to: ['test@example.com'], subject: 'ping', text_body: 'ping', dry_run: true }),
    });
    const data: any = await res.json();
    const ok = data?.data !== undefined;
    if (ok) console.log('✅ SMTP2Go API reachable');
    return ok;
  } catch (error) {
    console.error('❌ SMTP2Go API check failed:', error);
    return false;
  }
}

export async function sendCustomEmail(to: string, subject: string, htmlBody: string, textBody: string): Promise<boolean> {
  return sendEmail(to, subject, htmlBody, textBody);
}

// ─── Exam Booking Confirmation ────────────────────────────────────────────────

export async function sendExamBookingConfirmation(
  email: string,
  fullName: string,
  scheduledAt: Date,
  bookingId: string
): Promise<boolean> {
  const firstName = (fullName || 'الطالب').split(' ')[0];
  const dateStr = scheduledAt.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = scheduledAt.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true });

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#1a1a2e;font-weight:800;">تأكيد حجز الاختبار</h2>
    <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.8;">
      مرحباً <strong>${firstName}</strong>، تم تأكيد حجزك بنجاح. فيما يلي تفاصيل موعدك:
    </p>
    ${infoTable(
      infoRow('التاريخ', dateStr) +
      infoRow('الوقت', timeStr) +
      infoRow('رقم الحجز', bookingId.slice(-8).toUpperCase())
    )}
    ${alertBox('يُرجى الحضور قبل موعد الاختبار بـ 5 دقائق وتجهيز اتصال إنترنت مستقر. الاختبار يعمل في وضع الشاشة الكاملة.', '#92400e', '#fffbeb')}
    ${ctaButton('https://qodratak.site/book-exam', 'عرض تفاصيل الحجز ←', '#4f46e5')}
  `;

  return sendEmail(
    email,
    `تأكيد حجز اختبار القدرات — ${dateStr}`,
    emailBase('#4f46e5', body),
    `مرحباً ${firstName}،\n\nتم تأكيد حجزك لاختبار القدرات العامة.\n\nالتاريخ: ${dateStr}\nالوقت: ${timeStr}\nرقم الحجز: ${bookingId.slice(-8).toUpperCase()}\n\nمنصة قدراتك | qodratak.site`
  );
}

// ─── Exam Reminder ────────────────────────────────────────────────────────────

export async function sendExamReminderEmail(
  email: string,
  fullName: string,
  scheduledAt: Date
): Promise<boolean> {
  const firstName = (fullName || 'الطالب').split(' ')[0];
  const timeStr = scheduledAt.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true });

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#1a1a2e;font-weight:800;">اختبارك بعد 5 دقائق</h2>
    <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.8;">
      مرحباً <strong>${firstName}</strong>،<br>
      موعد اختبار القدرات الخاص بك <strong>اليوم الساعة ${timeStr}</strong> — أي بعد 5 دقائق تقريباً.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td align="center" style="border:1px solid #fed7aa;border-radius:8px;padding:24px;background:#fff7ed;">
          <p style="margin:0;font-size:52px;font-weight:900;color:#ea580c;line-height:1;">5</p>
          <p style="margin:4px 0 0;color:#c2410c;font-size:14px;font-weight:600;">دقائق متبقية</p>
        </td>
      </tr>
    </table>

    ${alertBox('تأكد من استقرار اتصالك بالإنترنت · أغلق التطبيقات الأخرى · الاختبار في وضع الشاشة الكاملة.', '#166534', '#f0fdf4')}
    ${ctaButton('https://qodratak.site/book-exam', 'ابدأ الاختبار الآن ←', '#ea580c')}
  `;

  return sendEmail(
    email,
    `تذكير: اختبار القدرات بعد 5 دقائق — الساعة ${timeStr}`,
    emailBase('#ea580c', body),
    `مرحباً ${firstName}،\n\nتذكير: موعد اختبار القدرات اليوم الساعة ${timeStr} — بعد 5 دقائق!\n\nابدأ من: https://qodratak.site/book-exam\n\nمنصة قدراتك | qodratak.site`
  );
}

// ─── Exam Start ───────────────────────────────────────────────────────────────

export async function sendExamStartEmail(
  email: string,
  fullName: string,
  scheduledAt: Date
): Promise<boolean> {
  const firstName = (fullName || 'الطالب').split(' ')[0];
  const dateStr = scheduledAt.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#1a1a2e;font-weight:800;">اختبارك بدأ الآن</h2>
    <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.8;">
      مرحباً <strong>${firstName}</strong>،<br>
      بدأ اختبار القدرات بتاريخ <strong>${dateStr}</strong>. نتمنى لك التوفيق والنجاح.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td align="center" style="border:1px solid #bbf7d0;border-radius:8px;padding:24px;background:#f0fdf4;">
          <p style="margin:0;color:#166534;font-size:16px;font-weight:700;">ثق بنفسك وأجب بهدوء وتركيز</p>
          <p style="margin:8px 0 0;color:#15803d;font-size:13px;">الاختبار مقسم إلى 5 أقسام · 26 دقيقة لكل قسم</p>
        </td>
      </tr>
    </table>

    ${alertBox('لا تغادر الصفحة أو تفتح نوافذ أخرى أثناء الاختبار. سيتم تسجيل أي مخالفة تلقائياً.', '#92400e', '#fffbeb')}
    <p style="margin:16px 0 0;color:#bbb;font-size:13px;text-align:center;">ستصلك النتيجة على هذا البريد فور انتهاء الاختبار.</p>
  `;

  return sendEmail(
    email,
    `اختبار القدرات بدأ الآن — ${dateStr}`,
    emailBase('#059669', body),
    `مرحباً ${firstName}،\n\nلقد بدأ اختبار القدرات. نتمنى لك التوفيق!\n\nالاختبار مقسم إلى 5 أقسام، 26 دقيقة لكل قسم. لا تغادر الصفحة أثناء الاختبار.\n\nمنصة قدراتك | qodratak.site`
  );
}

// ─── Invitation Email ─────────────────────────────────────────────────────────

export async function sendInvitationEmail(
  toEmail: string,
  inviterName: string,
  subscriptionType: string,
  inviteToken: string,
  baseUrl: string
): Promise<boolean> {
  const acceptLink = `${baseUrl}/invite/${inviteToken}`;
  const planLabel =
    subscriptionType === 'Pro Life Plus' ? 'Pro Life Plus (مدى الحياة)' :
    subscriptionType === 'Pro Life' ? 'Pro Life (مدى الحياة)' :
    subscriptionType === 'Pro' ? 'Pro' : subscriptionType;

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#1a1a2e;font-weight:800;">دعوة للانضمام</h2>
    <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.8;">
      قام <strong>${inviterName}</strong> بدعوتك للانضمام إلى <strong>منصة قدراتك</strong> للتحضير لاختبار القدرات.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td align="center" style="border:1px solid #d1fae5;border-radius:8px;padding:20px;background:#ecfdf5;">
          <p style="margin:0 0 4px;color:#888;font-size:12px;">ستحصل على اشتراك</p>
          <p style="margin:0;font-size:20px;font-weight:800;color:#059669;">${planLabel}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px;color:#888;font-size:13px;line-height:1.8;">
      أكثر من <strong>4500 سؤال</strong>، اختبارات محاكاة، وأدوات ذكية للتحضير المثالي.
    </p>

    ${ctaButton(acceptLink, 'قبول الدعوة وإنشاء حساب ←', '#059669')}

    <p style="margin:16px 0 0;color:#bbb;font-size:11px;word-break:break-all;">
      رابط مباشر: ${acceptLink}
    </p>
    <p style="margin:8px 0 0;color:#bbb;font-size:12px;text-align:center;">الرابط صالح لمدة 7 أيام</p>
  `;

  return sendEmail(
    toEmail,
    `${inviterName} يدعوك للانضمام إلى منصة قدراتك`,
    emailBase('#059669', body),
    `مرحباً!\n\nقام ${inviterName} بدعوتك للانضمام إلى منصة قدراتك.\nستحصل على اشتراك: ${planLabel}\n\nاضغط على الرابط لقبول الدعوة:\n${acceptLink}\n\nالرابط صالح لمدة 7 أيام.\n\nمنصة قدراتك | qodratak.site`
  );
}
