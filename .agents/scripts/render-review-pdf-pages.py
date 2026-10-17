#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

import fitz

parser = argparse.ArgumentParser(description="Render selected source PDF pages for manual question review.")
parser.add_argument("--pdf", type=Path, required=True)
parser.add_argument("--pages", required=True, help="Comma-separated one-based page numbers.")
parser.add_argument("--output-dir", type=Path, required=True)
parser.add_argument("--zoom", type=float, default=1.8)
args = parser.parse_args()

pages = sorted({int(value.strip()) for value in args.pages.split(",") if value.strip()})
if not pages or any(page < 1 for page in pages):
    raise SystemExit("Provide positive one-based page numbers.")
args.output_dir.mkdir(parents=True, exist_ok=True)
document = fitz.open(args.pdf)
for page_number in pages:
    if page_number > document.page_count:
        raise SystemExit(f"Page {page_number} exceeds document length {document.page_count}.")
    output = args.output_dir / f"page-{page_number:03d}.png"
    document[page_number - 1].get_pixmap(matrix=fitz.Matrix(args.zoom, args.zoom), alpha=False).save(output)
    print(output)
