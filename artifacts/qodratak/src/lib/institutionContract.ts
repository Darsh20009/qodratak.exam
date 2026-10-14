import { documents } from "@/pages/FooterDocumentsPage";
import { BRAND_NAME, LEGAL_ENTITY_NAME, SUPPORT_EMAIL, SUPPORT_PHONE, UNIFIED_NATIONAL_NUMBER } from "@/constants/legalIdentity";
import { TYPE_LABEL, type InstitutionDTO } from "@/lib/institutionApi";

/** Serialize every published policy document (terms, privacy, refund) verbatim. */
export function serializePublishedPolicies(): string {
  const out: string[] = [];
  out.push("بيانات الهوية النظامية");
  out.push(`- الاسم النظامي: ${LEGAL_ENTITY_NAME}`);
  out.push(`- العلامة: ${BRAND_NAME}`);
  out.push(`- الرقم الوطني الموحد: ${UNIFIED_NATIONAL_NUMBER}`);
  out.push(`- الهاتف وواتساب: ${SUPPORT_PHONE}`);
  out.push(`- البريد: ${SUPPORT_EMAIL}`);
  (["terms", "privacy", "refund"] as const).forEach((key, i) => {
    const d = documents[key];
    out.push("");
    out.push(`== السياسة ${i + 1}: ${d.title} ==`);
    out.push(d.eyebrow);
    out.push(`تاريخ آخر تحديث: ${d.updated}`);
    out.push(d.intro);
    d.sections.forEach((s) => {
      out.push("");
      out.push(`## ${s.title}`);
      s.paragraphs?.forEach((p) => out.push(p));
      s.bullets?.forEach((b) => out.push(`- ${b}`));
    });
  });
  return out.join("\n");
}

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function fmt(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  return `${date.toLocaleString("ar-SA", { calendar: "gregory", timeZone: "Asia/Riyadh", dateStyle: "long", timeStyle: "short" })} (${date.toISOString()})`;
}

const PAGE_W = 794;
const PAGE_H = 1123;
const PAD_X = 64;
const PAD_TOP = 70;
const PAD_BOTTOM = 80;
const INK = "#171723";
const MUTED = "#5E5868";
const CORAL = "#C4553F";
const MINT = "#2E8B70";

