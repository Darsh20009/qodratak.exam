from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

import pymupdf


ROOT = Path(__file__).resolve().parents[2]
ATTACHED = ROOT / "attached_assets"
STAGING = ROOT / "generated-artifacts/computer-banks-51-70"
OUTPUT = ROOT / ".agents/outputs/quantitative-computer-banks/computer-banks-51-70.json"
FIRST_BANK = 51
LAST_BANK = 70
ARABIC_OPTIONS = {"أ": 0, "ا": 0, "إ": 0, "آ": 0, "ب": 1, "ج": 2, "د": 3}
STRICT_BANK_RE = re.compile(r"^اختبار[\s_-]*(\d+).*?محلول")


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
    matches: dict[int, list[Path]] = defaultdict(list)
    for path in ATTACHED.glob("*.pdf"):
        match = STRICT_BANK_RE.search(normalize_filename(path.name))
        if match:
            number = int(match.group(1))
            if FIRST_BANK <= number <= LAST_BANK:
                matches[number].append(path)

    missing = [number for number in range(FIRST_BANK, LAST_BANK + 1) if not matches[number]]
    if missing:
        raise RuntimeError(f"Missing solved quantitative bank PDFs: {missing}")

    result: dict[int, Path] = {}
    for number, paths in matches.items():
        hashes = {sha256(path.read_bytes()) for path in paths}
        if len(hashes) != 1:
            raise RuntimeError(
                f"Conflicting PDFs matched bank {number}: {[path.name for path in paths]}"
            )
        result[number] = sorted(paths, key=lambda path: normalize_filename(path.name))[0]
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
    candidates = referenced
    if not candidates:
        candidates = []
        for image in page.get_images(full=True):
            xref = image[0]
            for rect in page.get_image_rects(xref):
                if (
                    rect.width > 300
                    and rect.height > 100
                    and rect.y0 > 100
                    and rect.y1 < 700
                ):
                    candidates.append((rect.width * rect.height, xref))
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
        raise RuntimeError(f"Expected one printed answer key, found {len(matches)}")
    token = matches[0].strip()
    if token not in ARABIC_OPTIONS:
        raise RuntimeError(f"Unrecognized printed answer token: {token!r}")
    return ARABIC_OPTIONS[token], token


def main() -> None:
    pdf_by_number = find_bank_pdfs()
    pending: dict[int, list[dict[str, object]]] = {}

    # Validate every page, image placement, and printed answer before writing any assets.
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
            question_number = int(item["questionNumber"])
            image_url = str(item["imageUrl"])
            questions.append({
                "examNumber": number,
                "questionNumber": question_number,
                "text": (
                    f"السؤال {question_number} من بنك الكمي المحوسب {number}. "
                    "النص والخيارات محفوظة في صورة السؤال."
                ),
                "options": ["أ", "ب", "ج", "د"],
                "correctOptionIndex": item["correctOptionIndex"],
                "answerToken": item["answerToken"],
                "answerStatus": "approved",
                "subcategory": "بنوك محوسبة",
                "imageUrl": image_url,
                "imageUrls": [image_url],
                "sourcePdf": normalize_filename(pdf_path.name),
            })
        banks.append({
            "number": number,
            "video": None,
            "pdf": normalize_filename(pdf_path.name),
            # Source PDFs contain answer keys; only the individual prompt images
            # are student-facing, never the solved PDF.
            "attachment": None,
            "questions": questions,
        })

    payload = {"banks": banks}
    output_bytes = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
    if OUTPUT.exists() and OUTPUT.read_bytes() != output_bytes:
        raise RuntimeError(f"Refusing to replace a different import manifest: {OUTPUT}")

    # Store only the embedded question image, not the full page or answer-key strip.
    for number in range(FIRST_BANK, LAST_BANK + 1):
        document = pymupdf.open(pdf_by_number[number])
        for item in pending[number]:
            question_number = int(item["questionNumber"])
            image = document.extract_image(int(item["imageXref"]))
            target = (
                STAGING
                / f"exam-{number:02d}"
                / f"question-{question_number:03d}.{item['imageExt']}"
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
        "manifest": str(OUTPUT.relative_to(ROOT)),
        "staging": str(STAGING.relative_to(ROOT)),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
