from pathlib import Path
import fitz

pdf_path = Path("attached_assets/822748463-كتاب-ناصر-عبد-الكريم-للتحصيلي_1789011713747.pdf")
out_dir = Path(".agents/outputs/tahsili-pdf-samples")
out_dir.mkdir(parents=True, exist_ok=True)

doc = fitz.open(pdf_path)
print({"pages": len(doc), "metadata": doc.metadata})

sample_pages = [0, 1, 2, 9, 24, 49, 99, 149, 199, 249, len(doc) - 1]
for page_index in sample_pages:
    page = doc[page_index]
    text = page.get_text("text")
    blocks = page.get_text("dict").get("blocks", [])
    images = [block for block in blocks if block.get("type") == 1]
    print({
        "page": page_index + 1,
        "chars": len(text),
        "lines": len(text.splitlines()),
        "images": len(images),
        "first_lines": text.splitlines()[:5],
    })
    pix = page.get_pixmap(matrix=fitz.Matrix(1.2, 1.2), alpha=False)
    pix.save(out_dir / f"page-{page_index + 1:03d}.png")