export function blocksFor(inst: InstitutionDTO, assets: { signature?: string; stamp?: string } = {}): string[] {
  const c = inst.contract!;
  const partyName = c.issuerPlatformName || c.issuerLegalName;
  const b: string[] = [];
  const h = (t: string) => `<h2 style="font-size:17px;font-weight:800;color:${INK};margin:18px 0 8px;border-bottom:1px solid #E5DED3;padding-bottom:6px">${esc(t)}</h2>`;
  const p = (t: string) => `<p style="font-size:12.5px;line-height:2;color:${MUTED};margin:0 0 6px">${esc(t)}</p>`;
  const li = (t: string) => `<p style="font-size:12.5px;line-height:2;color:${MUTED};margin:0 0 4px;padding-right:16px;position:relative"><span style="position:absolute;right:0;top:11px;width:6px;height:6px;border-radius:9px;background:${CORAL}"></span>${esc(t)}</p>`;
  const row = (k: string, v: string, ltr = false) => `<tr><td style="padding:6px 10px;background:#F7F4EE;font-weight:700;color:${INK};width:34%;border:1px solid #E5DED3">${esc(k)}</td><td style="padding:6px 10px;border:1px solid #E5DED3;color:${MUTED};${ltr ? "direction:ltr;text-align:left;font-family:monospace;font-size:10.5px;word-break:break-all" : ""}">${esc(v)}</td></tr>`;

  b.push(`<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:3px solid ${INK};padding-bottom:16px">
    <div><p style="font-size:11px;font-weight:800;letter-spacing:.12em;color:${CORAL};margin:0">اتفاقية انضمام مؤسسة تعليمية</p>
    <h1 style="font-size:26px;font-weight:900;color:${INK};margin:6px 0 4px">عقد مساحة المؤسسة على منصة ${esc(BRAND_NAME)}</h1>
    <p style="font-size:12px;color:${MUTED};margin:0">صادر من ${esc(partyName)} — الرقم الوطني الموحد ${esc(c.issuerNationalNumber)}</p></div>
    <img src="/qodratak-logo.png" crossorigin="anonymous" style="height:86px;width:auto;object-fit:contain" />
  </div>`);
  b.push(h("بيانات الإصدار والتحقق"));
  b.push(`<table style="width:100%;border-collapse:collapse;font-size:12px">${[
    row("الرقم المرجعي", c.reference, true),
    row("بصمة المحتوى (SHA-256)", c.digest, true),
    row("المفوّض بالإصدار", c.issuerName),
    row("تاريخ ووقت الإصدار", fmt(c.issuedAt)),
    row("نوع الاعتماد", "اعتماد إلكتروني داخلي من حساب إدارة فعلي، وليس توقيعًا رقميًا معتمدًا أو شهادة PKI"),
  ].join("")}</table>`);
  b.push(h("الطرفان"));
  b.push(`<table style="width:100%;border-collapse:collapse;font-size:12px">${[
    row("الطرف الأول", `${partyName}، يمثلها ${c.issuerName}، ${c.issuerPlatformName ? `الكيان النظامي: ${c.issuerLegalName}، ` : ""}الرقم الوطني الموحد ${c.issuerNationalNumber}، ${SUPPORT_EMAIL}، ${SUPPORT_PHONE}`),
    row("الطرف الثاني", `${inst.name} — ${TYPE_LABEL[inst.type]}`),
    row("بريد المؤسسة", inst.email),
    row("جوال المؤسسة", inst.phone || "—"),
    row("المدينة والعنوان", [inst.city, inst.address].filter(Boolean).join("، ") || "—"),
  ].join("")}</table>`);
  b.push(h("الحصة المتفق عليها"));
  b.push(`<table style="width:100%;border-collapse:collapse;font-size:12px">${[
    row("الحد الأقصى للطلاب", String(inst.maxStudents)),
    row("الحد الأقصى للمعلمين", String(inst.maxTeachers)),
    row("مدير المؤسسة", "حساب واحد يصدر كوده من إدارة المنصة فقط"),
  ].join("")}</table>`);
  b.push(h("المزايا المؤسسية ومددها"));
  c.conditions.forEach((t) => b.push(li(t)));
  b.push(h("السياسات المعتمدة المدمجة في العقد (النص الكامل المخزن)"));
  c.policies.split("\n").forEach((line) => {
    const t = line.trim();
    if (!t) return;
    if (t.startsWith("== ")) b.push(`<h3 style="font-size:15px;font-weight:900;color:${MINT};margin:16px 0 6px">${esc(t.replace(/^==\s*|\s*==$/g, ""))}</h3>`);
    else if (t.startsWith("## ")) b.push(`<h4 style="font-size:13px;font-weight:800;color:${INK};margin:10px 0 4px">${esc(t.slice(3))}</h4>`);
    else if (t.startsWith("- ")) b.push(li(t.slice(2)));
    else b.push(p(t));
  });
  b.push(h("الاعتماد والتوقيع"));
  b.push(`<div style="display:flex;gap:16px;margin-top:6px">
    <div style="flex:1;border:1px solid #D8D0C4;border-radius:10px;padding:14px;font-size:12px;color:${MUTED};line-height:2">
      <p style="font-weight:800;color:${INK};margin:0 0 4px">الطرف الأول — ${esc(partyName)}</p>
      <p style="margin:0">اعتماد إلكتروني داخلي باسم المفوّض: <b style="color:${INK}">${esc(c.issuerName)}</b></p>
      ${assets.signature || assets.stamp ? `<div style="display:flex;align-items:center;gap:12px;margin:10px 0;background:white;padding:6px;border-radius:6px">
        ${assets.signature ? `<div style="flex:1;min-width:0;text-align:center"><img alt="توقيع ممثل المنصة" src="${esc(assets.signature)}" style="width:100%;height:65px;object-fit:contain"/><p style="font-size:10px;margin:0">التوقيع</p></div>` : ""}
        ${assets.stamp ? `<div style="width:96px;flex-shrink:0;text-align:center"><img alt="ختم منصة قدراتك التعليمية" src="${esc(assets.stamp)}" style="width:96px;height:96px;object-fit:contain"/><p style="font-size:10px;margin:0">ختم المنصة</p></div>` : ""}
      </div>` : ""}
      <p style="margin:0">بتاريخ: ${esc(fmt(c.issuedAt))}</p>
      <p style="margin:0;font-size:10px;direction:ltr;text-align:left;font-family:monospace;word-break:break-all">${esc(c.reference)}</p>
    </div>
    <div style="flex:1;border:1.5px dashed ${INK};border-radius:10px;padding:14px;font-size:12px;color:${MUTED};line-height:2.6">
      <p style="font-weight:800;color:${INK};margin:0">الطرف الثاني — ${esc(inst.name)}</p>
      <p style="margin:0">اسم المفوّض: ..............................................</p>
      <p style="margin:0">الصفة: ..............................................</p>
      <p style="margin:0">التوقيع: ..............................................</p>
      <p style="margin:0">الختم والتاريخ: ..............................................</p>
    </div>
  </div>
  <p style="font-size:10.5px;color:${MUTED};margin-top:12px;line-height:1.9">يُرفع هذا المستند بعد توقيعه إلى إدارة المنصة مع الرقم المرجعي نفسه، ولا تُفعّل المؤسسة قبل مراجعة النسخة الموقعة واعتمادها.</p>`);
  return b;
}

