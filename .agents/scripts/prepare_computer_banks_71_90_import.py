from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
REVIEW = ROOT / "generated-artifacts/quantitative-banks-71-90/review-draft.json"
OUTPUT = ROOT / ".agents/outputs/quantitative-computer-banks/computer-banks-71-90.json"
OPTIONS = ["أ", "ب", "ج", "د"]
FIRST_BANK = 71
LAST_BANK = 90
QUESTION_COUNT = 48


def main() -> None:
    draft = json.loads(REVIEW.read_text(encoding="utf-8"))
    banks = draft.get("banks")
    if not isinstance(banks, list) or len(banks) != LAST_BANK - FIRST_BANK + 1:
        raise RuntimeError("Expected exactly 20 reviewed banks (71–90).")

    output_banks = []
    seen_numbers: set[int] = set()
    for source_bank in banks:
        number = source_bank.get("number")
        questions = source_bank.get("questions")
        if (
            not isinstance(number, int)
            or number < FIRST_BANK
            or number > LAST_BANK
            or number in seen_numbers
            or source_bank.get("rightsStatus")
            != "user_confirmed_permission_for_publication_and_watermark_edits"
        ):
            raise RuntimeError(f"Invalid bank number or rights confirmation: {number!r}")
        seen_numbers.add(number)
        if not isinstance(questions, list) or len(questions) != QUESTION_COUNT:
            raise RuntimeError(f"Bank {number} must contain exactly 48 questions.")

        import_questions = []
        for expected_number, question in enumerate(questions, start=1):
            if (
                question.get("questionNumber") != expected_number
                or question.get("answerStatus") != "printed_key_not_independently_verified"
                or question.get("imageWidth", 0) < 500
                or question.get("imageHeight", 0) < 250
            ):
                raise RuntimeError(
                    f"Invalid question image/key metadata for bank {number}, question {expected_number}."
                )

            answer_index = question.get("correctOptionIndex")
            if not isinstance(answer_index, int) or not 0 <= answer_index < len(OPTIONS):
                raise RuntimeError(
                    f"Invalid printed answer index for bank {number}, question {expected_number}."
                )

            image_path = (
                f"/foundation/quantitative/computer-banks/exam-{number:02d}/"
                f"question-{expected_number:03d}.jpeg"
            )
            import_questions.append({
                "examNumber": number,
                "questionNumber": expected_number,
                "text": (
                    f"السؤال {expected_number} من بنك الكمي المحوسب {number}. "
                    "النص والخيارات محفوظة في صورة السؤال."
                ),
                "options": OPTIONS,
                "correctOptionIndex": answer_index,
                "answerToken": question["printedAnswerToken"],
                "answerStatus": "approved",
                "answerEvidence": "source_printed_answer_key",
                "subcategory": "بنوك محوسبة",
                "imageUrl": image_path,
                "imageUrls": [image_path],
                "sourcePdf": source_bank["sourcePdf"],
            })

        output_banks.append({
            "number": number,
            "video": None,
            "pdf": source_bank["sourcePdf"],
            "attachment": None,
            "rightsStatus": "user_confirmed_permission",
            "questions": import_questions,
        })

    output_banks.sort(key=lambda bank: bank["number"])
    payload = {
        "schemaVersion": 1,
        "sourceRightsConfirmed": True,
        "answerKeySource": "printed answer key on each solved-PDF question page",
        "answerKeysIndependentlyVerified": False,
        "videosPending": True,
        "banks": output_banks,
    }
    encoded = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(encoded, encoding="utf-8")
    print(json.dumps({
        "banks": len(output_banks),
        "questions": sum(len(bank["questions"]) for bank in output_banks),
        "printedKeys": sum(len(bank["questions"]) for bank in output_banks),
        "videoLessons": 0,
        "output": str(OUTPUT.relative_to(ROOT)),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
