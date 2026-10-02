from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

import pymupdf


ROOT = Path(".")
ATTACHED = ROOT / "attached_assets"
PUBLIC = ROOT / "artifacts/qodratak/public/foundation/quantitative/computer-banks"
OUTPUT = ROOT / ".agents/outputs/quantitative-computer-banks/computer-banks-31-50.json"

FIRST_BANK = 31
LAST_BANK = 50
ARABIC_OPTIONS = {"أ": 0, "ا": 0, "إ": 0, "آ": 0, "ب": 1, "ج": 2, "د": 3}
STRICT_BANK_RE = re.compile(r"^اختبار[\s_-]*(\d+).*?محلول")
LOOSE_BANK_RE = re.compile(r"اختبار[\s_-]*(\d+).*?محلول")
VIDEO_METADATA = {
    31: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-31.mp4",
        "originalName": "FILE_1448-04-18_18:06:55_1790694416593.mp4",
        "bytes": 483959777,
        "durationSeconds": 3575.916667,
    },
    32: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-32.mp4",
        "originalName": "FILE_1448-04-18_18:06:57_1790694418088.mp4",
        "bytes": 860463352,
        "durationSeconds": 4375.041667,
    },
    33: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-33.mp4",
        "originalName": "FILE_1448-04-18_18:06:58_1790694419387.mp4",
        "bytes": 677987945,
        "durationSeconds": 2976.5,
    },
    34: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-34.mp4",
        "originalName": "FILE_1448-04-18_18:07:01_1790694422161.mp4",
        "bytes": 264491545,
        "durationSeconds": 3114.412667,
    },
    35: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-35.mp4",
        "originalName": "FILE_1448-04-18_18:07:02_1790694423474.mp4",
        "bytes": 262403835,
        "durationSeconds": 3334.379333,
    },
    36: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-36.mp4",
        "originalName": "IMG_5742_1790717396469.MP4",
        "bytes": 295681760,
        "durationSeconds": 3227.866667,
    },
    37: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-37.mp4",
        "originalName": "IMG_5743_1790717397819.MP4",
        "bytes": 318137102,
        "durationSeconds": 2851.2,
    },
    38: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-38.mp4",
        "originalName": "video-output-56DD8CC2-5990-42EF-9F6F-8899270B1242_1790717399449.mp4",
        "bytes": 701859598,
        "durationSeconds": 3682.791667,
    },
    39: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-39.mp4",
        "originalName": "video-output-5EEF4115-0EAB-4648-92D3-D059A38FCF07_1790717400891.mp4",
        "bytes": 628572691,
        "durationSeconds": 3761.666667,
    },
    40: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-40.mp4",
        "originalName": "video-output-17340075-88F3-4D6E-A580-55E0A3E2EE2C_1790717411478.mp4",
        "bytes": 474057773,
        "durationSeconds": 3002.916667,
    },
    41: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-41.mp4",
        "originalName": "video-output-CF6E4735-A12D-4117-92C0-461701D5F827_1790717833937.mp4",
        "bytes": 738640098,
        "durationSeconds": 3100,
    },
    42: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-42.mp4",
        "originalName": "video-output-6087CA3C-7B85-48FC-A222-967C7813221C_1790717835527.mp4",
        "bytes": 569085876,
        "durationSeconds": 3180.458333,
    },
    43: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-43.mp4",
        "originalName": "video-output-9B9342DD-7DA5-4333-915F-2B34A7C42008_1790717837684.mp4",
        "bytes": 556034706,
        "durationSeconds": 3348.083333,
    },
    44: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-44.mp4",
        "originalName": "video-output-E66E3D08-DE54-46DB-AB08-A3FEAF982E38_1790717840395.mp4",
        "bytes": 549332539,
        "durationSeconds": 3216.333333,
    },
    45: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-45.mp4",
        "originalName": "video-output-0C60F0EF-6F91-497E-869E-9E6DD322826A_1790717841891.mp4",
        "bytes": 560297148,
        "durationSeconds": 3339.625,
    },
    46: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-46.mp4",
        "originalName": "FILE_1448-04-19_01:41:31_1790721691943.mp4",
        "bytes": 585988693,
        "durationSeconds": 2973.096022,
    },
    47: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-47.mp4",
        "originalName": "IMG_9648_1790721693474.MOV",
        "bytes": 704587527,
        "durationSeconds": 3204.655,
    },
    48: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-48.mp4",
        "originalName": "IMG_9653_1790721695530.MOV",
        "bytes": 392658511,
        "durationSeconds": 2394.3,
    },
    49: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-49.mp4",
        "originalName": "مقطع_49_بعد_التعديل_1790721697597.mp4",
        "bytes": 273588162,
        "durationSeconds": 3746.033333,
    },
    50: {
        "url": "/foundation/quantitative/computer-banks/computer-bank-50.mp4",
        "originalName": "مقطع_50بعد_1790721705140.mp4",
        "bytes": 224869115,
        "durationSeconds": 3360.966667,
    },
}


