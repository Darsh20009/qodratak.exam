#!/usr/bin/env python3
"""Validate and merge the independent Nasser-book OCR review batches."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
GENERATED = ROOT / "generated-artifacts" / "tahsili-question-drafts"
PARTS = [GENERATED / f"nasser-part-{index}.json" for index in range(1, 5)]
IMAGE_DIR = GENERATED / "nasser-images"
OUTPUT = GENERATED / "nasser-question-drafts.json"


def main() -> None:
    questions: list[dict] = []
    for part in PARTS:
        if not part.is_file():
            raise SystemExit(f"Missing extraction batch: {part.name}")
        payload = json.loads(part.read_text(encoding="utf-8"))
        batch = payload.get("questions")
        if not isinstance(batch, list):
            raise SystemExit(f"Invalid question list in {part.name}")
        questions.extend(batch)

    by_source_key: dict[str, dict] = {}
    question_ids: set[int] = set()
    for question in questions:
        key = question.get("sourceKey")
        question_id = question.get("questionId")
        image_name = question.get("sourceImageFilename")
        if not isinstance(key, str) or key in by_source_key:
            raise SystemExit(f"Duplicate or missing source identity: {key}")
        if not isinstance(question_id, int) or question_id in question_ids:
            raise SystemExit(f"Duplicate or missing question id: {question_id}")
        if "correctOptionIndex" in question:
            raise SystemExit(f"Unverified answer key found in draft: {key}")
        if not isinstance(image_name, str) or not (IMAGE_DIR / image_name).is_file():
            raise SystemExit(f"Question image missing for source block: {key}")
        if len(question.get("options", [])) != 4:
            raise SystemExit(f"Expected four OCR choices for source block: {key}")
        question_ids.add(question_id)
        by_source_key[key] = question

    ordered = sorted(
        by_source_key.values(),
        key=lambda item: (item["sourcePage"], item["sourceBlockIndex"]),
    )
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps({"questions": ordered}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    counts = Counter(question["subject"] for question in ordered)
    print(json.dumps({
        "total": len(ordered),
        "subjects": dict(counts),
        "imagesVerified": len(ordered),
        "answerKeysPublished": 0,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
