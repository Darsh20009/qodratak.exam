#!/usr/bin/env python3
"""Extract text-layer questions from the 2024 Friday Tahsili PDFs as review-only drafts."""

import json
import re
from collections import defaultdict
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "attached_assets"
OUTPUT = ROOT / "generated-artifacts" / "tahsili-question-drafts" / "tahsili-exam-card-candidates.json"

SOURCES = [
    ("friday-evening-p2-biology-2024", 14, "أحياء", "اختبار الجمعة المسائي — أحياء، الفترة الثانية 2024", "ف2_جمعة_مسائي_24_-_أحياء_1792016220148.pdf"),
    ("friday-evening-p2-math-2024", 15, "رياضيات", "اختبار الجمعة المسائي — رياضيات، الفترة الثانية 2024", "ف2_جمعة_مسائي_24_-_رياضيات_1792016207388.pdf"),
    ("friday-evening-p2-physics-2024", 16, "فيزياء", "اختبار الجمعة المسائي — فيزياء، الفترة الثانية 2024", "ف2_جمعة_مسائي_24_-_فيزياء_1792016222600.pdf"),
    ("friday-evening-p2-chemistry-2024", 17, "كيمياء", "اختبار الجمعة المسائي — كيمياء، الفترة الثانية 2024", "ف2_جمعة_مسائي_24_-_كيمياء_1792016214685.pdf"),
    ("yelo-2024-p2-thursday-evening", 18, "مختلط", "يلو — فترات 2024، الفترة الثانية، الخميس المسائي", "يلو_فترات_2024_-_ف2_الخميس_مسائي_1792016199422.pdf"),
]

LABEL_ALIASES = {"أ": "A", "ا": "A", "ب": "B", "ج": "C", "د": "D"}


def rect_of(drawing):
    rect = drawing.get("rect")
    if not rect:
        return None
    return pymupdf.Rect(rect)


def find_card_headers(page):
    width = page.rect.width
    headers = []
    for drawing in page.get_drawings():
        rect = rect_of(drawing)
        fill = drawing.get("fill")
        if not rect or not fill:
            continue
        # Number cells use the distinctive orange fill at the far right.
        if not (0.78 < rect.x0 / width < 0.83 and 0.85 < rect.x1 / width < 0.90):
            continue
        if not (22 <= rect.height <= 60 and 25 <= rect.width <= 70):
            continue
        if not (fill[0] > 0.85 and fill[1] > 0.45 and fill[1] < 0.75 and fill[2] < 0.3):
            continue
        # Pair the orange number cell to the broad blue stem cell on the same row.
        matching = []
        for blue in page.get_drawings():
            blue_rect = rect_of(blue)
            blue_fill = blue.get("fill")
            if not blue_rect or not blue_fill:
                continue
            if abs(blue_rect.y0 - rect.y0) > 1.5 or abs(blue_rect.y1 - rect.y1) > 1.5:
                continue
            if not (blue_rect.width > width * 0.58 and blue_rect.x0 < width * 0.2 and blue_rect.x1 > width * 0.72):
                continue
            if not (blue_fill[2] > 0.5 and blue_fill[0] < 0.6 and blue_fill[1] < 0.65):
                continue
            matching.append(blue_rect)
        if matching:
            headers.append((rect, max(matching, key=lambda item: item.width)))

    unique = {}
    for number_rect, stem_rect in headers:
        key = (round(number_rect.y0, 1), round(number_rect.y1, 1))
        unique[key] = (number_rect, stem_rect)
    return sorted(unique.values(), key=lambda pair: pair[0].y0)


def clean_word(text):
    return text.strip().strip(".,:؛()[]{}")


def line_text(words):
    if not words:
        return ""
    rows = []
    for word in sorted(words, key=lambda item: (item[1], -item[0])):
        y = word[1]
        if not rows or abs(rows[-1][0] - y) > 3.5:
            rows.append([y, [word]])
        else:
            rows[-1][1].append(word)
    return "\n".join(
        " ".join(item[4] for item in sorted(row_words, key=lambda item: -item[0])).strip()
        for _, row_words in rows
    ).strip()


