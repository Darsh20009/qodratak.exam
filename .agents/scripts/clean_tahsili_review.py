#!/usr/bin/env python3
"""Remove obvious OCR footer leakage before a Tahsili review import."""

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    payload = json.loads(args.input.read_text())
    kept = []
    for question in payload.get("questions", []):
        text = str(question.get("text", "")).strip()
        options = [str(option).strip() for option in question.get("options", [])]
        searchable = " ".join([text, *options])
        if len(text) < 8 or len(options) != 4:
            continue
        if any(marker in searchable for marker in ("القسم الأول:", "القسم الثاني:", "القسم الثالث:", "القسم الرابع:")):
            continue
        if any(len(option) > 240 for option in options):
            continue
        record = dict(question)
        record["options"] = options
        kept.append(record)

    for question_id, question in enumerate(kept, start=1):
        question["questionId"] = question_id
        question["answerConfidence"] = "review"
        question["correctOptionIndex"] = 0

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({"questions": kept}, ensure_ascii=False, indent=2))
    print(json.dumps({"input": len(payload.get("questions", [])), "output": len(kept)}, ensure_ascii=False))


if __name__ == "__main__":
    main()