#!/usr/bin/env python3
"""Build a conservative review file from the scanned Tahsili OCR output.

The parser intentionally drops blocks that do not contain four discernible
options. It is safer to leave a question in the review queue than to publish
an incomplete question or invent an answer.
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path


SUBJECT_RANGES = {
    "رياضيات": range(8, 90),
    "فيزياء": range(95, 155),
    "كيمياء": range(161, 227),
    "أحياء": range(231, 296),
}

ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
QUESTION_START = re.compile(r"^\s*([0-9٠-٩]{1,3})\s*(?:[>»§:؛]|[-–])\s*(.+)$")
QUESTION_LOOSE_START = re.compile(r"^\s*([0-9٠-٩]{1,3})\s+(.{8,})$")
SUBCATEGORY_NUMBER = re.compile(r"(?:\(([0-9٠-٩]{1,2})\)|\(([١٢٣٤٥٦٧٨٩٠]{1,2})\))")
OPTION_MARK = re.compile(
    r"(?:(?<=^)|(?<=[\s()\[\]»«]))(?:©|@|®|◉|◌|A|B|C|D|أ|ب|ج|د)"
)
NOISE = re.compile(r"^[|_—–\-•·]+$")


def normalize_digits(value: str) -> str:
    return value.translate(ARABIC_DIGITS)


def clean_text(value: str) -> str:
    value = unicodedata.normalize("NFKC", value)
    value = value.replace("\u200f", " ").replace("\u200e", " ")
    value = re.sub(r"\s+", " ", value).strip(" -–—|")
    return value.strip()


def looks_like_heading(line: str) -> bool:
    line = clean_text(line)
    if not line or len(line) > 110 or NOISE.fullmatch(line):
        return False
    if "القسم" in line:
        return False
    return bool(
        "«" in line
        or "#" in line
        or re.search(r"\([0-9٠-٩]{1,2}\)", line)
    )


def find_question_start(line: str) -> tuple[int, str] | None:
    match = QUESTION_START.match(line)
    if match:
        return int(normalize_digits(match.group(1))), clean_text(match.group(2))

    # Tesseract sometimes loses the separator after the number. Avoid treating
    # ordinary body lines as questions by requiring a short numeric prefix and
    # a question-like Arabic/Latin body.
    match = QUESTION_LOOSE_START.match(line)
    if match and len(match.group(1)) <= 2:
        body = clean_text(match.group(2))
        if body and not body.startswith(("©", "@", "®", "A", "B", "C", "D")):
            return int(normalize_digits(match.group(1))), body
    return None


def split_options(lines: list[str]) -> tuple[str, list[str]]:
    joined = " ".join(clean_text(line) for line in lines if clean_text(line))
    if not joined:
        return "", []

    # Preserve all marker boundaries. OCR uses circles more often than A/B/C/D
    # for the printed option labels.
    matches = list(OPTION_MARK.finditer(joined))
    if len(matches) < 4:
        return clean_text(joined), []

    first = matches[0].start()
    stem = clean_text(joined[:first])
    options: list[str] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(joined)
        option = clean_text(joined[match.end():end])
        if option:
            options.append(option)

    # OCR may see a marker inside a math expression or duplicate a circle.
    # Keep only a clean four-option block.
    if len(options) != 4 or any(len(option) < 1 for option in options):
        return stem, []
    return stem, options


def parse_page(path: Path, subject: str) -> list[dict]:
    page_number = int(path.stem.split("-")[-1])
    lines = path.read_text(errors="ignore").splitlines()
    current_subcategory = "عام"
    blocks: list[tuple[int, int, str, list[str]]] = []
    active: tuple[int, str, list[str]] | None = None

    for raw_line in lines:
        line = clean_text(raw_line)
        if not line:
            continue
        if looks_like_heading(line):
            current_subcategory = line.replace("«", "").replace("#", "").strip()
            continue

        start = find_question_start(line)
        if start:
            if active is not None:
                blocks.append((active[0], page_number, active[1], active[2]))
            active = (start[0], current_subcategory, [start[1]])
            continue

        if active is not None:
            active[2].append(line)

    if active is not None:
        blocks.append((active[0], page_number, active[1], active[2]))

    records: list[dict] = []
    for source_number, source_page, subcategory, block_lines in blocks:
        stem, options = split_options(block_lines)
        if not stem or len(options) != 4:
            continue
        # Skip footer fragments and accidental section headings.
        if len(stem) < 8 or "القسم" in stem:
            continue
        records.append(
            {
                "subject": subject,
                "subcategory": clean_text(subcategory) or "عام",
                "text": stem,
                "options": options,
                "correctOptionIndex": 0,
                "difficulty": "intermediate",
                "topic": clean_text(subcategory) or "عام",
                "sourcePage": source_page,
                "sourceQuestionNumber": source_number,
                "sourceBook": "كتاب ناصر عبدالكريم للتحصيلي",
                "answerConfidence": "review",
            }
        )
    return records


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path(".agents/outputs/tahsili-ocr-psm4"))
    parser.add_argument("--output", type=Path, default=Path(".agents/outputs/tahsili-question-review.json"))
    args = parser.parse_args()

    records: list[dict] = []
    for subject, pages in SUBJECT_RANGES.items():
        for page_number in pages:
            path = args.input / f"page-{page_number:03d}.txt"
            if path.exists():
                records.extend(parse_page(path, subject))

    # A page can repeat a question number in OCR output. Use page + subject +
    # subcategory + number as a stable source key and keep the first complete block.
    unique: dict[tuple, dict] = {}
    for record in records:
        key = (
            record["subject"],
            record["sourcePage"],
            record["subcategory"],
            record["sourceQuestionNumber"],
        )
        unique.setdefault(key, record)

    output = []
    for question_id, record in enumerate(unique.values(), start=1):
        record = dict(record)
        record["questionId"] = question_id
        output.append(record)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(
            {
                "source": "attached_assets/822748463-كتاب-ناصر-عبد-الكريم-للتحصيلي_1789011713747.pdf",
                "generatedFrom": str(args.input),
                "questions": output,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    counts: dict[str, int] = {}
    for record in output:
        counts[record["subject"]] = counts.get(record["subject"], 0) + 1
    print(json.dumps({"total": len(output), "bySubject": counts}, ensure_ascii=False))


if __name__ == "__main__":
    main()