def normalize_filename(value: str) -> str:
    return "".join(
        char
        for char in unicodedata.normalize("NFKC", value)
        if unicodedata.category(char) != "Cf"
    )


def normalize_text(value: str) -> str:
    return (
        unicodedata.normalize("NFKC", value or "")
        .replace("\u200e", " ")
        .replace("\u200f", " ")
    )


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def find_bank_pdfs() -> dict[int, Path]:
    strict_matches: dict[int, list[Path]] = defaultdict(list)
    loose_matches: dict[int, list[Path]] = defaultdict(list)

    for path in ATTACHED.glob("*.pdf"):
        name = normalize_filename(path.name)
        loose_match = LOOSE_BANK_RE.search(name)
        if loose_match:
            number = int(loose_match.group(1))
            if FIRST_BANK <= number <= LAST_BANK:
                loose_matches[number].append(path)

        strict_match = STRICT_BANK_RE.search(name)
        if strict_match:
            number = int(strict_match.group(1))
            if FIRST_BANK <= number <= LAST_BANK:
                strict_matches[number].append(path)

    missing = [
        number
        for number in range(FIRST_BANK, LAST_BANK + 1)
        if not strict_matches[number]
    ]
    if missing:
        raise RuntimeError(f"Missing solved quantitative bank PDFs: {missing}")

    result: dict[int, Path] = {}
    for number in range(FIRST_BANK, LAST_BANK + 1):
        strict = sorted(strict_matches[number], key=lambda path: normalize_filename(path.name))
        loose = loose_matches[number]
        strict_hashes = {sha256(path.read_bytes()) for path in strict}
        loose_hashes = {sha256(path.read_bytes()) for path in loose}
        if len(strict_hashes) != 1 or len(loose_hashes) != 1:
            raise RuntimeError(
                f"Conflicting PDF files matched bank {number}: "
                f"{[path.name for path in loose]}"
            )
        result[number] = strict[0]

    return result


def question_image_xref(page: pymupdf.Page) -> int:
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
        xref = max(referenced)[1]
    else:
        # Some PDFs place the question image inside a nested form XObject.
        candidates = []
        for image in page.get_images(full=True):
            image_xref = image[0]
            for rect in page.get_image_rects(image_xref):
                if (
                    rect.width > 300
                    and rect.height > 100
                    and rect.y0 > 100
                    and rect.y1 < 700
                ):
                    candidates.append((rect.width * rect.height, image_xref))
        if not candidates:
            raise RuntimeError("Could not locate the question image on a PDF page")
        xref = max(candidates)[1]

    question_placement = any(
        rect.width > 300
        and rect.height > 100
        and rect.y0 > 100
        and rect.y1 < 700
        for rect in page.get_image_rects(xref)
    )
    if not question_placement:
        raise RuntimeError("Selected image is not placed in the question area")
    return xref


def answer_from_page(page: pymupdf.Page) -> tuple[int, str]:
    text = normalize_text(page.get_text("text"))
    matches = re.findall(r"الإجابة الصحيحة\s*[:：]?\s*([^\s\n|]+)", text)
    if len(matches) != 1:
        raise RuntimeError(
            f"Expected one printed answer key, found {len(matches)}"
        )
    token = matches[0].strip()
    if token not in ARABIC_OPTIONS:
        raise RuntimeError(f"Unrecognized printed answer token: {token!r}")
    return ARABIC_OPTIONS[token], token


