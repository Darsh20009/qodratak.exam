from pathlib import Path
import importlib.util
from io import BytesIO

import fitz
from PIL import Image, ImageDraw


ROOT = Path(".")
OUTPUT_DIR = ROOT / "generated-artifacts/quantitative-bank-51-70/badge-sequences"
BANKS = (51, 53, 54, 56, 64, 65)


def load_helper(path: str, name: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    if not spec or not spec.loader:
        raise RuntimeError(f"Could not load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    extractor = load_helper(
        ".agents/scripts/extract_uploaded_quantitative_computer_banks.py",
        "quant_bank_extractor_for_badges",
    )
    detector = load_helper(
        ".agents/scripts/derive_quantitative_computer_bank_video_timestamps.py",
        "quant_video_detector_for_badges",
    )
    pdfs = {
        number: path
        for path in (ROOT / "attached_assets").glob("*.pdf")
        if (number := extractor.exam_number(path)) in BANKS
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    columns, rows = 6, 8
    cell_width, cell_height = 150, 105
    for bank_number in BANKS:
        document = fitz.open(pdfs[bank_number])
        sheet = Image.new("RGB", (columns * cell_width, rows * cell_height), "white")
        draw = ImageDraw.Draw(sheet)
        for question_number in range(1, 49):
            page = document[question_number]
            image_data = document.extract_image(extractor.question_image_xref(page))
            with Image.open(BytesIO(image_data["image"])) as source:
                image = source.convert("RGB")
                width, height = image.size
                roi = image.crop((
                    round(width * 0.72),
                    round(height * 0.08),
                    round(width * 0.99),
                    round(height * 0.36),
                )).resize((180, 90), Image.Resampling.LANCZOS)
                bounds = detector.badge_bounds(roi)
                badge = roi.crop(bounds) if bounds else roi
                badge.thumbnail((cell_width - 12, cell_height - 28))
            index = question_number - 1
            x, y = (index % columns) * cell_width, (index // columns) * cell_height
            sheet.paste(badge, (x + (cell_width - badge.width) // 2, y + 22))
            draw.text((x + 5, y + 4), f"PDF question {question_number}", fill="black")
        document.close()
        out = OUTPUT_DIR / f"bank-{bank_number}.jpg"
        sheet.save(out, quality=92)
        print(out)


if __name__ == "__main__":
    main()