def extract_question(page, number_rect, stem_rect, next_header_top):
    words = page.get_text("words")
    # The printed item number is in the orange header cell.
    number_words = [
        word for word in words
        if number_rect.x0 <= word[0] <= number_rect.x1
        and number_rect.y0 - 1 <= word[1] <= number_rect.y1 + 1
        and re.fullmatch(r"\d{1,3}", clean_word(word[4]))
    ]
    if not number_words:
        return None
    question_number = int(clean_word(max(number_words, key=lambda item: len(clean_word(item[4])))[4]))

    stem_words = [
        word for word in words
        if stem_rect.x0 <= word[0] <= stem_rect.x1
        and stem_rect.y0 - 1 <= word[1] < stem_rect.y1 + 1
    ]
    text = line_text(stem_words)

    width = page.rect.width
    labels = {}
    expected_x = {
        "A": lambda x: x > width * 0.75,
        "B": lambda x: width * 0.40 < x < width * 0.52,
        "C": lambda x: x > width * 0.75,
        "D": lambda x: width * 0.40 < x < width * 0.52,
    }
    target_y = {"A": stem_rect.y1 + 13, "B": stem_rect.y1 + 13, "C": stem_rect.y1 + 58, "D": stem_rect.y1 + 58}
    for word in words:
        raw_label = clean_word(word[4])
        label = LABEL_ALIASES.get(raw_label)
        if not label or word[1] < stem_rect.y1 or word[1] > stem_rect.y1 + 85:
            continue
        if not expected_x[label](word[0]):
            continue
        if abs(word[1] - target_y[label]) > 24:
            continue
        previous = labels.get(label)
        if previous is None or abs(word[1] - target_y[label]) < abs(previous[1] - target_y[label]):
            labels[label] = word

    if set(labels) != {"A", "B", "C", "D"}:
        return None
    first_row_y = (labels["A"][1] + labels["B"][1]) / 2
    second_row_y = (labels["C"][1] + labels["D"][1]) / 2
    if second_row_y <= first_row_y:
        return None
    split_y = (first_row_y + second_row_y) / 2

    answer_words = [
        word for word in words
        if "الجواب" in word[4] and stem_rect.y1 < word[1] < next_header_top
    ]
    card_bottom = min((word[1] for word in answer_words), default=next_header_top)

    options = {}
    for label in "ABCD":
        row_top = stem_rect.y1 - 1 if label in "AB" else split_y
        row_bottom = split_y if label in "AB" else card_bottom
        if label in "AC":
            x_min, x_max = width * 0.50, width * 0.76
        else:
            x_min, x_max = stem_rect.x0, width * 0.46
        cell_words = [
            word for word in words
            if x_min <= word[0] < x_max
            and row_top <= word[1] < row_bottom
        ]
        options[label] = line_text(cell_words)

    if len(text) < 5 or any(not options[label] for label in "ABCD"):
        return None

    return {
        "sourceId": "",
        "sourceOrdinal": 0,
        "subject": "",
        "sourceQuestionNumber": question_number,
        "sourcePage": page.number + 1,
        "sourceBook": "",
        "text": text,
        "options": [options[label] for label in "ABCD"],
        "difficulty": "intermediate",
        "topic": "يحتاج تصنيفًا ومراجعة",
        # These PDFs use full-page scan backgrounds, so page-level image
        # detection cannot distinguish a question diagram from the page scan.
        # Reviewers must explicitly mark image-dependent questions.
        "requiresImage": False,
    }


def matching_label_rows(words, column_min, column_max, block_start, block_end):
    width = column_max - column_min
    labels = defaultdict(list)
    for word in words:
        label = LABEL_ALIASES.get(clean_word(word[4]))
        if not label or not (block_start + 8 <= word[1] < block_end):
            continue
        if label in "AC":
            in_label_column = word[0] >= column_max - 55
        else:
            in_label_column = column_min + width * 0.32 <= word[0] <= column_min + width * 0.58
        if in_label_column:
            labels[label].append(word)

    def paired_rows(first, second):
        pairs = []
        for left in labels[first]:
            for right in labels[second]:
                if abs(left[1] - right[1]) <= 3.5:
                    pairs.append((left[1] + right[1]) / 2)
        return sorted(set(round(value, 2) for value in pairs))

    first_rows = paired_rows("A", "B")
    second_rows = paired_rows("C", "D")
    for first_y in first_rows:
        later_rows = [row for row in second_rows if row > first_y + 5]
        if later_rows:
            return first_y, later_rows[0]
    return None


