from pathlib import Path
import fitz

source_dir = Path("attached_assets")
output_dir = Path(".agents/outputs/quantitative-pdf-previews")
output_dir.mkdir(parents=True, exist_ok=True)

files = sorted(source_dir.glob("*179000296795*.pdf")) + sorted(source_dir.glob("*1790002967953.pdf"))
seen = set()
files = [path for path in files if not (str(path) in seen or seen.add(str(path)))]

summary = []
for path in files:
    document = fitz.open(path)
    first_page = document[0]
    pixmap = first_page.get_pixmap(matrix=fitz.Matrix(1.2, 1.2), alpha=False)
    preview_path = output_dir / f"{path.stem}.png"
    pixmap.save(preview_path)
    text = first_page.get_text("text").strip().replace("\n", " ")
    summary.append({
        "filename": path.name,
        "pages": document.page_count,
        "first_page_text": text[:500],
        "preview": str(preview_path),
    })

(output_dir / "summary.txt").write_text(
    "\n".join(
        f"{item['filename']}\tpages={item['pages']}\t{item['first_page_text']}"
        for item in summary
    ),
    encoding="utf-8",
)
print("\n".join(
    f"{item['filename']}: {item['pages']} pages | {item['first_page_text'][:140]}"
    for item in summary
))