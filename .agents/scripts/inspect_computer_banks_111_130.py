#!/usr/bin/env python3
"""Preflight the current solved PDF batch for banks 111–130."""

from __future__ import annotations

import json
import re
import unicodedata
from io import BytesIO
from pathlib import Path

import pymupdf
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
INPUT_DIR = ROOT / "attached_assets"
OUTPUT_DIR = ROOT / "generated-artifacts/quantitative-banks-111-130"


def normalized_name(path: Path) -> str:
    return "".join(
        str(unicodedata.digit(char)) if char.isdigit() else char
        for char in unicodedata.normalize("NFKC", path.name)
        if unicodedata.category(char) != "Cf"
    )


def bank_number(path: Path) -> int | None:
    name = normalized_name(path)
    match = re.search(r"(?:اختبار|البنك|بنك)[_\s-]*(\d{2,3})(?!\d)", name)
    return int(match.group(1)) if match else None


def question_image(document: pymupdf.Document, page: pymupdf.Page) -> Image.Image:
    candidates: list[tuple[int, int]] = []
    page_area = page.rect.width * page.rect.height
    for image in page.get_images(full=True):
        xref = image[0]
        rectangles = page.get_image_rects(xref)
        if rectangles:
            candidates.append((image[2] * image[3], xref))
    page_sized = [
        candidate
        for candidate in candidates
        if any(
            rect.width * rect.height >= page_area * 0.90
            for rect in page.get_image_rects(candidate[1])
        )
    ]
    question_images = [candidate for candidate in candidates if candidate not in page_sized]
    if not question_images and candidates:
        question_images = candidates
    if not question_images:
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False)
        return Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
    xref = max(question_images)[1]
    extracted = document.extract_image(xref)
    return Image.open(BytesIO(extracted["image"])).convert("RGB")


def clean_text(text: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", text).split())


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    found: dict[int, Path] = {}
    duplicates: dict[int, list[str]] = {}
    for path in INPUT_DIR.glob("*.pdf"):
        number = bank_number(path)
        if number is None or not 111 <= number <= 130:
            continue
        if "غير_محلول" in normalized_name(path) or "غير محلول" in normalized_name(path):
            continue
        if number in found:
            duplicates.setdefault(number, [found[number].name]).append(path.name)
        else:
            found[number] = path
    expected = set(range(111, 131))
    if duplicates or set(found) != expected:
        raise ValueError(
            f"PDF selection mismatch: missing={sorted(expected - set(found))}; "
            f"duplicates={duplicates}"
        )

    cell_width, cell_height = 260, 360
    columns = 5
    contact = Image.new("RGB", (columns * cell_width, 4 * cell_height), "white")
    question_contact = Image.new("RGB", (4 * 690, 5 * 235), "white")
    question_draw = ImageDraw.Draw(question_contact)
    draw = ImageDraw.Draw(contact)
    report = []

    for offset, number in enumerate(range(111, 131)):
        path = found[number]
        document = pymupdf.open(path)
        page_count = len(document)
        sample_pages = [0, min(1, page_count - 1)]
        first_text = [clean_text(document[index].get_text("text"))[:500] for index in sample_pages]
        key_styles = {
            "answer_phrase": 0,
            "standalone_key": 0,
            "other": 0,
        }
        image_counts = []
        for page in document:
            text = clean_text(page.get_text("text"))
            if re.search(r"الإجابة\s*الصحيحة", text):
                key_styles["answer_phrase"] += 1
            elif re.fullmatch(r"(?:https?://\S+\s*)?[أإآابجد](?:\s*https?://\S+)?", text):
                key_styles["standalone_key"] += 1
            else:
                key_styles["other"] += 1
            image_counts.append(len(page.get_images(full=True)))

        page = document[0]
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(1.1, 1.1), alpha=False)
        rendered = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        extracted = question_image(document, page)
        card_x = (offset % columns) * cell_width
        card_y = (offset // columns) * cell_height
        draw.text((card_x + 8, card_y + 6), f"Bank {number} — {page_count} pages", fill="black")
        rendered.thumbnail((cell_width - 16, cell_height // 2 - 12))
        contact.paste(rendered, (card_x + 8, card_y + 28))
        extracted.thumbnail((cell_width - 16, cell_height // 2 - 12))
        contact.paste(extracted, (card_x + 8, card_y + cell_height // 2 + 12))

        first_page_text = clean_text(document[0].get_text("text"))
        first_question_page = 1 if (
            "النسخة المحلولة" in first_page_text
            or "عدد الأسئلة" in first_page_text
            or (number == 121 and not first_page_text)
        ) else 0
        sample_indexes = sorted({
            first_question_page,
            min(first_question_page + max(1, (page_count - first_question_page) // 2), page_count - 1),
            page_count - 1,
        })
        q_card_x = (offset % 4) * 690
        q_card_y = (offset // 4) * 235
        question_draw.text((q_card_x + 6, q_card_y + 3), f"Bank {number}; samples from page(s) {','.join(str(i+1) for i in sample_indexes)}", fill="black")
        for sample_offset, page_index in enumerate(sample_indexes):
            sample_pixmap = document[page_index].get_pixmap(matrix=pymupdf.Matrix(1.35, 1.35), alpha=False)
            sample_image = Image.frombytes("RGB", (sample_pixmap.width, sample_pixmap.height), sample_pixmap.samples)
            sample_image.thumbnail((220, 192))
            question_contact.paste(sample_image, (q_card_x + 5 + sample_offset * 225, q_card_y + 25))

        report.append({
            "bank": number,
            "pdf": path.name,
            "sizeBytes": path.stat().st_size,
            "pageCount": page_count,
            "keyStylePageCounts": key_styles,
            "imageCountMin": min(image_counts, default=0),
            "imageCountMax": max(image_counts, default=0),
            "firstPageText": first_text[0],
            "secondPageText": first_text[1],
            "renderedPageIndex": 0,
        })
        document.close()

    contact.save(OUTPUT_DIR / "preflight-contact.jpg", quality=88, optimize=True)
    question_contact.save(OUTPUT_DIR / "question-pages-contact.jpg", quality=90, optimize=True)
    (OUTPUT_DIR / "preflight-report.json").write_text(
        json.dumps({"banks": report}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "banks": len(report),
        "totalPages": sum(row["pageCount"] for row in report),
        "contactSheet": str((OUTPUT_DIR / "preflight-contact.jpg").relative_to(ROOT)),
        "report": str((OUTPUT_DIR / "preflight-report.json").relative_to(ROOT)),
        "pageCounts": {row["bank"]: row["pageCount"] for row in report},
        "keyStyles": {row["bank"]: row["keyStylePageCounts"] for row in report},
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
