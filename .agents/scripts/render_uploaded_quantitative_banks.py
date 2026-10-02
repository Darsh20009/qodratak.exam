from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

import fitz
from PIL import Image, ImageDraw


ATTACHED = Path("attached_assets")
OUTPUT = Path(".agents/outputs/uploaded-quantitative-banks")
OUTPUT.mkdir(parents=True, exist_ok=True)


def normalized_name(name: str) -> str:
    return "".join(
        char for char in unicodedata.normalize("NFKC", name)
        if unicodedata.category(char) != "Cf"
    )


def bank_number(name: str) -> int | None:
    match = re.search(r"اختبار[_\s-]*(\d+).*?محلول", normalized_name(name))
    return int(match.group(1)) if match else None


def render_page(page: fitz.Page, target: Path) -> None:
    page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False).save(target)


def make_contact_sheet(records: list[dict], image_key: str, output: Path) -> None:
    columns = 6
    cell_width, cell_height = 260, 350
    rows = (len(records) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_width, rows * cell_height), "white")
    draw = ImageDraw.Draw(sheet)
    for index, record in enumerate(records):
        image = Image.open(record[image_key]).convert("RGB")
        image.thumbnail((cell_width - 12, cell_height - 42))
        x = (index % columns) * cell_width
        y = (index // columns) * cell_height
        sheet.paste(image, (x + (cell_width - image.width) // 2, y + 30))
        draw.text((x + 8, y + 7), f"Bank {record['number']}", fill="black")
    sheet.save(output, quality=90)


records = []
for pdf_path in sorted(ATTACHED.glob("*.pdf"), key=lambda path: bank_number(path.name) or 0):
    number = bank_number(pdf_path.name)
    if number is None or not 11 <= number <= 30:
        continue
    document = fitz.open(pdf_path)
    bank_dir = OUTPUT / f"bank-{number:02d}"
    bank_dir.mkdir(parents=True, exist_ok=True)
    question_page_index = 1 if len(document) > 1 else 0
    last_page_index = len(document) - 1
    question_image = bank_dir / "question-sample.png"
    last_image = bank_dir / "last-page.png"
    render_page(document[question_page_index], question_image)
    if last_page_index != question_page_index:
        render_page(document[last_page_index], last_image)
    else:
        last_image = question_image
    pages = []
    for index, page in enumerate(document):
        text = page.get_text("text").strip()
        pages.append({
            "page": index + 1,
            "textCharacters": len(text),
            "imageCount": len(page.get_images(full=True)),
            "textSample": text[:900],
        })
    records.append({
        "number": number,
        "file": pdf_path.name,
        "bytes": pdf_path.stat().st_size,
        "pages": len(document),
        "questionSample": str(question_image),
        "lastPageSample": str(last_image),
        "pageRecords": pages,
    })
    document.close()

(OUTPUT / "manifest.json").write_text(
    json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8"
)
make_contact_sheet(records, "questionSample", OUTPUT / "question-samples.jpg")
make_contact_sheet(records, "lastPageSample", OUTPUT / "last-pages.jpg")
print(json.dumps([
    {
        "number": record["number"],
        "file": record["file"],
        "pages": record["pages"],
        "pagesWithImages": sum(page["imageCount"] > 0 for page in record["pageRecords"]),
        "pagesWithText": sum(page["textCharacters"] > 0 for page in record["pageRecords"]),
        "questionSample": record["questionSample"],
    }
    for record in records
], ensure_ascii=False, indent=2))