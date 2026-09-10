#!/usr/bin/env python3
"""Render the question column of the scanned Tahsili PDF and run Arabic OCR.

The book uses a two-column layout: questions on the right and explanations on
the left. This script deliberately OCRs only the question column so the
explanation text is not mixed into the question records.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path

import fitz


PDF_PATH = Path("attached_assets/822748463-كتاب-ناصر-عبد-الكريم-للتحصيلي_1789011713747.pdf")
DEFAULT_OUTPUT = Path(".agents/outputs/tahsili-ocr")


def ocr_page(page: fitz.Page, zoom: float = 3.0, crop_start: float = 0.40, psm: int = 4) -> str:
    width = page.rect.width
    height = page.rect.height
    # The question column occupies the right side of regular content pages.
    # Keep a small overlap so equations/option labels at the boundary survive.
    clip = fitz.Rect(width * crop_start, 0, width, height)
    pixmap = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=clip, alpha=False)
    with tempfile.NamedTemporaryFile(suffix=".png") as image_file:
        image_file.write(pixmap.tobytes("png"))
        image_file.flush()
        result = subprocess.run(
            [
                "tesseract",
                image_file.name,
                "stdout",
                "-l",
                "ara+eng",
                "--psm",
                str(psm),
                "-c",
                "preserve_interword_spaces=1",
            ],
            check=False,
            capture_output=True,
            text=True,
        )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "tesseract failed")
    return result.stdout


def normalize_text(text: str) -> str:
    text = text.replace("\u200f", " ").replace("\u200e", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--zoom", type=float, default=3.0)
    parser.add_argument("--crop-start", type=float, default=0.40)
    parser.add_argument("--psm", type=int, default=4)
    args = parser.parse_args()

    if not PDF_PATH.exists():
        raise SystemExit(f"PDF not found: {PDF_PATH}")

    args.output.mkdir(parents=True, exist_ok=True)
    document = fitz.open(PDF_PATH)
    start = max(1, args.start)
    end = min(len(document), args.end or len(document))

    manifest_path = args.output / "manifest.jsonl"
    mode = "a" if start > 1 or manifest_path.exists() else "w"
    with manifest_path.open(mode, encoding="utf-8") as manifest:
        for page_number in range(start, end + 1):
            page = document[page_number - 1]
            text = normalize_text(
                ocr_page(page, zoom=args.zoom, crop_start=args.crop_start, psm=args.psm)
            )
            output_path = args.output / f"page-{page_number:03d}.txt"
            output_path.write_text(text + "\n", encoding="utf-8")
            manifest.write(
                json.dumps(
                    {
                        "page": page_number,
                        "textFile": str(output_path),
                        "chars": len(text),
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )
            manifest.flush()
            print(f"page={page_number} chars={len(text)}")


if __name__ == "__main__":
    main()