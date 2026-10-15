#!/usr/bin/env python3
"""Extract review-only question candidates from text-layer Tahsili PDFs."""

import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "attached_assets"
OUTPUT = ROOT / "generated-artifacts" / "tahsili-question-drafts" / "tahsili-text-layer-candidates.json"

SOURCES = [
    {
        "id": "ghasham-biology-2023",
        "ordinal": 2,
        "filename": "تأسيس_وتجميع_أ.غشّام_أحياء_٢٠٢٣_1792016335719.pdf",
        "subject": "أحياء",
        "book": "تأسيس وتجميع أ. غشّام — أحياء 2023",
    },
    {
        "id": "ghasham-physics-2023",
        "ordinal": 3,
        "filename": "تأسيس_وتجميع_أ.غشّام_فيزياء_٢٠٢٣_1792016335720.pdf",
        "subject": "فيزياء",
        "book": "تأسيس وتجميع أ. غشّام — فيزياء 2023",
    },
    {
        "id": "ghasham-chemistry-2023",
        "ordinal": 4,
        "filename": "تأسيس_وتجميع_أ.غشّام_كيمياء_٢٠٢٣_1792016335719.pdf",
        "subject": "كيمياء",
        "book": "تأسيس وتجميع أ. غشّام — كيمياء 2023",
    },
    {
        "id": "ghasham-math-2023",
        "ordinal": 5,
        "filename": "تأسيس_وتجميع_أ_غشّام_رياضيات_٢٠٢٣_1792016335719.pdf",
        "subject": "رياضيات",
        "book": "تأسيس وتجميع أ. غشّام — رياضيات 2023",
    },
    {
        "id": "ghasham-practice-biology-period-1",
        "ordinal": 10,
        "filename": "تدريبات_أ_غشام_الفترة_الأولى_الأحياء_1792016237165.pdf",
        "subject": "أحياء",
        "book": "تدريبات أ. غشّام — أحياء، الفترة الأولى",
    },
    {
        "id": "ghasham-practice-math-period-1",
        "ordinal": 11,
        "filename": "تدريبات_أ_غشام_الفترة_الأولى_رياضيات_1792016234652.pdf",
        "subject": "رياضيات",
        "book": "تدريبات أ. غشّام — رياضيات، الفترة الأولى",
    },
    {
        "id": "ghasham-practice-physics-period-1",
        "ordinal": 12,
        "filename": "تدريبات_أ_غشام_الفترة_الأولى_فيزياء_1792016240518.pdf",
        "subject": "فيزياء",
        "book": "تدريبات أ. غشّام — فيزياء، الفترة الأولى",
    },
    {
        "id": "ghasham-practice-chemistry-period-1",
        "ordinal": 13,
        "filename": "تدريبات_أ_غشام_الفترة_الأولى_كيمياء_1792016227657.pdf",
        "subject": "كيمياء",
        "book": "تدريبات أ. غشّام — كيمياء، الفترة الأولى",
    },
]

QUESTION_START = re.compile(r"(?=س\s*\d+\s*(?:[:：]|\n))")
QUESTION_NUMBER = re.compile(r"^\s*س\s*(\d+)\s*(?:[:：]\s*|\n\s*)")
OPTION = re.compile(r"(?<!\S)(?P<label>[أإآاابجد])\s*[-–—:]\s*")
LABELS = {"أ": "A", "إ": "A", "آ": "A", "ا": "A", "ب": "B", "ج": "C", "د": "D"}


def normalize(value: str) -> str:
    return unicodedata.normalize("NFKC", value).replace("\u0640", "").strip()


def parse_question(block: str, source: dict, page_number: int) -> dict | None:
    block = normalize(block)
    number_match = QUESTION_NUMBER.match(block)
    markers = list(OPTION.finditer(block))
    selected = None
    for index in range(max(0, len(markers) - 3)):
        if [LABELS[markers[index + offset].group("label")] for offset in range(4)] == ["A", "B", "C", "D"]:
            selected = markers[index : index + 4]
            break
    if not selected:
        return None

    question_text = normalize(block[QUESTION_NUMBER.match(block).end() if number_match else 0 : selected[0].start()])
    options = []
    explanation = ""
    for index, marker in enumerate(selected):
        end = selected[index + 1].start() if index < 3 else len(block)
        value = normalize(block[marker.end() : end])
        if index == 3 and "*" in value:
            value, explanation = value.split("*", 1)
            explanation = normalize(explanation)
        elif index == 3:
            explanation_match = re.search(r"\n\s*(?:الكمية\s*=|الحل\s*[:：]?|الشرح\s*[:：]?|[•])", value)
            if explanation_match:
                value, explanation = value[: explanation_match.start()], value[explanation_match.end() :]
                explanation = normalize(explanation)
        value = normalize(value.replace("*", ""))
        options.append(value)

    if (
        len(question_text) < 8
        or len(question_text) > 5000
        or any(not option or len(option) > 1000 for option in options)
        or any(re.search(r"س\s*\d+", option) for option in options)
        or any(any(ord(char) < 32 and char not in "\n\t" for char in option) for option in options)
    ):
        return None

    return {
        "sourceId": source["id"],
        "sourceOrdinal": source["ordinal"],
        "subject": source["subject"],
        "subcategory": "عام",
        "text": question_text,
        "options": options,
        "difficulty": "intermediate",
        "topic": "عام",
        "explanation": explanation[:5000] if explanation else "",
        "sourcePage": page_number,
        "sourceQuestionNumber": int(number_match.group(1)) if number_match else None,
        "sourceBook": source["book"],
    }


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    candidates = []
    counts = Counter()
    for source in SOURCES:
        path = ASSETS / source["filename"]
        if not path.is_file():
            raise FileNotFoundError(f"Missing source PDF: {source['filename']}")
        document = pymupdf.open(path)
        for page_index in range(document.page_count):
            text = normalize(document[page_index].get_text("text"))
            if not text:
                continue
            for block in QUESTION_START.split(text):
                if not QUESTION_NUMBER.match(block):
                    continue
                question = parse_question(block, source, page_index + 1)
                if question:
                    candidates.append(question)
                    counts[source["id"]] += 1
        document.close()

    OUTPUT.write_text(json.dumps({"questions": candidates}, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({
        "candidateCount": len(candidates),
        "sources": dict(counts),
        "answerKeysImported": 0,
        "studentPublication": "none; candidates require admin review",
        "output": str(OUTPUT.relative_to(ROOT)),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
