from __future__ import annotations

import json
import os
import re
import filecmp
import shutil
import unicodedata
from pathlib import Path

import fitz


ROOT = Path(".")
ATTACHED = ROOT / "attached_assets"
PUBLIC = ROOT / "artifacts/qodratak/public/foundation/quantitative/computer-banks"
OUTPUT = ROOT / ".agents/outputs/quantitative-computer-banks/computer-banks-11-30.json"
VIDEO_TIMESTAMPS = ROOT / ".agents/outputs/quantitative-computer-banks/video-timestamps.json"
PUBLIC.mkdir(parents=True, exist_ok=True)
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

EXPECTED_BANKS = [number for number in range(11, 31) if number not in {15, 23}]
VIDEO_ONLY_BANKS = {15, 23}
ARABIC_OPTIONS = {"أ": 0, "ا": 0, "إ": 0, "آ": 0, "ب": 1, "ج": 2, "د": 3}
WATERMARK_RE = re.compile(r"^\s*(?:521299|7065620710|\d[\d\s]{5,})\s*$")


def normalize(value: str) -> str:
    return (
        unicodedata.normalize("NFKC", value or "")
        .replace("\u200f", " ")
        .replace("\u200e", " ")
    )


def normalize_filename(value: str) -> str:
    return "".join(
        char for char in unicodedata.normalize("NFKC", value)
        if unicodedata.category(char) != "Cf"
    )


def exam_number(path: Path) -> int | None:
    match = re.search(r"اختبار[_\s-]*(\d+).*?محلول", normalize_filename(path.name))
    return int(match.group(1)) if match else None


def question_image_xref(page: fitz.Page) -> int:
    document = page.parent
    used_names = set()
    for content_xref in page.get_contents():
        used_names.update(
            name.decode("ascii")
            for name in re.findall(
                rb"/([\w.+-]+)\s+Do\b",
                document.xref_stream(content_xref),
            )
        )

    image_by_name = {
        image[7]: (image[0], image[2], image[3])
        for image in page.get_images(full=True)
    }
    referenced = [
        (width * height, xref)
        for name, (xref, width, height) in image_by_name.items()
        if name in used_names
    ]
    if referenced:
        return max(referenced)[1]

    # Some PDFs draw images through nested form XObjects rather than directly
    # in the page stream; retain the slower placement-based fallback for those.
    candidates = []
    for image in page.get_images(full=True):
        xref = image[0]
        for rect in page.get_image_rects(xref):
            if rect.width > 300 and rect.height > 100 and rect.y0 > 100 and rect.y1 < 700:
                candidates.append((rect.width * rect.height, xref))
    if not candidates:
        raise RuntimeError("Could not locate the question image on a PDF page")
    return max(candidates)[1]


def answer_from_page(page: fitz.Page) -> tuple[int | None, str | None]:
    text = normalize(page.get_text("text"))
    match = re.search(r"الإجابة الصحيحة\s*[:：]?\s*([^\s\n|]+)", text)
    if not match:
        return None, None
    token = match.group(1).strip()
    return ARABIC_OPTIONS.get(token), token


def link_or_copy(source: Path, target: Path) -> None:
    if target.exists():
        if os.path.samefile(source, target):
            return
        if source.stat().st_size != target.stat().st_size or not filecmp.cmp(
            source, target, shallow=False
        ):
            raise RuntimeError(f"Refusing to replace a different video asset: {target}")
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    try:
        os.link(source, target)
    except OSError:
        shutil.copyfile(source, target)


