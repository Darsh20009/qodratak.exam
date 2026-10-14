from __future__ import annotations

import io
import json
from pathlib import Path

import fitz
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
PDF_DIR = ROOT / "attached_assets"
OUTPUT_DIR = ROOT / "generated-artifacts" / "tahsili-source-inventory"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

pdfs = sorted(PDF_DIR.glob("*1792016*.pdf"))
if not pdfs:
    raise SystemExit("No Tahsili PDFs matching the current upload batch were found.")

inventory: list[dict[str, object]] = []
tiles: list[Image.Image] = []
tile_width, tile_height = 260, 350

for index, pdf_path in enumerate(pdfs, start=1):
    document = fitz.open(pdf_path)
    sample_indexes = sorted(
        {
            0,
            max(0, document.page_count // 2),
            max(0, document.page_count - 1),
        }
    )
    sample_text_pages = sum(
        bool(document[page_index].get_text("text").strip())
        for page_index in sample_indexes
    )
    sample_image_counts = [
        len(document[page_index].get_images(full=True))
        for page_index in sample_indexes
    ]

    cover = document[0].get_pixmap(
        matrix=fitz.Matrix(0.32, 0.32),
        alpha=False,
        colorspace=fitz.csRGB,
    )
    thumbnail = Image.open(io.BytesIO(cover.tobytes("png"))).convert("RGB")
    thumbnail.thumbnail((tile_width - 20, tile_height - 50))

    tile = Image.new("RGB", (tile_width, tile_height), "white")
    tile.paste(
        thumbnail,
        ((tile_width - thumbnail.width) // 2, 38),
    )
    draw = ImageDraw.Draw(tile)
    draw.text((12, 10), f"PDF {index:02d} | {document.page_count} pages", fill="black")
    draw.rectangle((0, 0, tile_width - 1, tile_height - 1), outline="#9aa4b2")
    tiles.append(tile)

    metadata = document.metadata or {}
    inventory.append(
        {
            "index": index,
            "filename": pdf_path.name,
            "bytes": pdf_path.stat().st_size,
            "pages": document.page_count,
            "metadata_title": metadata.get("title", ""),
            "metadata_author": metadata.get("author", ""),
            "sampled_pages_with_text": sample_text_pages,
            "sampled_embedded_image_counts": sample_image_counts,
        }
    )
    document.close()

columns = 4
rows = (len(tiles) + columns - 1) // columns
sheet = Image.new(
    "RGB",
    (columns * tile_width, rows * tile_height),
    "#e8edf2",
)
for index, tile in enumerate(tiles):
    x = (index % columns) * tile_width
    y = (index // columns) * tile_height
    sheet.paste(tile, (x, y))

sheet_path = OUTPUT_DIR / "covers-contact-sheet.jpg"
sheet.save(sheet_path, quality=82, optimize=True)
inventory_path = OUTPUT_DIR / "inventory.json"
inventory_path.write_text(
    json.dumps(inventory, ensure_ascii=False, indent=2),
    encoding="utf-8",
)

print(
    json.dumps(
        {
            "pdfs": len(inventory),
            "total_pages": sum(int(item["pages"]) for item in inventory),
            "total_bytes": sum(int(item["bytes"]) for item in inventory),
            "contact_sheet": str(sheet_path.relative_to(ROOT)),
            "inventory": str(inventory_path.relative_to(ROOT)),
        },
        ensure_ascii=False,
        indent=2,
    )
)