async function waitImages(root: HTMLElement) {
  await Promise.all(Array.from(root.querySelectorAll("img")).map(async (img) => {
    try { await img.decode(); }
    catch { throw new Error("تعذر تحميل إحدى صور العقد؛ لم يتم تنزيل نسخة ناقصة. أعد المحاولة."); }
  }));
  if ((document as any).fonts?.ready) await (document as any).fonts.ready;
}

/** Render the approved contract (with signature and stamp) and return the PDF as a Blob. */
export async function buildContractPdfBlob(inst: InstitutionDTO): Promise<Blob> {
  if (!inst.contract) throw new Error("لا يوجد عقد صادر لهذه المؤسسة");
  const assetUrls: string[] = [];
  const assets: { signature?: string; stamp?: string } = {};
  try {
    for (const kind of ["signature", "stamp"] as const) {
      if (!inst.contract[`${kind}AssetId`]) continue;
      const response = await fetch(`/api/admin/institutions/${encodeURIComponent(inst.id)}/contract-assets/${kind}`, { credentials: "include" });
      if (!response.ok) throw new Error("تعذر تحميل التوقيع أو الختم المعتمد؛ لم يتم إنشاء نسخة ناقصة.");
      const url = URL.createObjectURL(await response.blob());
      assetUrls.push(url); assets[kind] = url;
    }
  } catch (error) { assetUrls.forEach(URL.revokeObjectURL); throw error; }
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;z-index:-1;";
  document.body.appendChild(host);
  const base = `direction:rtl;font-family:'Tajawal','Cairo',system-ui,sans-serif;background:#FFFDF8;color:${INK};box-sizing:border-box;`;
  const contentW = PAGE_W - PAD_X * 2;
  const measure = document.createElement("div");
  measure.style.cssText = `${base}width:${contentW}px;`;
  host.appendChild(measure);
  try {
    const blocks = blocksFor(inst, assets);
    const els = blocks.map((html) => {
      const w = document.createElement("div");
      w.innerHTML = html;
      measure.appendChild(w);
      return w;
    });
    await waitImages(measure);
    const usable = PAGE_H - PAD_TOP - PAD_BOTTOM;
    const pages: HTMLElement[][] = [[]];
    let used = 0;
    els.forEach((el) => {
      const cs = getComputedStyle(el.firstElementChild || el);
      const hgt = el.getBoundingClientRect().height + parseFloat(cs.marginTop || "0") + parseFloat(cs.marginBottom || "0");
      const isHeading = /^H[234]$/.test(el.firstElementChild?.tagName || "");
      if (used + hgt > usable - (isHeading ? 60 : 0) && pages[pages.length - 1].length) { pages.push([]); used = 0; }
      pages[pages.length - 1].push(el);
      used += hgt;
    });
    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    for (let i = 0; i < pages.length; i++) {
      const page = document.createElement("div");
      page.style.cssText = `${base}width:${PAGE_W}px;height:${PAGE_H}px;padding:${PAD_TOP}px ${PAD_X}px ${PAD_BOTTOM}px;position:relative;overflow:hidden;`;
      const inner = document.createElement("div");
      pages[i].forEach((el) => inner.appendChild(el));
      page.appendChild(inner);
      const footer = document.createElement("div");
      footer.style.cssText = `position:absolute;bottom:28px;left:${PAD_X}px;right:${PAD_X}px;display:flex;justify-content:space-between;font-size:9.5px;color:${MUTED};border-top:1px solid #E5DED3;padding-top:8px;`;
      footer.innerHTML = `<span>${esc(inst.name)} — ${esc(inst.contract.issuerPlatformName || inst.contract.issuerLegalName)}</span><span style="direction:ltr;font-family:monospace">${esc(inst.contract.reference)} · ${i + 1}/${pages.length}</span>`;
      page.appendChild(footer);
      host.appendChild(page);
      await waitImages(page);
      const canvas = await html2canvas(page, { scale: 2, backgroundColor: "#FFFDF8", useCORS: true, logging: false });
      if (i > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pw, ph);
      page.remove();
    }
    pdf.setProperties({ title: `${inst.contract.reference}`, subject: `عقد مؤسسة ${inst.name}`, author: inst.contract.issuerPlatformName || inst.contract.issuerLegalName });
    return pdf.output("blob");
  } finally {
    host.remove();
    assetUrls.forEach(URL.revokeObjectURL);
  }
}

/** Normal download path: builds the same PDF and saves it locally. */
export async function generateContractPdf(inst: InstitutionDTO): Promise<Blob> {
  const blob = await buildContractPdfBlob(inst);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${inst.contract!.reference}.pdf`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return blob;
}
