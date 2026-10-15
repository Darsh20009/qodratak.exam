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
STAGING = ROOT / "generated-artifacts/quantitative-banks-71-90/source-images"
OUTPUT = ROOT / "generated-artifacts/quantitative-banks-71-90/review-draft.json"
FIRST_BANK = 71
LAST_BANK = 90
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


def question_image_xref(page: pymupdf.Page) -> tuple[int, str]:
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
        (width * height, xref, name)
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
                    candidates.append((image[2] * image[3], xref, image[7]))
    if not candidates:
        raise RuntimeError("Could not locate the question image on a PDF page")

    _, xref, name = max(candidates)
    question_placement = any(
        rect.width > 300
        and rect.height > 100
        and rect.y0 > 100
        and rect.y1 < 700
        for rect in page.get_image_rects(xref)
    )
    if not question_placement:
        raise RuntimeError("Selected image is not placed in the question area")
    return xref, name


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
    banks = []

    # Validate every source before extracting any image bytes.
    for number in range(FIRST_BANK, LAST_BANK + 1):
        pdf_path = pdf_by_number[number]
        document = pymupdf.open(pdf_path)
        if len(document) != 49:
            raise RuntimeError(
                f"Bank {number} should contain a cover and 48 questions; "
                f"found {len(document)} pages"
            )

        cover_text = normalize_text(document[0].get_text("text"))
        if "يمنع" not in cover_text or "توزيع" not in cover_text:
            raise RuntimeError(
                f"Bank {number} does not contain the expected copyright restriction; "
                "stop and review the source manually."
            )

        questions = []
        for question_number in range(1, 49):
            page = document[question_number]
            correct_index, answer_token = answer_from_page(page)
            image_xref, image_name = question_image_xref(page)
            image = document.extract_image(image_xref)
            if image["ext"] not in {"jpg", "jpeg", "png", "webp"}:
                raise RuntimeError(
                    f"Unsupported image format in bank {number}, "
                    f"question {question_number}: {image['ext']}"
                )
            if image["width"] < 500 or image["height"] < 250:
                raise RuntimeError(
                    f"Extracted image seems too small in bank {number}, "
                    f"question {question_number}: {image['width']}x{image['height']}"
                )
            questions.append({
                "questionNumber": question_number,
                "sourcePage": question_number + 1,
                "imageXref": image_xref,
                "imageResourceName": image_name,
                "imageExt": image["ext"],
                "imageWidth": image["width"],
                "imageHeight": image["height"],
                "imageSha256": sha256(image["image"]),
                "correctOptionIndex": correct_index,
                "printedAnswerToken": answer_token,
                "answerStatus": "printed_key_not_independently_verified",
            })

        banks.append({
            "number": number,
            "sourcePdf": normalize_filename(pdf_path.name),
            "sourcePdfSha256": sha256(pdf_path.read_bytes()),
            "pages": len(document),
            "questionCount": len(questions),
            "copyrightNotice": cover_text,
            "rightsStatus": "user_confirmed_permission_for_publication_and_watermark_edits",
            "publicationStatus": "private_processing_draft",
            "questions": questions,
        })
        pending[number] = questions
        document.close()

    # Extract only each embedded question image, never the full solved PDF pages.
    for number in range(FIRST_BANK, LAST_BANK + 1):
        document = pymupdf.open(pdf_by_number[number])
        for item in pending[number]:
            question_number = int(item["questionNumber"])
            image = document.extract_image(int(item["imageXref"]))
            if sha256(image["image"]) != item["imageSha256"]:
                raise RuntimeError(
                    f"Image changed during extraction: bank {number}, "
                    f"question {question_number}"
                )
            target = (
                STAGING
                / f"exam-{number:02d}"
                / f"question-{question_number:03d}.{item['imageExt']}"
            )
            if target.exists():
                if target.read_bytes() != image["image"]:
                    raise RuntimeError(f"Refusing to replace different draft image: {target}")
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(image["image"])
        document.close()

    output_bytes = json.dumps(
        {
            "schemaVersion": 1,
            "purpose": "private processing draft; not student-facing until image and key validation completes",
            "rightsNotice": (
                "The user explicitly confirmed permission to publish banks 71–90 "
                "and edit/remove watermarks. Keep this draft private until processing "
                "and validation are complete."
            ),
            "banks": banks,
        },
        ensure_ascii=False,
        indent=2,
    ).encode("utf-8")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    if OUTPUT.exists() and OUTPUT.read_bytes() != output_bytes:
        raise RuntimeError(f"Refusing to replace a different review manifest: {OUTPUT}")
    if not OUTPUT.exists():
        OUTPUT.write_bytes(output_bytes)

    print(json.dumps({
        "banks": len(banks),
        "questions": sum(len(bank["questions"]) for bank in banks),
        "questionImagesExtracted": sum(len(qs) for qs in pending.values()),
        "uniqueAnswerKeysParsed": sum(
            len({question["printedAnswerToken"] for question in bank["questions"]})
            for bank in banks
        ),
        "published": False,
        "manifest": str(OUTPUT.relative_to(ROOT)),
        "imageRoot": str(STAGING.relative_to(ROOT)),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
