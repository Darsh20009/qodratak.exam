#!/usr/bin/env python3
"""Conservatively remove separated publisher marks from bank 131 images."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[2]
IMAGE_ROOT = ROOT / "generated-artifacts/quantitative-bank-131/source-images/exam-131"
MANIFEST = ROOT / ".agents/outputs/quantitative-computer-banks/computer-banks-131.json"


def threshold(image: Image.Image, lower: int, upper: int) -> Image.Image:
    return image.point(lambda value: 255 if lower <= value <= upper else 0)


def clean_image(source: Image.Image) -> Image.Image:
    image = source.convert("RGB")
    red, green, blue = image.split()
    high = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    low = ImageChops.darker(ImageChops.darker(red, green), blue)
    low_chroma = threshold(ImageChops.difference(high, low), 0, 48)
    medium_light_neutrals = threshold(ImageOps.grayscale(image), 100, 205)
    watermark_mask = ImageChops.multiply(low_chroma, medium_light_neutrals)

    # The publisher's book/logo is confined to a blank top-left art box. The
    # boundary avoids question text and graphs which begin further to the right.
    separated_logo = Image.new("L", image.size, 0)
    ImageDraw.Draw(separated_logo).rectangle((0, 0, 220, 205), fill=255)
    mask = ImageChops.lighter(watermark_mask, separated_logo)

    # The source title is printed in a fixed reserved header strip above the
    # question prompt. Clearing only that strip avoids touching question text.
    top_band = Image.new("L", image.size, 0)
    ImageDraw.Draw(top_band).rectangle((215, 0, image.width - 100, 94), fill=255)
    mask = ImageChops.lighter(mask, top_band)

    return Image.composite(Image.new("RGB", image.size, "white"), image, mask)


def main() -> None:
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    bank = next((entry for entry in payload["banks"] if entry["number"] == 131), None)
    if bank is None or len(bank["questions"]) != 55:
        raise ValueError("Expected all 55 extracted questions for bank 131.")

    contact = Image.new("RGB", (5 * 320, 11 * 205), "white")
    draw = ImageDraw.Draw(contact)
    for index, question in enumerate(bank["questions"]):
        number = question["questionNumber"]
        source_path = IMAGE_ROOT / f"question-{number:03d}.jpeg"
        cleaned_path = IMAGE_ROOT / "background-removed" / f"question-{number:03d}.png"
        cleaned_path.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source_path) as original:
            cleaned = clean_image(original)
            cleaned.save(cleaned_path, format="PNG", optimize=True)
            thumb = cleaned.copy()
        thumb.thumbnail((310, 175))
        x = (index % 5) * 320
        y = (index // 5) * 205
        draw.text((x + 5, y + 3), f"question-{number:03d}", fill="black")
        contact.paste(thumb, (x + 5, y + 23))
        question["imageProcessing"] = {
            "status": "processed",
            "backgroundRemoved": True,
            "watermarkCleanupApplied": True,
            "note": (
                "نُظفت الخلفية والعلامات المنفصلة فقط؛ أبقينا أي أثر يتداخل مع نص السؤال "
                "أو الرسم لتجنب تغيير المحتوى."
            ),
        }

    contact.save(
        ROOT / "generated-artifacts/quantitative-bank-131/cleaned-questions-contact.jpg",
        format="JPEG",
        quality=88,
        optimize=True,
    )
    MANIFEST.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "bank": 131,
        "cleanedImages": len(bank["questions"]),
        "contactSheet": "generated-artifacts/quantitative-bank-131/cleaned-questions-contact.jpg",
        "note": "Potentially overlapping source marks are preserved to protect question content.",
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
