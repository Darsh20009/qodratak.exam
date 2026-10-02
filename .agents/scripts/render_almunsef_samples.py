from pathlib import Path
import fitz

source = Path("attached_assets/(FM)_كتاب_المنصف_5_للتأسيس_1790809346771.pdf")
out = Path(".agents/outputs/almunsef_sample")
out.mkdir(parents=True, exist_ok=True)
doc = fitz.open(source)
print({"pages": doc.page_count, "metadata": doc.metadata, "file_bytes": source.stat().st_size})
for index in sorted(set([0, 1, 2, 9, 17, 34, doc.page_count // 2, doc.page_count - 1])):
    if 0 <= index < doc.page_count:
        page = doc[index]
        pix = page.get_pixmap(matrix=fitz.Matrix(1.4, 1.4), alpha=False)
        target = out / f"page-{index + 1:03d}.png"
        pix.save(target)
        text = page.get_text().strip()
        print(f"PAGE {index + 1}: text_chars={len(text)} text_sample={text[:500]!r} image_blocks={sum(1 for block in page.get_text('dict')['blocks'] if block.get('type') == 1)} rendered={target}")
