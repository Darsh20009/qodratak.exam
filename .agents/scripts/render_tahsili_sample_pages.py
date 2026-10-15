#!/usr/bin/env python3
"""Render sample Tahsili pages to inspect text/diagram layout before parsing."""

from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "attached_assets"
OUTPUT = ROOT / "generated-artifacts" / "tahsili-source-previews"

SAMPLES = [
    ("ghasham-practice-biology-period-1", "تدريبات_أ_غشام_الفترة_الأولى_الأحياء_1792016237165.pdf", 4),
    ("friday-evening-p2-biology-2024", "ف2_جمعة_مسائي_24_-_أحياء_1792016220148.pdf", 10),
    ("friday-evening-p2-math-2024", "ف2_جمعة_مسائي_24_-_رياضيات_1792016207388.pdf", 5),
    ("yelo-2024-p2-thursday-evening", "يلو_فترات_2024_-_ف2_الخميس_مسائي_1792016199422.pdf", 25),
]


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for source_id, filename, page_number in SAMPLES:
        document = pymupdf.open(ASSETS / filename)
        page = document[page_number - 1]
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False)
        output_path = OUTPUT / f"{source_id}-page-{page_number}.png"
        pixmap.save(output_path)
        print(f"{source_id}\tpage={page_number}\t{output_path.relative_to(ROOT)}")
        document.close()


if __name__ == "__main__":
    main()