def main() -> None:
    pdf_by_number = {
        number: path
        for path in ATTACHED.glob("*.pdf")
        if (number := exam_number(path)) is not None
    }
    missing = [number for number in EXPECTED_BANKS if number not in pdf_by_number]
    if missing:
        raise RuntimeError(f"Missing solved quantitative bank PDFs: {missing}")

    video_files = sorted(ATTACHED.glob("FILE_1448-04-17_*.mp4"))
    if len(video_files) != 20:
        raise RuntimeError(
            f"Expected 20 quantitative bank videos in upload order; found {len(video_files)}"
        )
    timestamp_payload = json.loads(VIDEO_TIMESTAMPS.read_text(encoding="utf-8"))
    timestamp_by_bank = {
        bank["number"]: bank for bank in timestamp_payload.get("banks", [])
    }
    missing_video_timestamps = [
        number for number in range(11, 31) if number not in timestamp_by_bank
    ]
    if missing_video_timestamps:
        raise RuntimeError(
            f"Missing video timestamp metadata for banks: {missing_video_timestamps}"
        )

    pdf_timestamps = {}
    for number in EXPECTED_BANKS:
        rows = timestamp_by_bank[number].get("questionTimestamps", [])
        pdf_timestamps[number] = {
            item["questionNumber"]: item
            for item in rows
            if isinstance(item.get("questionNumber"), int)
        }
        missing_questions = [
            question_number
            for question_number in range(1, 49)
            if question_number not in pdf_timestamps[number]
        ]
        if missing_questions:
            raise RuntimeError(
                f"Missing video timestamps for bank {number}: {missing_questions}"
            )

    banks = []
    for number in range(11, 31):
        video_metadata = timestamp_by_bank[number]
        video_path = video_files[number - 11]
        video_target = PUBLIC / f"computer-bank-{number:02d}.mp4"
        link_or_copy(video_path, video_target)
        video = {
            "url": video_metadata["videoUrl"],
            "originalName": video_path.name,
            "bytes": video_target.stat().st_size,
            "durationSeconds": video_metadata["durationSeconds"],
        }

        bank = {
            "number": number,
            "video": video,
            "pdf": None,
            "attachment": None,
            "questions": [],
        }
        if number in VIDEO_ONLY_BANKS:
            banks.append(bank)
            continue

        pdf_path = pdf_by_number[number]
        document = fitz.open(pdf_path)
        if len(document) != 49:
            raise RuntimeError(
                f"Bank {number} should contain a cover and 48 questions; found {len(document)} pages"
            )

        pdf_target = PUBLIC / f"exam-{number:02d}.pdf"
        shutil.copyfile(pdf_path, pdf_target)
        attachment = {
            "id": f"qudrat-quantitative-computer-bank-{number:02d}",
            "type": "pdf",
            "title": f"اختبار بنك الكمي المحوسب {number} — النسخة المحلولة",
            "url": f"/foundation/quantitative/computer-banks/exam-{number:02d}.pdf",
            "originalName": normalize_filename(pdf_path.name),
            "contentType": "application/pdf",
            "bytes": pdf_target.stat().st_size,
        }

        pending_questions = []
        for question_number in range(1, 49):
            page = document[question_number]
            xref = question_image_xref(page)
            image_data = document.extract_image(xref)
            image_target = (
                PUBLIC
                / f"exam-{number:02d}"
                / f"question-{question_number:03d}.{image_data['ext']}"
            )
            image_target.parent.mkdir(parents=True, exist_ok=True)
            image_target.write_bytes(image_data["image"])
            correct_index, answer_token = answer_from_page(page)
            pending_questions.append({
                "questionNumber": question_number,
                "imageExt": image_data["ext"],
                "correctIndex": correct_index,
                "answerToken": answer_token,
            })

        questions = []
        for item in pending_questions:
            question_number = item["questionNumber"]
            image_url = (
                f"/foundation/quantitative/computer-banks/exam-{number:02d}/"
                f"question-{question_number:03d}.{item['imageExt']}"
            )
            questions.append({
                "examNumber": number,
                "questionNumber": question_number,
                "videoTimestampSeconds": pdf_timestamps[number][question_number]["seconds"],
                "videoTimestampInferred": pdf_timestamps[number][question_number]["inferred"],
                "text": (
                    f"السؤال {question_number} من بنك الكمي المحوسب {number}. "
                    "النص والخيارات محفوظة في صورة السؤال."
                ),
                "options": ["أ", "ب", "ج", "د"],
                "correctOptionIndex": item["correctIndex"] if item["correctIndex"] is not None else 0,
                "answerToken": item["answerToken"],
                "answerStatus": "approved" if item["correctIndex"] is not None else "review",
                "subcategory": "بنوك محوسبة",
                "imageUrl": image_url,
                "imageUrls": [image_url],
                "sourcePdf": normalize_filename(pdf_path.name),
            })
        document.close()

        bank.update({
            "pdf": normalize_filename(pdf_path.name),
            "attachment": attachment,
            "questions": questions,
        })
        banks.append(bank)

    OUTPUT.write_text(json.dumps({"banks": banks}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "banks": len(banks),
        "questions": sum(len(bank["questions"]) for bank in banks),
        "approved": sum(
            question["answerStatus"] == "approved"
            for bank in banks for question in bank["questions"]
        ),
        "review": sum(
            question["answerStatus"] != "approved"
            for bank in banks for question in bank["questions"]
        ),
        "videoLinkedBanks": sum(bool(bank["video"]) for bank in banks),
        "videoOnlyBanks": [
            bank["number"] for bank in banks
            if bank["number"] in VIDEO_ONLY_BANKS
            and not bank["attachment"]
            and not bank["questions"]
        ],
        "output": str(OUTPUT),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()