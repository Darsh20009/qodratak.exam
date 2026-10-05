from pathlib import Path
import hashlib
import unicodedata

import fitz


ROOT = Path("attached_assets")
OUTPUT = Path(".agents/outputs/verbal-files-preview")
OUTPUT.mkdir(parents=True, exist_ok=True)

suffixes = [
    "1791158211316.pdf",
    "1791158213202.pdf",
    "1791158215025.pdf",
    "1791158220121.pdf",
    "1791158222189.pdf",
    "1791158225095.pdf",
    "1791158231958.pdf",
]

seen = set()
for suffix in suffixes:
    matches = list(ROOT.glob(f"*{suffix}"))
    if not matches:
        print(f"NOT FOUND: {suffix}")
        continue
    source = matches[0]
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    if digest in seen:
        print(f"DUPLICATE: {source.name} sha256={digest}")
        continue
    seen.add(digest)

    document = fitz.open(source)
    normalized = unicodedata.normalize("NFKC", source.name).casefold()
    if "استيعاب" in normalized:
        category = "reading-comprehension"
    elif "الخطأ" in normalized:
        category = "contextual-error"
    elif "التناظر" in normalized:
        category = "verbal-analogy"
    else:
        category = "sentence-completion"

    page = document[0]
    pixmap = page.get_pixmap(matrix=fitz.Matrix(1.35, 1.35), alpha=False)
    image_path = OUTPUT / f"{category}.png"
    pixmap.save(image_path)
    page_text = page.get_text("text").strip().replace("\n", " ")
    print(
        f"FILE: {source.name}\n"
        f"  bytes={source.stat().st_size} pages={document.page_count} "
        f"page={page.rect.width:.0f}x{page.rect.height:.0f} "
        f"metadata-title={document.metadata.get('title')!r}\n"
        f"  first-page-text={page_text[:240]!r}\n"
        f"  preview={image_path} ({pixmap.width}x{pixmap.height})\n"
        f"  sha256={digest}"
    )