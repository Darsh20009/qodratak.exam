#!/usr/bin/env python3
"""Extract question-only images and verified printed keys from banks 91–110."""

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
IMAGE_ROOT = ROOT / "generated-artifacts/quantitative-banks-91-110/source-images"
MANIFEST = ROOT / ".agents/outputs/quantitative-computer-banks/computer-banks-91-110.json"
UNSCORED_BANKS = {92, 105, 108, 109}
VALID_KEYS = {"أ": 0, "ا": 0, "إ": 0, "آ": 0, "ب": 1, "ج": 2, "د": 3}


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
        if not 91 <= number <= 110:
            continue
        if number in found:
            raise ValueError(f"More than one attached PDF matches bank {number}")
        found[number] = path
    expected = set(range(91, 111))
    if set(found) != expected:
        raise ValueError(
            f"Expected PDFs for banks 91–110; missing={sorted(expected - set(found))}, "
            f"unexpected={sorted(set(found) - expected)}"
        )
    return found


def option_key(value: str) -> str | None:
    token = unicodedata.normalize("NFKC", value).strip()
    return {"أ": "أ", "ا": "أ", "إ": "أ", "آ": "أ", "ب": "ب", "ج": "ج", "د": "د"}.get(token)


def printed_key(text: str, bank_number: int) -> str | None:
    text = unicodedata.normalize("NFKC", text or "")
    if bank_number in {91, *range(93, 105), 107}:
        match = re.search(r"الإجابة\s*الصحيحة\s*[:：]?\s*([أإآابجد])", text)
        return option_key(match.group(1)) if match else None
    if bank_number == 106:
        # These pages have a single standalone answer token in their selectable text.
        tokens = re.findall(r"(?<![ء-ي])([أإآابجد])(?![ء-ي])", text)
        return option_key(tokens[0]) if len(tokens) == 1 else None
    if bank_number == 110:
        # The answer token precedes the printed source URL on each page.
        match = re.search(r"^\s*([أإآابجد])\s*(?=https?://)", text, re.MULTILINE)
        if not match:
            match = re.search(r"([أإآابجد])\s+https?://", text)
        return option_key(match.group(1)) if match else None
    return None


def question_image(document: pymupdf.Document, page: pymupdf.Page) -> Image.Image:
    if document.name and "اختبار_92" in normalized_name(Path(document.name)):
        # Bank 92 stores the whole solved page as one raster image. Render a
        # question-only crop and deliberately exclude the printed key footer.
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(4, 4), alpha=False)
        rendered = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        return rendered.crop((0, int(rendered.height * 0.20), rendered.width, int(rendered.height * 0.78)))

    candidates: list[tuple[int, int]] = []
    page_area = page.rect.width * page.rect.height
    for image in page.get_images(full=True):
        xref = image[0]
        rectangles = page.get_image_rects(xref)
        if not rectangles:
            continue
        candidates.append((image[2] * image[3], xref))
    if not candidates:
        raise ValueError(f"Page {page.number + 1} has no extractable question image")

    # Some solved PDFs place a low-resolution page background behind the question.
    # Prefer the largest embedded image that is not itself a full-page scan.
    page_sized = [
        candidate
        for candidate in candidates
        if any(
            rect.width * rect.height >= page_area * 0.90
            for rect in page.get_image_rects(candidate[1])
        )
    ]
    question_images = [candidate for candidate in candidates if candidate not in page_sized]
    selected_xref = max(question_images or candidates)[1]
    extracted = document.extract_image(selected_xref)
    return Image.open(BytesIO(extracted["image"])).convert("RGB")


def remove_bank_108_answer_mark(image: Image.Image) -> Image.Image:
    """Hide the red printed answer token in the source image before it becomes public."""
    pixels = image.load()
    right = max(1, int(image.width * 0.30))
    top = int(image.height * 0.78)
    for y in range(top, image.height):
        for x in range(right):
            red, green, blue = pixels[x, y]
            if red > 85 and red > green + 3 and red > blue + 3:
                pixels[x, y] = (255, 255, 255)
    return image


def main() -> None:
    pdfs = find_pdfs()
    banks: list[dict] = []
    total_questions = 0
    approved = 0

    for bank_number in range(91, 111):
        pdf_path = pdfs[bank_number]
        document = pymupdf.open(pdf_path)
        if len(document) not in {48, 49}:
            raise ValueError(f"Bank {bank_number}: expected 48 question pages, found {len(document)} total pages")
        first_question_page = 1 if len(document) == 49 else 0
        questions: list[dict] = []

        for question_number in range(1, 49):
            page = document[first_question_page + question_number - 1]
            image = question_image(document, page)
            if bank_number == 108:
                image = remove_bank_108_answer_mark(image)

            exam_folder = IMAGE_ROOT / f"exam-{bank_number}"
            exam_folder.mkdir(parents=True, exist_ok=True)
            image_path = exam_folder / f"question-{question_number:03d}.jpeg"
            image.save(image_path, format="JPEG", quality=94, optimize=True)

            key = None if bank_number in UNSCORED_BANKS else printed_key(
                page.get_text("text"),
                bank_number,
            )
            if bank_number not in UNSCORED_BANKS and key is None:
                raise ValueError(
                    f"Could not verify printed answer key for bank {bank_number}, question {question_number}"
                )
            image_url = (
                f"/foundation/quantitative/computer-banks/exam-{bank_number}/"
                f"question-{question_number:03d}.jpeg"
            )
            question = {
                "examNumber": bank_number,
                "questionNumber": question_number,
                "text": f"السؤال المصوّر {question_number} من بنك الكمي المحوسب {bank_number}.",
                "options": ["أ", "ب", "ج", "د"],
                "correctOptionIndex": VALID_KEYS[key] if key else None,
                "answerToken": key,
                "answerStatus": "approved" if key else "review",
                "answerEvidence": "source_printed_answer_key" if key else None,
                "subcategory": "بنوك محوسبة",
                "imageUrl": image_url,
                "imageUrls": [image_url],
                "sourcePdf": pdf_path.name,
            }
            questions.append(question)
            total_questions += 1
            approved += int(bool(key))

        banks.append({
            "number": bank_number,
            "scoringMode": "unscored" if bank_number in UNSCORED_BANKS else "scored",
            "video": None,
            "pdf": None,
            "attachment": None,
            "rightsStatus": "user_confirmed_publish_and_edit",
            "questions": questions,
        })
        document.close()
        print(
            f"Bank {bank_number}: {len(questions)} questions; "
            f"{sum(q['answerStatus'] == 'approved' for q in questions)} verified keys; "
            f"mode={banks[-1]['scoringMode']}"
        )

    payload = {
        "schemaVersion": 1,
        "sourceRightsConfirmed": True,
        "answerKeysIndependentlyVerified": False,
        "videosPending": True,
        "banks": banks,
    }
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if total_questions != 960:
        raise ValueError(f"Expected 960 question records, found {total_questions}")
    print(f"Manifest: {MANIFEST.relative_to(ROOT)}; questions={total_questions}; verifiedKeys={approved}")


if __name__ == "__main__":
    main()
