#!/usr/bin/env python3
"""Extract question blocks from the scanned book using page separators.

This pass is deliberately conservative: it only emits blocks with four
non-empty choices. Answers remain `review` until matched to the printed key.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path

import fitz
from PIL import Image


SUBJECT_RANGES = {
    "رياضيات": range(8, 90),
    "فيزياء": range(95, 155),
    "كيمياء": range(161, 227),
    "أحياء": range(231, 296),
}
QUESTION_START = re.compile(r"^\s*([0-9٠-٩]{1,3})\s*(?:[>»§:؛-])?\s*(.+)$")
MARK = re.compile(r"(?:(?<=^)|(?<=[\s()\[\]»«]))(?:©|@|®|◉|◌|A|B|C|D|أ|ب|ج|د)")
ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")


def clean(value: str) -> str:
    value = value.replace("\u200f", " ").replace("\u200e", " ")
    return re.sub(r"\s+", " ", value).strip(" -–—|")


def ocr(image: Image.Image, psm: int = 6) -> str:
    with tempfile.NamedTemporaryFile(suffix=".png") as handle:
        image.save(handle.name)
        result = subprocess.run(
            ["tesseract", handle.name, "stdout", "-l", "ara+eng", "--psm", str(psm)],
            capture_output=True,
            text=True,
            check=False,
        )
    return result.stdout


def separators(image: Image.Image) -> list[int]:
    width, height = image.size
    rows: list[int] = []
    for y in range(height):
        dark = 0
        for x in range(width):
            r, g, b = image.getpixel((x, y))
            if r < 235 and g < 235 and b < 235:
                dark += 1
        if dark > width * 0.70:
            rows.append(y)
    groups: list[tuple[int, int]] = []
    for y in rows:
        if not groups or y > groups[-1][1] + 1:
            groups.append((y, y))
        else:
            groups[-1] = (groups[-1][0], y)
    return [int((start + end) / 2) for start, end in groups if end - start <= 12]


def split_marked_options(text: str) -> tuple[str, list[str]]:
    joined = clean(" ".join(line for line in text.splitlines() if clean(line)))
    matches = list(MARK.finditer(joined))
    if len(matches) < 4:
        return joined, []
    stem = clean(joined[: matches[0].start()])
    options = []
    for index, match in enumerate(matches[:4]):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(joined)
        option = clean(joined[match.end() : end])
        if option:
            options.append(option)
    if len(options) != 4:
        return stem, []
    return stem, options


def quadrant_options(block: Image.Image) -> list[str]:
    width, height = block.size
    y_start = int(height * 0.34)
    y_mid = int(height * 0.68)
    y_end = int(height * 0.98)
    boxes = [
        (int(width * 0.48), y_start, width, y_mid),  # A: top right
        (0, y_start, int(width * 0.55), y_mid),  # B: top left
        (int(width * 0.48), y_mid, width, y_end),  # C: bottom right
        (0, y_mid, int(width * 0.55), y_end),  # D: bottom left
    ]
    output = []
    for box in boxes:
        crop = block.crop(box).resize(
            (max(300, (box[2] - box[0]) * 2), max(120, (box[3] - box[1]) * 2))
        )
        text = clean(ocr(crop))
        text = re.sub(r"^[©@®◉◌ABCDأبجد()\s]+", "", text)
        output.append(text)
    return output if len(output) == 4 and all(option for option in output) else []


def extract() -> list[dict]:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--zoom", type=float, default=2.2)
    args = parser.parse_args()

    document = fitz.open(args.pdf)
    records: list[dict] = []
    for subject, pages in SUBJECT_RANGES.items():
        for page_number in pages:
            page = document[page_number - 1]
            pixmap = page.get_pixmap(
                matrix=fitz.Matrix(args.zoom, args.zoom),
                clip=fitz.Rect(page.rect.width * 0.40, 0, page.rect.width, page.rect.height),
                alpha=False,
            )
            image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
            cuts = [0] + separators(image) + [image.height]
            for start, end in zip(cuts, cuts[1:]):
                if end - start < 110:
                    continue
                block = image.crop((0, start + 4, image.width, end - 4))
                raw = ocr(block)
                if "القسم" in raw and len(raw) < 160:
                    continue
                stem, options = split_marked_options(raw)
                if len(options) != 4:
                    options = quadrant_options(block)
                    if options:
                        first_line = next((clean(line) for line in raw.splitlines() if clean(line)), "")
                        stem = clean(re.sub(r"^\s*[0-9٠-٩]{1,3}\s*[>»§:؛-]?\s*", "", first_line))
                if len(options) != 4 or len(stem) < 8:
                    continue
                number_match = QUESTION_START.match(
                    next((clean(line) for line in raw.splitlines() if clean(line)), "")
                )
                source_number = (
                    int(number_match.group(1).translate(ARABIC_DIGITS))
                    if number_match
                    else None
                )
                records.append(
                    {
                        "subject": subject,
                        "subcategory": "عام",
                        "text": stem,
                        "options": options,
                        "correctOptionIndex": 0,
                        "difficulty": "intermediate",
                        "topic": "عام",
                        "sourcePage": page_number,
                        "sourceQuestionNumber": source_number,
                        "sourceBook": "كتاب ناصر عبدالكريم للتحصيلي",
                        "answerConfidence": "review",
                    }
                )
            print(f"page={page_number} records={len(records)}", flush=True)

    unique: dict[tuple, dict] = {}
    for record in records:
        key = (record["subject"], record["sourcePage"], record["sourceQuestionNumber"], record["text"])
        unique.setdefault(key, record)
    output = []
    for question_id, record in enumerate(unique.values(), 1):
        record = dict(record)
        record["questionId"] = question_id
        output.append(record)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({"questions": output}, ensure_ascii=False, indent=2))
    print(json.dumps({"total": len(output)}, ensure_ascii=False))


if __name__ == "__main__":
    extract()