from __future__ import annotations

import json
import re
from pathlib import Path

import pymupdf
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
INPUT_DIR = ROOT / "attached_assets"
OUTPUT_DIR = ROOT / "generated-artifacts" / "quantitative-banks-71-90"
SAMPLE_DIR = OUTPUT_DIR / "samples"
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

pdfs: dict[int, Path] = {}
for path in INPUT_DIR.glob("*_1792019*.pdf"):
    match = re.search(r"اختبار_(\d+)", path.name)
    if match:
        bank = int(match.group(1))
        if 71 <= bank <= 90:
            pdfs[bank] = path

expected = set(range(71, 91))
if set(pdfs) != expected:
    raise SystemExit(
        f"Expected PDFs for 71–90; missing={sorted(expected - set(pdfs))}, "
        f"extra={sorted(set(pdfs) - expected)}"
    )

sample_kinds = ("cover", "first_question", "middle", "answer_key")
pages_by_kind: dict[str, list[tuple[int, int, Image.Image]]] = {
    kind: [] for kind in sample_kinds
}
metadata = []

for bank, path in sorted(pdfs.items()):
    document = pymupdf.open(path)
    page_count = len(document)
    if page_count < 2:
        raise SystemExit(f"Bank {bank} has too few pages: {page_count}")
    page_indexes = (
        0,
        min(1, page_count - 1),
        page_count // 2,
        page_count - 1,
    )
    page_text = [page.get_text("text") for page in document]
    image_page_indexes = [
        index for index, page in enumerate(document)
        if page.get_images(full=True)
    ]
    metadata.append({
        "bank": bank,
        "filename": path.name,
        "bytes": path.stat().st_size,
        "pages": page_count,
        "pages_with_images": len(image_page_indexes),
        "first_page_text_sample": page_text[0][:500],
        "last_page_text_sample": page_text[-1][:800],
        "image_page_indexes_1_based": [index + 1 for index in image_page_indexes[:30]],
    })

    for kind, page_index in zip(sample_kinds, page_indexes):
        page = document[page_index]
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(1.35, 1.35), alpha=False)
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        pages_by_kind[kind].append((bank, page_index + 1, image))
    document.close()

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
(OUTPUT_DIR / "metadata.json").write_text(
    json.dumps(metadata, ensure_ascii=False, indent=2),
    encoding="utf-8",
)

for kind, samples in pages_by_kind.items():
    columns = 4
    cell_width, cell_height, label_height = 310, 420, 32
    rows = (len(samples) + columns - 1) // columns
    sheet = Image.new(
        "RGB",
        (columns * cell_width, rows * (cell_height + label_height)),
        "white",
    )
    draw = ImageDraw.Draw(sheet)
    for index, (bank, page_number, image) in enumerate(samples):
        x = (index % columns) * cell_width
        y = (index // columns) * (cell_height + label_height)
        image.thumbnail((cell_width - 10, cell_height - 10))
        draw.text((x + 8, y + 6), f"Bank {bank} · page {page_number}", fill="black")
        sheet.paste(image, (x + (cell_width - image.width) // 2, y + label_height))
    sheet.save(SAMPLE_DIR / f"{kind}-contact-sheet.jpg", quality=88, optimize=True)

print(json.dumps({
    "banks": len(pdfs),
    "metadata": str(OUTPUT_DIR / "metadata.json"),
    "sampleSheets": [str(SAMPLE_DIR / f"{kind}-contact-sheet.jpg") for kind in sample_kinds],
}, ensure_ascii=False))
