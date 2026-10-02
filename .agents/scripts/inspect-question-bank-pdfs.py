from pathlib import Path
import re
import unicodedata

import pymupdf
from PIL import Image, ImageDraw, ImageFont


ASSETS = Path("attached_assets")
OUTPUT = Path(".agents/outputs/question-bank-pdf-samples")
OUTPUT.mkdir(parents=True, exist_ok=True)


def bank_number(filename: str) -> int | None:
    normalized = "".join(
        char for char in filename if unicodedata.category(char) != "Cf"
    )
    match = re.search(r"^اختبار[\s_]*(\d+)[\s_]*-?[\s_]*محلول", normalized)
    return int(match.group(1)) if match else None


def render_page(document: pymupdf.Document, page_index: int, output: Path, scale: float):
    page = document[page_index]
    page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), alpha=False).save(output)


pdfs = {}
for pdf_path in ASSETS.glob("*.pdf"):
    number = bank_number(pdf_path.name)
    if number is not None and 31 <= number <= 50:
        if number in pdfs:
            raise RuntimeError(f"Multiple PDFs found for bank {number}")
        pdfs[number] = pdf_path

expected = list(range(31, 51))
missing = [number for number in expected if number not in pdfs]
if missing:
    raise RuntimeError(f"Missing bank PDFs: {missing}")

for number in expected:
    document = pymupdf.open(pdfs[number])
    if len(document) != 49:
        raise RuntimeError(
            f"Bank {number} has {len(document)} pages; expected cover + 48 questions"
        )
    for label, page_index in (("q1", 1), ("q24", 24), ("q48", 48)):
        render_page(
            document,
            page_index,
            OUTPUT / f"bank-{number}-{label}.png",
            1.2,
        )
    if number in (31, 37, 44, 50):
        render_page(
            document,
            1,
            OUTPUT / f"bank-{number}-q1-detail.png",
            2.0,
        )
        render_page(
            document,
            48,
            OUTPUT / f"bank-{number}-q48-detail.png",
            2.0,
        )


def contact_sheet(label: str, suffix: str):
    columns, cell_width, cell_height = 4, 360, 500
    rows = (len(expected) + columns - 1) // columns
    sheet = Image.new(
        "RGB",
        (columns * cell_width, rows * cell_height),
        color=(245, 245, 245),
    )
    draw = ImageDraw.Draw(sheet)
    for index, number in enumerate(expected):
        image = Image.open(OUTPUT / f"bank-{number}-{suffix}.png").convert("RGB")
        image.thumbnail((cell_width - 16, cell_height - 52))
        x = (index % columns) * cell_width + (cell_width - image.width) // 2
        y = (index // columns) * cell_height + 36
        sheet.paste(image, (x, y))
        draw.text(
            ((index % columns) * cell_width + 12, (index // columns) * cell_height + 10),
            f"{label} {number}",
            fill=(20, 20, 20),
        )
    path = OUTPUT / f"{label}-contact-sheet.jpg"
    sheet.save(path, quality=86)
    print(path)


contact_sheet("q1", "q1")
contact_sheet("q24", "q24")
contact_sheet("q48", "q48")
print(f"Rendered samples for {len(pdfs)} banks into {OUTPUT}")