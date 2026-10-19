#!/usr/bin/env python3
"""Extract question images and printed answer keys for quantitative bank 131."""

from __future__ import annotations

import json
import re
import unicodedata
from io import BytesIO
from pathlib import Path

import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PDF_PATH = ROOT / "attached_assets/اختبار_131_-_محلول_1792446916922.pdf"
IMAGE_ROOT = ROOT / "generated-artifacts/quantitative-bank-131/source-images/exam-131"
MANIFEST = ROOT / ".agents/outputs/quantitative-computer-banks/computer-banks-131.json"

KEY_TO_OPTION = {"أ": 0, "ا": 0, "إ": 0, "آ": 0, "ب": 1, "ج": 2, "د": 3}


def printed_key(text: str) -> str | None:
    normalized = unicodedata.normalize("NFKC", text or "")
    matches = re.findall(
        r"الإجابة\s*الصحيحة\s*[:：]\s*([أإآابجد])",
        normalized,
    )
    keys = list(dict.fromkeys(matches))
    return keys[0] if len(keys) == 1 else None


def extract_question_image(document: pymupdf.Document, page: pymupdf.Page) -> Image.Image:
    page_area = page.rect.width * page.rect.height
    candidates = []
    for image in page.get_image_info(xrefs=True):
        bbox = image.get("bbox")
        xref = int(image.get("xref") or 0)
        if not bbox or xref <= 0:
            continue
        x0, y0, x1, y1 = map(float, bbox)
        area = max(0, x1 - x0) * max(0, y1 - y0)
        if 0 < area < page_area * 0.90:
            candidates.append((area, xref))
    if not candidates:
        raise ValueError(f"Page {page.number + 1} has no separate question image.")
    _, xref = max(candidates)
    extracted = document.extract_image(xref)
    return Image.open(BytesIO(extracted["image"])).convert("RGB")


def main() -> None:
    if not PDF_PATH.is_file():
        raise FileNotFoundError(PDF_PATH)

    document = pymupdf.open(PDF_PATH)
    if len(document) != 56:
        raise ValueError(f"Expected one cover plus 55 question pages, found {len(document)} pages.")
    cover_text = unicodedata.normalize("NFKC", document[0].get_text("text"))
    if "عدد الأسئلة" not in cover_text or "٥٥" not in cover_text:
        raise ValueError("The cover does not clearly declare 55 questions.")

    IMAGE_ROOT.mkdir(parents=True, exist_ok=True)
    questions = []
    for question_number, page in enumerate(document[1:], start=1):
        key = printed_key(page.get_text("text"))
        if key is None:
            raise ValueError(f"Could not unambiguously read the printed key on question page {question_number}.")
        image = extract_question_image(document, page)
        name = f"question-{question_number:03d}"
        image.save(IMAGE_ROOT / f"{name}.jpeg", format="JPEG", quality=94, optimize=True)
        base_url = "/foundation/quantitative/computer-banks/exam-131"
        original_url = f"{base_url}/{name}.jpeg"
        cleaned_url = f"{base_url}/background-removed/{name}.png"
        questions.append({
            "examNumber": 131,
            "questionNumber": question_number,
            "text": f"السؤال المصوّر {question_number} من بنك الكمي المحوسب 131.",
            "options": ["أ", "ب", "ج", "د"],
            "correctOptionIndex": KEY_TO_OPTION[key],
            "answerToken": key,
            "answerStatus": "approved",
            "answerEvidence": "source_printed_answer_key",
            "subcategory": "بنوك محوسبة",
            "imageUrl": cleaned_url,
            "imageUrls": [cleaned_url],
            "imageOriginalUrl": original_url,
            "imageOriginalUrls": [original_url],
            "imageProcessing": {
                "status": "awaiting_visual_cleanup_review",
                "backgroundRemoved": False,
                "watermarkCleanupApplied": False,
                "note": "حُفظت الصورة المصدرية؛ لا تُفعّل الصورة المنظفة قبل مراجعة بقاء نص السؤال والرسوم.",
            },
            "sourcePdf": PDF_PATH.name,
        })

    document.close()
    if len(questions) != 55 or len({q["questionNumber"] for q in questions}) != 55:
        raise ValueError("Bank 131 question count or numbering is incomplete.")

    payload = {
        "schemaVersion": 1,
        "sourceRightsConfirmed": True,
        "answerKeysIndependentlyVerified": False,
        "videosPending": True,
        "banks": [{
            "number": 131,
            "scoringMode": "scored",
            "video": None,
            "pdf": None,
            "attachment": None,
            "rightsStatus": "user_confirmed_publish_and_edit",
            "questions": questions,
        }],
        "reviewHolds": [],
    }
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "bank": 131,
        "questions": len(questions),
        "printedKeys": len(questions),
        "independentlyVerified": False,
        "manifest": str(MANIFEST.relative_to(ROOT)),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
