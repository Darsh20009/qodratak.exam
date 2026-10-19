#!/usr/bin/env python3
"""Extract question-only images and printed answer keys from banks 111–130."""

from __future__ import annotations

import json
import re
import unicodedata
from io import BytesIO
from pathlib import Path

import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
INPUT_DIR = ROOT / "attached_assets"
IMAGE_ROOT = ROOT / "generated-artifacts/quantitative-banks-111-130/source-images"
MANIFEST = ROOT / ".agents/outputs/quantitative-computer-banks/computer-banks-111-130.json"

QUESTION_COUNTS = {
    **{number: 48 for number in range(111, 124)},
    124: 47,
    **{number: 55 for number in range(125, 131)},
}
VALID_KEYS = {"أ": 0, "ا": 0, "إ": 0, "آ": 0, "ب": 1, "ج": 2, "د": 3}
KEY_TO_OPTION = {"أ": "أ", "ا": "أ", "إ": "أ", "آ": "أ", "ب": "ب", "ج": "ج", "د": "د"}
VISUAL_REVIEW_HOLDS = {
    # This rendered question contains the English placeholder "Text" over its diagram.
    (111, 1): "عنصر نائب ظاهر داخل الرسم، لذلك لم يُدرج السؤال ضمن التدريب المصحح.",
}


def normalized_name(path: Path) -> str:
    return "".join(
        str(unicodedata.digit(char)) if char.isdigit() else char
        for char in unicodedata.normalize("NFKC", path.name)
        if unicodedata.category(char) != "Cf"
    )


def find_pdfs() -> dict[int, Path]:
    found: dict[int, Path] = {}
    for path in INPUT_DIR.glob("*.pdf"):
        name = normalized_name(path)
        match = re.search(
            r"(?:اختبار|البنك|بنك)[_\s-]*(?:(?:المنصف)[_\s-]*)?(\d{2,3})(?!\d)",
            name,
        )
        if not match:
            continue
        number = int(match.group(1))
        if number not in QUESTION_COUNTS or re.search(r"غير[_\s-]*محلول", name):
            continue
        if number in found:
            raise ValueError(f"More than one solved PDF matches bank {number}")
        found[number] = path
    expected = set(QUESTION_COUNTS)
    if set(found) != expected:
        raise ValueError(
            f"Expected PDFs for banks 111–130; missing={sorted(expected - set(found))}, "
            f"unexpected={sorted(set(found) - expected)}"
        )
    return found


def option_key(value: str) -> str | None:
    token = unicodedata.normalize("NFKC", value).strip()
    return KEY_TO_OPTION.get(token)


def printed_key(text: str, bank_number: int) -> str | None:
    text = unicodedata.normalize("NFKC", text or "")
    matches: list[str] = []
    patterns = (
        r"الإجابة\s*الصحيحة\s*[:：]\s*([أإآابجد])",
        r"الإجابة\s*[:：]\s*([أإآابجد])",
        r"([أإآابجد])\s*[:：]\s*الإجابة",
    )
    for pattern in patterns:
        matches.extend(re.findall(pattern, text))
    if bank_number == 111:
        matches.extend(re.findall(r"^\s*([أإآابجد])\s*(?=https?://)", text, re.MULTILINE))
    normalized = list(dict.fromkeys(option_key(match) for match in matches))
    normalized = [match for match in normalized if match]
    return normalized[0] if len(normalized) == 1 else None


def question_image(document: pymupdf.Document, page: pymupdf.Page) -> Image.Image:
    page_area = page.rect.width * page.rect.height
    by_xref: dict[int, tuple[float, tuple[float, float, float, float]]] = {}
    inline_candidates: list[tuple[float, tuple[float, float, float, float]]] = []

    # get_image_info reports only images actually drawn on this page; scanning
    # every XRef in the PDF resource table can be very slow for bank PDFs.
    for occurrence in page.get_image_info(xrefs=True):
        bbox = occurrence.get("bbox")
        if not bbox:
            continue
        rect = tuple(float(value) for value in bbox)
        area = max(0, rect[2] - rect[0]) * max(0, rect[3] - rect[1])
        if area <= 0 or area >= page_area * 0.90:
            continue
        xref = int(occurrence.get("xref") or 0)
        if xref > 0:
            if xref not in by_xref or area > by_xref[xref][0]:
                by_xref[xref] = (area, rect)
        else:
            inline_candidates.append((area, rect))

    if by_xref:
        _, selected_xref = max(
            ((area, xref) for xref, (area, _) in by_xref.items()),
            key=lambda item: item[0],
        )
        extracted = document.extract_image(selected_xref)
        return Image.open(BytesIO(extracted["image"])).convert("RGB")

    if inline_candidates:
        _, bbox = max(inline_candidates, key=lambda item: item[0])
        pixmap = page.get_pixmap(
            matrix=pymupdf.Matrix(4, 4),
            clip=pymupdf.Rect(*bbox),
            alpha=False,
        )
        return Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)

    raise ValueError(
        f"Page {page.number + 1} has no separate question image; refusing to publish a full solved page"
    )