def main() -> None:
    pdf_by_number = find_bank_pdfs()
    for number, video in VIDEO_METADATA.items():
        source_video = ATTACHED / str(video["originalName"])
        if not source_video.is_file() or source_video.stat().st_size != video["bytes"]:
            raise RuntimeError(f"Missing or changed source video for bank {number}: {source_video}")

    pending: dict[int, list[dict[str, object]]] = {}

    # Validate all banks and answer keys before creating or changing any assets.
    for number in range(FIRST_BANK, LAST_BANK + 1):
        document = pymupdf.open(pdf_by_number[number])
        if len(document) != 49:
            raise RuntimeError(
                f"Bank {number} should contain a cover and 48 questions; "
                f"found {len(document)} pages"
            )

        questions = []
        for question_number in range(1, 49):
            page = document[question_number]
            correct_index, answer_token = answer_from_page(page)
            image_xref = question_image_xref(page)
            image = document.extract_image(image_xref)
            if image["ext"] not in {"jpg", "jpeg", "png", "webp"}:
                raise RuntimeError(
                    f"Unsupported image format in bank {number}, question "
                    f"{question_number}: {image['ext']}"
                )

            image_url = (
                f"/foundation/quantitative/computer-banks/exam-{number:02d}/"
                f"question-{question_number:03d}.{image['ext']}"
            )
            questions.append({
                "questionNumber": question_number,
                "imageXref": image_xref,
                "imageExt": image["ext"],
                "correctOptionIndex": correct_index,
                "answerToken": answer_token,
                "imageUrl": image_url,
            })
        document.close()
        pending[number] = questions

    banks = []
    for number in range(FIRST_BANK, LAST_BANK + 1):
        pdf_path = pdf_by_number[number]
        questions = []
        for item in pending[number]:
            questions.append({
                "examNumber": number,
                "questionNumber": item["questionNumber"],
                "text": (
                    f"السؤال {item['questionNumber']} من بنك الكمي المحوسب {number}. "
                    "النص والخيارات محفوظة في صورة السؤال."
                ),
                "options": ["أ", "ب", "ج", "د"],
                "correctOptionIndex": item["correctOptionIndex"],
                "answerToken": item["answerToken"],
                "answerStatus": "approved",
                "subcategory": "بنوك محوسبة",
                "imageUrl": item["imageUrl"],
                "imageUrls": [item["imageUrl"]],
                "sourcePdf": normalize_filename(pdf_path.name),
            })

        banks.append({
            "number": number,
            "video": VIDEO_METADATA.get(number),
            "pdf": normalize_filename(pdf_path.name),
            # The source PDFs are solved; do not expose their answer-key footers
            # as student-facing attachments.
            "attachment": None,
            "questions": questions,
        })

    payload = {"banks": banks}
    output_bytes = json.dumps(
        payload,
        ensure_ascii=False,
        indent=2,
    ).encode("utf-8")
    if OUTPUT.exists() and OUTPUT.read_bytes() != output_bytes:
        raise RuntimeError(f"Refusing to replace a different import manifest: {OUTPUT}")

    # Extract only the embedded question image, not the full page or answer strip.
    for number in range(FIRST_BANK, LAST_BANK + 1):
        document = pymupdf.open(pdf_by_number[number])
        for item in pending[number]:
            page = document[item["questionNumber"]]
            image = document.extract_image(item["imageXref"])
            target = (
                PUBLIC
                / f"exam-{number:02d}"
                / f"question-{item['questionNumber']:03d}.{item['imageExt']}"
            )
            if target.exists():
                if target.read_bytes() != image["image"]:
                    raise RuntimeError(f"Refusing to replace a different image: {target}")
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(image["image"])
        document.close()

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    if not OUTPUT.exists():
        OUTPUT.write_bytes(output_bytes)

    print(json.dumps({
        "banks": len(banks),
        "questions": sum(len(bank["questions"]) for bank in banks),
        "approvedAnswers": sum(
            question["answerStatus"] == "approved"
            for bank in banks
            for question in bank["questions"]
        ),
        "studentFacingSolvedPdfs": 0,
        "manifest": str(OUTPUT),
        "imageRoot": str(PUBLIC),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()