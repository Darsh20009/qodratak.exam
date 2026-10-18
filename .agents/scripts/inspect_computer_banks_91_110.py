from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

import pymupdf
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
ATTACHED = ROOT / "attached_assets"
OUTPUT = ROOT / "generated-artifacts/quantitative-banks-91-110/inspection"
FIRST_BANK = 91
LAST_BANK = 110


def normalized_filename(value: str) -> str:
    value = unicodedata.normalize("NFKC", value)
    return "".join(char for char in value if unicodedata.category(char) != "Cf")


def bank_number(filename: str) -> int | None:
    normalized = normalized_filename(filename)
    normalized = "".join(
        str(unicodedata.digit(char)) if char.isdigit() else char
        for char in normalized
    )
    numbers = [int(item) for item in re.findall(r"\d+", normalized)]
    return next(
        (number for number in numbers if FIRST_BANK <= number <= LAST_BANK),
        None,
    )


def render(page: pymupdf.Page, target: Path) -> None:
    page.get_pixmap(matrix=pymupdf.Matrix(1.0, 1.0), alpha=False).save(target)


def make_contact_sheet(records: list[dict], key: str, target: Path) -> None:
    columns = 4
    cell_width, cell_height = 320, 400
    rows = (len(records) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_width, rows * cell_height), "white")
    draw = ImageDraw.Draw(sheet)
    for index, record in enumerate(records):
        image = Image.open(record[key]).convert("RGB")
        image.thumbnail((cell_width - 12, cell_height - 42))
        x = (index % columns) * cell_width
        y = (index // columns) * cell_height
        sheet.paste(image, (x + (cell_width - image.width) // 2, y + 30))
        draw.text((x + 8, y + 7), f"Bank {record['number']}", fill="black")
    sheet.save(target, quality=88)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    matches: dict[int, list[Path]] = {}
    for path in ATTACHED.glob("*179230*.pdf"):
        number = bank_number(path.name)
        if number is not None:
            matches.setdefault(number, []).append(path)

    expected = set(range(FIRST_BANK, LAST_BANK + 1))
    missing = sorted(expected - matches.keys())
    duplicates = {
        number: [path.name for path in paths]
        for number, paths in matches.items()
        if len(paths) > 1
    }
    if missing or duplicates:
        raise RuntimeError(
            json.dumps({"missing": missing, "duplicates": duplicates}, ensure_ascii=False)
        )

    records = []
    for number in range(FIRST_BANK, LAST_BANK + 1):
        pdf_path = matches[number][0]
        document = pymupdf.open(pdf_path)
        sample_indexes = sorted({0, min(1, len(document) - 1), len(document) // 2, len(document) - 1})
        sample_paths: dict[int, str] = {}
        for page_index in sample_indexes:
            target = OUTPUT / f"bank-{number:03d}-page-{page_index + 1:03d}.png"
            render(document[page_index], target)
            sample_paths[str(page_index + 1)] = str(target.relative_to(ROOT))

        answer_key_mentions = 0
        pages_with_images = 0
        text_characters = 0
        samples = {}
        for page_index, page in enumerate(document):
            text = page.get_text("text").strip()
            text_characters += len(text)
            if "الإجابة الصحيحة" in text or "الاجابة الصحيحة" in text:
                answer_key_mentions += 1
            if page.get_images(full=True):
                pages_with_images += 1
            if page_index in sample_indexes:
                samples[str(page_index + 1)] = text[:700]

        records.append({
            "number": number,
            "file": pdf_path.name,
            "bytes": pdf_path.stat().st_size,
            "pages": len(document),
            "pagesWithImages": pages_with_images,
            "answerKeyMentions": answer_key_mentions,
            "textCharacters": text_characters,
            "samplePages": sample_paths,
            "sampleText": samples,
        })
        document.close()

    manifest = {
        "purpose": "private source inspection; not imported or published",
        "banks": records,
    }
    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    for label, key in (
        ("covers", "cover"),
        ("first-questions", "firstQuestion"),
        ("last-pages", "lastPage"),
    ):
        for record in records:
            page_number = (
                1 if label == "covers"
                else 2 if label == "first-questions"
                else record["pages"]
            )
            path = record["samplePages"].get(str(page_number))
            if path is None:
                continue
            record[key] = str(ROOT / path)
        make_contact_sheet(records, key, OUTPUT / f"{label}-contact-sheet.jpg")

    print(json.dumps([
        {
            "bank": record["number"],
            "file": record["file"],
            "pages": record["pages"],
            "pagesWithImages": record["pagesWithImages"],
            "answerKeyMentions": record["answerKeyMentions"],
            "bytes": record["bytes"],
        }
        for record in records
    ], ensure_ascii=False, indent=2))
    print(f"Private inspection output: {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
