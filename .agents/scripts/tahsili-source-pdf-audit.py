from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "attached_assets"
OUTPUTS = ROOT / ".agents" / "outputs"
OUTPUTS.mkdir(parents=True, exist_ok=True)

# These are the 18 Tahsili PDFs the user explicitly authorized for this task.
AUTHORIZED_UPLOAD_IDS = {
    "1792016199422", "1792016207388", "1792016214685", "1792016220148",
    "1792016222600", "1792016227657", "1792016234652", "1792016237165",
    "1792016240518", "1792016263581", "1792016335716", "1792016335718",
    "1792016335719", "1792016335720",
}
ANSWER_PATTERN = re.compile(
    r"(?:الجواب|الإجابة(?:\s+الصحيحة)?|الإجابه)\s*[:：]?\s*([أابجدد])",
    re.IGNORECASE,
)
QUESTION_NUMBER_PATTERN = re.compile(r"(?:السؤال\s*)?([0-9٠-٩]{1,3})\s*[.)]")


def normalize_name(value: str) -> str:
    return unicodedata.normalize("NFKC", value)


def main() -> None:
    files = sorted(
        path for path in ASSETS.glob("*.pdf")
        if any(upload_id in path.name for upload_id in AUTHORIZED_UPLOAD_IDS)
    )
    if len(files) != 18:
        raise RuntimeError(
            f"Expected exactly 18 authorized Tahsili PDFs, found {len(files)}. "
            "Refusing to scan an incomplete or expanded source set."
        )

    report: dict[str, object] = {
        "authorizedSourceFileCount": len(files),
        "sources": [],
    }
    contact_items: list[tuple[str, Image.Image]] = []

    for path in files:
        document = fitz.open(path)
        source = {
            "file": path.name,
            "pages": len(document),
            "pagesWithText": 0,
            "pagesWithImages": 0,
            "answerMentions": 0,
            "sampleAnswers": [],
            "pageSamples": [],
        }
        selected_page: int | None = None
        for page_index, page in enumerate(document):
            text = page.get_text("text")
            if text.strip():
                source["pagesWithText"] += 1
            image_count = len(page.get_images(full=True))
            if image_count:
                source["pagesWithImages"] += 1
            answer_hits = [
                {"line": line.strip()[:180], "label": match.group(1)}
                for line in text.splitlines()
                if (match := ANSWER_PATTERN.search(line))
            ]
            source["answerMentions"] += len(answer_hits)
            for hit in answer_hits[:8]:
                if len(source["sampleAnswers"]) >= 8:
                    break
                source["sampleAnswers"].append({"page": page_index + 1, **hit})
            if len(source["pageSamples"]) < 3 and (text.strip() or image_count):
                source["pageSamples"].append({
                    "page": page_index + 1,
                    "textLength": len(text),
                    "imageCount": image_count,
                    "questionNumbers": QUESTION_NUMBER_PATTERN.findall(text)[:12],
                    "answerLines": answer_hits[:8],
                    "textPreview": text.strip()[:700],
                })
            if selected_page is None and answer_hits:
                selected_page = page_index

        if selected_page is None:
            for page_index, page in enumerate(document):
                if page.get_text("text").strip() or page.get_images(full=True):
                    selected_page = page_index
                    break
        if selected_page is not None:
            page = document[selected_page]
            pixmap = page.get_pixmap(matrix=fitz.Matrix(0.38, 0.38), alpha=False)
            image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
            contact_items.append((path.name, image))
        document.close()
        report["sources"].append(source)

    columns = 3
    cell_width = 360
    cell_height = 500
    rows = (len(contact_items) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_width, rows * cell_height), "white")
    draw = ImageDraw.Draw(sheet)
    for index, (filename, image) in enumerate(contact_items):
        x = (index % columns) * cell_width
        y = (index // columns) * cell_height
        image.thumbnail((cell_width - 20, cell_height - 54))
        draw.text((x + 8, y + 4), normalize_name(filename)[:48], fill="#111111")
        sheet.paste(image, (x + 8, y + 36))
    sheet.save(OUTPUTS / "tahsili-source-contact-sheet.jpg", quality=82)

    report_path = OUTPUTS / "tahsili-source-pdf-audit.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "authorizedSourceFileCount": len(files),
        "totalPages": sum(int(source["pages"]) for source in report["sources"]),
        "sources": [
            {
                "file": normalize_name(str(source["file"])),
                "pages": source["pages"],
                "pagesWithText": source["pagesWithText"],
                "pagesWithImages": source["pagesWithImages"],
                "answerMentions": source["answerMentions"],
                "sampleAnswers": source["sampleAnswers"][:3],
            }
            for source in report["sources"]
        ],
        "report": str(report_path.relative_to(ROOT)),
        "contactSheet": str((OUTPUTS / "tahsili-source-contact-sheet.jpg").relative_to(ROOT)),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
