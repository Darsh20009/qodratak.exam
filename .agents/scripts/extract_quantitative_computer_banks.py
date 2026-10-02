from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import fitz
from PIL import Image


ROOT = Path(".")
ATTACHED = ROOT / "attached_assets"
PUBLIC = ROOT / "artifacts/qodratak/public/foundation/quantitative/computer-banks"
OUTPUT = ROOT / ".agents/outputs/quantitative-computer-banks"
PUBLIC.mkdir(parents=True, exist_ok=True)
OUTPUT.mkdir(parents=True, exist_ok=True)

VIDEO_FILES = sorted(
    ATTACHED.glob("FILE_1448*.mp4"),
    key=lambda path: int(re.search(r"_(\d{13})\.mp4$", path.name).group(1)),
)
PDF_BY_NUMBER = {
    int(re.search(r"اختبار_(\d+)", path.name).group(1)): path
    for path in ATTACHED.glob("اختبار_*_محلول_*.pdf")
}
ARABIC_OPTIONS = {"أ": 0, "ا": 0, "إ": 0, "آ": 0, "ب": 1, "ج": 2, "د": 3}
WATERMARK_RE = re.compile(r"^\s*(?:521299|7065620710|\d[\d\s]{5,})\s*$")


def normalize(value: str) -> str:
    return unicodedata.normalize("NFKC", value or "").replace("\u200f", " ").replace("\u200e", " ")


def clean_ocr(value: str) -> str:
    lines = []
    for raw_line in normalize(value).splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()
        if not line or WATERMARK_RE.fullmatch(line):
            continue
        if "جميع المحتويات المنشورة محفوظة" in line:
            continue
        if line.startswith("سؤال") and len(line) < 30:
            continue
        if len(re.sub(r"[\d\s.,:؛،()\[\]{}<>+*/=|\\-]", "", line)) < 2 and len(line) < 12:
            continue
        lines.append(line)
    return " ".join(lines).strip()


def run_ocr(image_path: Path) -> str:
    # The original question image is kept at full resolution. OCR is much
    # faster on a temporary 1000px copy and the image itself remains lossless
    # enough for students to zoom in on the source artwork.
    temporary_path = Path("/tmp") / f"quantitative-ocr-{image_path.stem}-{image_path.parent.name}.jpg"
    with Image.open(image_path) as image:
        if image.width > 1000:
            resized = image.resize((1000, round(image.height * 1000 / image.width)))
        else:
            resized = image.copy()
        resized.save(temporary_path, quality=88)
    result = subprocess.run(
        ["tesseract", str(temporary_path), "stdout", "-l", "ara+eng", "--psm", "6"],
        check=True,
        capture_output=True,
        text=True,
        env={**os.environ, "OMP_THREAD_LIMIT": "1"},
    )
    temporary_path.unlink(missing_ok=True)
    return clean_ocr(result.stdout)


def question_image_xref(page: fitz.Page) -> int:
    candidates = []
    for image in page.get_images(full=True):
        xref = image[0]
        for rect in page.get_image_rects(xref):
            if rect.width > 300 and rect.height > 100 and rect.y0 > 100 and rect.y1 < 700:
                candidates.append((rect.width * rect.height, xref))
    if not candidates:
        raise RuntimeError("Could not locate the question image on a PDF page")
    return max(candidates)[1]


def answer_from_page(page: fitz.Page) -> tuple[int | None, str | None]:
    text = normalize(page.get_text("text"))
    match = re.search(r"الإجابة الصحيحة\s*[:：]?\s*([^\s\n|]+)", text)
    if not match:
        return None, None
    token = match.group(1).strip()
    return ARABIC_OPTIONS.get(token), token


def classify(text: str) -> str:
    lowered = text.replace("٪", "%")
    if any(word in lowered for word in ("القيمة الأولى", "القيمة الثانية", "قارن", "المعطيات غير كافية")):
        return "المقارنات"
    if any(word in lowered for word in ("مثلث", "مربع", "دائرة", "مستطيل", "محيط", "مساحة", "زاوية", "شكل هندسي", "حجم")):
        return "الهندسة"
    if any(word in lowered for word in ("المتوسط", "الوسيط", "المنوال", "المدى", "احتمال", "بيانات", "جدول")):
        return "الإحصاء والاحتمالات"
    if any(word in lowered for word in ("%", "٪", "النسبة المئوية", "خصم", "ربح", "خسارة", "زيادة بنسبة")):
        return "النسبة المئوية"
    if any(word in lowered for word in ("نسبة", "تناسب", "معدل", "سرعة", "جزء من")):
        return "النسبة والتناسب"
    if any(word in lowered for word in ("س", "ص", "معادلة", "حل", "مجهول")):
        return "الجبر والمعادلات"
    return "العمليات الحسابية"