def main() -> None:
    pdfs = find_pdfs()
    banks: list[dict] = []
    review_holds: list[dict] = []
    total_questions = 0
    approved_keys = 0

    for bank_number in sorted(QUESTION_COUNTS):
        pdf_path = pdfs[bank_number]
        question_count = QUESTION_COUNTS[bank_number]
        document = pymupdf.open(pdf_path)
        first_question_page = len(document) - question_count
        if first_question_page not in {0, 1}:
            raise ValueError(
                f"Bank {bank_number}: expected zero or one cover page, found {first_question_page}"
            )
        expected_pages = question_count + first_question_page
        if len(document) != expected_pages:
            raise ValueError(
                f"Bank {bank_number}: expected {expected_pages} total pages, found {len(document)}"
            )

        if bank_number == 124:
            review_holds.append({
                "bank": bank_number,
                "sourcePdf": pdf_path.name,
                "declaredQuestionCount": 74,
                "availableQuestionPages": question_count,
                "reason": (
                    "الملف يعلن 74 سؤالًا لكن يحتوي 47 صفحة سؤال فقط؛ أرقام الصور لا تطابق "
                    "ترقيم صفحات المصدر، والسؤال الأخير مشطوب بعلامة X. كما أتلف التنظيف الآلي "
                    "نصوصًا فعلية، لذلك حُجز البنك كاملًا."
                ),
            })
            document.close()
            print(f"Bank {bank_number}: held; source is incomplete and visibly inconsistent")
            continue

        questions: list[dict] = []
        bank_hold_count = 0
        for question_number in range(1, question_count + 1):
            page = document[first_question_page + question_number - 1]
            page_text = page.get_text("text")
            hold_reason = VISUAL_REVIEW_HOLDS.get((bank_number, question_number))
            if hold_reason:
                bank_hold_count += 1
                review_holds.append({
                    "bank": bank_number,
                    "questionNumber": question_number,
                    "sourcePdf": pdf_path.name,
                    "sourcePage": page.number + 1,
                    "reason": hold_reason,
                })
                continue

            key = printed_key(page_text, bank_number)
            if key is None:
                raise ValueError(
                    f"Could not unambiguously read the printed answer key for "
                    f"bank {bank_number}, question {question_number}"
                )

            image = question_image(document, page)
            exam_folder = IMAGE_ROOT / f"exam-{bank_number}"
            exam_folder.mkdir(parents=True, exist_ok=True)
            image_name = f"question-{question_number:03d}"
            image.save(exam_folder / f"{image_name}.jpeg", format="JPEG", quality=94, optimize=True)

            base_url = f"/foundation/quantitative/computer-banks/exam-{bank_number}"
            original_url = f"{base_url}/{image_name}.jpeg"
            processed_url = f"{base_url}/background-removed/{image_name}.png"
            question = {
                "examNumber": bank_number,
                "questionNumber": question_number,
                "text": f"السؤال المصوّر {question_number} من بنك الكمي المحوسب {bank_number}.",
                "options": ["أ", "ب", "ج", "د"],
                "correctOptionIndex": VALID_KEYS[key],
                "answerToken": key,
                "answerStatus": "approved",
                "answerEvidence": "source_printed_answer_key",
                "subcategory": "بنوك محوسبة",
                "imageUrl": processed_url,
                "imageUrls": [processed_url],
                "imageOriginalUrl": original_url,
                "imageOriginalUrls": [original_url],
                "imageProcessing": {
                    "status": "processed",
                    "backgroundRemoved": True,
                    "watermarkCleanupApplied": True,
                    "note": "أُزيلت خلفية السؤال وعلامات الناشر مع حفظ الصورة الأصلية.",
                },
                "sourcePdf": pdf_path.name,
            }
            questions.append(question)
            total_questions += 1
            approved_keys += 1

        banks.append({
            "number": bank_number,
            "scoringMode": "scored",
            "video": None,
            "pdf": None,
            "attachment": None,
            "rightsStatus": "user_confirmed_publish_and_edit",
            "questions": questions,
        })
        document.close()
        print(
            f"Bank {bank_number}: {len(questions)} importable questions; "
            f"{len(questions)} printed keys; {bank_hold_count} held for review"
        )

    payload = {
        "schemaVersion": 1,
        "sourceRightsConfirmed": True,
        "answerKeysIndependentlyVerified": False,
        "videosPending": True,
        "banks": banks,
        "reviewHolds": review_holds,
    }
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if total_questions != 953 or approved_keys != 953 or len(review_holds) != 2:
        raise ValueError(
            f"Expected 953 importable questions and printed keys, "
            f"found {total_questions} questions and {approved_keys} keys"
        )
    print(
        f"Manifest: {MANIFEST.relative_to(ROOT)}; banks={len(banks)}; "
        f"questions={total_questions}; source-printed-keys={approved_keys}; "
        f"reviewHolds={len(review_holds)}"
    )


if __name__ == "__main__":
    main()