def extract_practice_biology_page(page, source_id, source_ordinal, source_title):
    words = page.get_text("words")
    width = page.rect.width
    height = page.rect.height
    question_tokens = {
        "right": [],
        "left": [],
    }
    for word in words:
        text = clean_word(word[4])
        if not re.fullmatch(r"\d{1,3}", text) or word[1] > height - 165:
            continue
        if word[0] > width * 0.88:
            question_tokens["right"].append((int(text), word))
        elif width * 0.42 <= word[0] <= width * 0.50:
            question_tokens["left"].append((int(text), word))

    result = []
    columns = {
        "right": (width * 0.54, width * 0.96),
        "left": (width * 0.06, width * 0.50),
    }
    for side, column_questions in question_tokens.items():
        column_min, column_max = columns[side]
        column_questions.sort(key=lambda item: item[1][1])
        for index, (question_number, number_word) in enumerate(column_questions):
            start = max(0, number_word[1] - 2)
            next_start = (
                column_questions[index + 1][1][1] - 4
                if index + 1 < len(column_questions)
                else height - 165
            )
            if next_start <= start:
                continue
            rows = matching_label_rows(words, column_min, column_max, start, next_start)
            if not rows:
                continue
            first_row_y, second_row_y = rows
            row1_limit = second_row_y - 4

            stem_words = [
                word for word in words
                if column_min <= word[0] <= column_max
                and start <= word[1] < first_row_y - 4
                and not (word[0] == number_word[0] and word[1] == number_word[1])
                and clean_word(word[4])
            ]
            text = line_text(stem_words)
            options = {}
            for label in "ABCD":
                row_top = first_row_y - 4 if label in "AB" else second_row_y - 4
                row_bottom = row1_limit if label in "AB" else next_start
                if label in "AC":
                    x_min = column_min + (column_max - column_min) * 0.40
                    x_max = column_max - 50
                else:
                    x_min = column_min
                    x_max = column_min + (column_max - column_min) * (0.32 if side == "right" else 0.42)
                cell_words = [
                    word for word in words
                    if x_min <= word[0] < x_max and row_top <= word[1] < row_bottom
                    and clean_word(word[4])
                    and not (
                        LABEL_ALIASES.get(clean_word(word[4])) in {"A", "C"}
                        and word[0] >= column_max - 55
                    )
                    and not (
                        LABEL_ALIASES.get(clean_word(word[4])) in {"B", "D"}
                        and column_min + (column_max - column_min) * 0.32
                        <= word[0]
                        <= column_min + (column_max - column_min) * 0.58
                    )
                ]
                options[label] = line_text(cell_words)
            if len(text) < 5 or any(not options[label] for label in "ABCD"):
                continue

            crop_rect = pymupdf.Rect(
                max(0, column_min - 4),
                max(0, start - 4),
                min(width, column_max + 4),
                min(height, next_start - 2),
            )
            crop_dir = OUTPUT.parent / "exam-crops"
            crop_dir.mkdir(parents=True, exist_ok=True)
            crop_path = crop_dir / (
                f"{source_id}-page-{page.number + 1:03d}-q-{question_number}.png"
            )
            page.get_pixmap(clip=crop_rect, matrix=pymupdf.Matrix(2, 2), alpha=False).save(crop_path)
            result.append({
                "sourceId": source_id,
                "sourceOrdinal": source_ordinal,
                "subject": "أحياء",
                "sourceQuestionNumber": question_number,
                "sourcePage": page.number + 1,
                "sourceBook": source_title,
                "text": text,
                "options": [options[label] for label in "ABCD"],
                "difficulty": "intermediate",
                "topic": "يحتاج تصنيفًا ومراجعة",
                "requiresImage": False,
                "sourceCropFile": str(crop_path.relative_to(ROOT)),
            })
    return result


def main():
    all_questions = []
    counts = {}
    for source_id, source_ordinal, subject, title, filename in SOURCES:
        document = pymupdf.open(ASSETS / filename)
        source_questions = []
        for page in document:
            headers = find_card_headers(page)
            for index, (number_rect, stem_rect) in enumerate(headers):
                next_top = headers[index + 1][0].y0 if index + 1 < len(headers) else page.rect.height - 30
                question = extract_question(page, number_rect, stem_rect, next_top)
                if not question:
                    continue
                page_words = page.get_text("words")
                answer_top = min(
                    (
                        word[1] for word in page_words
                        if "الجواب" in word[4] and stem_rect.y1 < word[1] < next_top
                    ),
                    default=next_top,
                )
                crop_rect = pymupdf.Rect(
                    max(0, stem_rect.x0 - 2),
                    max(0, number_rect.y0 - 2),
                    min(page.rect.width, number_rect.x1 + 2),
                    min(page.rect.height, max(stem_rect.y1 + 20, answer_top - 3)),
                )
                crop_dir = OUTPUT.parent / "exam-crops"
                crop_dir.mkdir(parents=True, exist_ok=True)
                crop_path = crop_dir / (
                    f"{source_id}-page-{page.number + 1:03d}-q-{question['sourceQuestionNumber']}.png"
                )
                page.get_pixmap(
                    clip=crop_rect,
                    matrix=pymupdf.Matrix(2, 2),
                    alpha=False,
                ).save(crop_path)
                question.update({
                    "sourceId": source_id,
                    "sourceOrdinal": source_ordinal,
                    "subject": subject,
                    "sourceBook": title,
                    "sourceCropFile": str(crop_path.relative_to(ROOT)),
                })
                source_questions.append(question)
        document.close()
        counts[source_id] = len(source_questions)
        all_questions.extend(source_questions)

    practice_source_id = "ghasham-practice-biology-period-1"
    practice_source_title = "تدريبات أ. غشّام — أحياء، الفترة الأولى"
    practice_document = pymupdf.open(
        ASSETS / "تدريبات_أ_غشام_الفترة_الأولى_الأحياء_1792016237165.pdf"
    )
    practice_questions = []
    for page in practice_document:
        practice_questions.extend(
            extract_practice_biology_page(page, practice_source_id, 10, practice_source_title)
        )
    practice_document.close()
    counts[practice_source_id] = len(practice_questions)
    all_questions.extend(practice_questions)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps({
        "questions": all_questions,
        "answerKeysImported": 0,
        "status": "pending_review",
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "candidateCount": len(all_questions),
        "sources": counts,
        "answerKeysImported": 0,
        "output": str(OUTPUT.relative_to(ROOT)),
        "samples": [
            {
                "source": question["sourceId"],
                "page": question["sourcePage"],
                "number": question["sourceQuestionNumber"],
                "text": question["text"][:100],
                "options": [option[:60] for option in question["options"]],
            }
            for question in all_questions[:5]
        ],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