def copy_video(video_number: int, source: Path) -> dict:
    target = PUBLIC / f"computer-bank-{video_number:02d}.mp4"
    shutil.copyfile(source, target)
    probe = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(source),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    duration_minutes = max(1, round(float(probe.stdout.strip()) / 60))
    return {
        "source": source.name,
        "url": f"/foundation/quantitative/computer-banks/computer-bank-{video_number:02d}.mp4",
        "bytes": target.stat().st_size,
        "durationMinutes": duration_minutes,
    }


def main() -> None:
    banks = []
    for video_number, video_path in enumerate(VIDEO_FILES, start=1):
        video = copy_video(video_number, video_path)
        pdf_path = PDF_BY_NUMBER.get(video_number)
        questions = []
        attachment = None
        if pdf_path:
            pdf_target = PUBLIC / f"exam-{video_number:02d}.pdf"
            shutil.copyfile(pdf_path, pdf_target)
            attachment = {
                "id": f"qudrat-quantitative-computer-bank-{video_number:02d}",
                "type": "pdf",
                "title": f"اختبار بنك الكمي المحوسب {video_number} — النسخة المحلولة",
                "url": f"/foundation/quantitative/computer-banks/exam-{video_number:02d}.pdf",
                "originalName": pdf_path.name,
                "contentType": "application/pdf",
                "bytes": pdf_target.stat().st_size,
            }
            document = fitz.open(pdf_path)
            pending_questions = []
            for question_number in range(1, min(48, len(document) - 1) + 1):
                page = document[question_number]
                xref = question_image_xref(page)
                image_data = document.extract_image(xref)
                image_target = PUBLIC / f"exam-{video_number:02d}" / f"question-{question_number:03d}.{image_data['ext']}"
                image_target.parent.mkdir(parents=True, exist_ok=True)
                image_target.write_bytes(image_data["image"])
                correct_index, answer_token = answer_from_page(page)
                pending_questions.append({
                    "questionNumber": question_number,
                    "imagePath": image_target,
                    "imageExt": image_data["ext"],
                    "correctIndex": correct_index,
                    "answerToken": answer_token,
                })
            with ThreadPoolExecutor(max_workers=6) as executor:
                ocr_texts = list(executor.map(run_ocr, [item["imagePath"] for item in pending_questions]))
            for item, raw_text in zip(pending_questions, ocr_texts):
                question_number = item["questionNumber"]
                text = raw_text if len(raw_text) >= 8 else (
                    f"السؤال {question_number} من بنك الكمي المحوسب {video_number}. "
                    "النص الأصلي والخيارات محفوظة في الصورة المرفقة."
                )
                image_url = f"/foundation/quantitative/computer-banks/exam-{video_number:02d}/question-{question_number:03d}.{item['imageExt']}"
                questions.append({
                    "examNumber": video_number,
                    "questionNumber": question_number,
                    "text": text,
                    "options": ["أ", "ب", "ج", "د"],
                    "correctOptionIndex": item["correctIndex"] if item["correctIndex"] is not None else 0,
                    "answerToken": item["answerToken"],
                    "answerStatus": "approved" if item["correctIndex"] is not None else "review",
                    "subcategory": classify(text),
                    "imageUrl": image_url,
                    "imageUrls": [image_url],
                    "sourcePdf": pdf_path.name,
                })
            document.close()
        banks.append({
            "number": video_number,
            "video": video,
            "pdf": pdf_path.name if pdf_path else None,
            "attachment": attachment,
            "questions": questions,
        })

    output = OUTPUT / "computer-banks.json"
    output.write_text(json.dumps({"banks": banks}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "videos": len(banks),
        "pdfs": sum(1 for bank in banks if bank["pdf"]),
        "questions": sum(len(bank["questions"]) for bank in banks),
        "reviewQuestions": sum(
            1 for bank in banks for question in bank["questions"]
            if question["answerStatus"] != "approved"
        ),
        "output": str(output),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()