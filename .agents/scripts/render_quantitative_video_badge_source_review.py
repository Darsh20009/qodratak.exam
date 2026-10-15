from pathlib import Path
import importlib.util

import fitz
from PIL import Image, ImageDraw


ROOT = Path(".")
OUTPUT = ROOT / "generated-artifacts/quantitative-bank-51-70/pdf-badge-source-review.jpg"
BANKS = (51, 53, 54, 56, 64, 65)
PAGES = range(4)


def load_exam_number():
    path = ROOT / ".agents/scripts/extract_uploaded_quantitative_computer_banks.py"
    spec = importlib.util.spec_from_file_location("bank_pdf_extractor", path)
    if not spec or not spec.loader:
        raise RuntimeError("Could not load PDF bank helper")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.exam_number


def main():
    exam_number = load_exam_number()
    pdfs = {
        number: path
        for path in (ROOT / "attached_assets").glob("*.pdf")
        if (number := exam_number(path)) in BANKS
    }
    missing = [number for number in BANKS if number not in pdfs]
    if missing:
        raise RuntimeError(f"Missing PDFs for banks: {missing}")

    cell_width, cell_height = 320, 470
    sheet = Image.new("RGB", (len(PAGES) * cell_width, len(BANKS) * cell_height), "white")
    draw = ImageDraw.Draw(sheet)
    for row, bank_number in enumerate(BANKS):
        with fitz.open(pdfs[bank_number]) as document:
            for column, page_number in enumerate(PAGES):
                page = document[page_number]
                pixmap = page.get_pixmap(matrix=fitz.Matrix(0.8, 0.8), alpha=False)
                page_image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
                page_image.thumbnail((cell_width - 12, cell_height - 34))
                x, y = column * cell_width, row * cell_height
                sheet.paste(page_image, (x + (cell_width - page_image.width) // 2, y + 28))
                draw.text((x + 8, y + 8), f"Bank {bank_number} / PDF page {page_number + 1}", fill="black")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUTPUT, quality=92)
    print(OUTPUT)


if __name__ == "__main__":
    main()
