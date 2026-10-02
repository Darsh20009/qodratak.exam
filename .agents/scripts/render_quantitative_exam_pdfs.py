from pathlib import Path
import json
import re

import fitz


ROOT = Path("attached_assets")
OUTPUT = Path(".agents/outputs/quantitative_exam_pdfs")
OUTPUT.mkdir(parents=True, exist_ok=True)

pdfs = sorted(ROOT.glob("اختبار_*_محلول_*.pdf"), key=lambda path: int(re.search(r"اختبار_(\d+)", path.name).group(1)))
manifest = []

for pdf_path in pdfs:
    exam_number = int(re.search(r"اختبار_(\d+)", pdf_path.name).group(1))
    exam_dir = OUTPUT / f"exam-{exam_number:02d}"
    exam_dir.mkdir(parents=True, exist_ok=True)
    document = fitz.open(pdf_path)
    pages = []
    for page_number, page in enumerate(document, start=1):
        text = page.get_text("text").strip()
        images = page.get_images(full=True)
        page_record = {
            "page": page_number,
            "text": text,
            "imageCount": len(images),
        }
        if page_number <= 3 or images:
            rendered = page.get_pixmap(matrix=fitz.Matrix(1.6, 1.6), alpha=False)
            rendered.save(exam_dir / f"page-{page_number:02d}.png")
        pages.append(page_record)
    manifest.append({
        "examNumber": exam_number,
        "file": pdf_path.name,
        "pages": len(document),
        "pagesWithImages": sum(1 for page in pages if page["imageCount"]),
        "textCharacters": sum(len(page["text"]) for page in pages),
        "pageRecords": pages,
    })
    document.close()

(OUTPUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps([
    {
        "examNumber": item["examNumber"],
        "file": item["file"],
        "pages": item["pages"],
        "pagesWithImages": item["pagesWithImages"],
        "textCharacters": item["textCharacters"],
    }
    for item in manifest
], ensure_ascii=False, indent=2))