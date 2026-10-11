"""Extend the existing badge detector to the first nine question-bearing videos.

No equal-duration splitting: use visually checked badge templates and retain
inferred flags for every gap. Generated frames/results stay out of Git.
"""
import argparse
import concurrent.futures
import importlib.util
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw

spec = importlib.util.spec_from_file_location(
    "badge_detector", ".agents/scripts/derive_quantitative_computer_bank_video_timestamps.py")
detector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(detector)
OUT = Path("generated-artifacts/quant-video-review")
OUT.mkdir(parents=True, exist_ok=True)
metadata = json.loads(Path(".agents/outputs/quantitative-computer-banks/video-timestamps.json").read_text())


def references(family="first"):
    refs = {}
    sheet = Image.new("RGB", (8 * 180, 6 * 110), "white")
    draw = ImageDraw.Draw(sheet)
    anchors = []
    for number in range(1, 49):
        candidates = [
            (q.get("matchDistance", 1), b["number"], q["seconds"])
            for b in metadata["banks"] if (11 <= b["number"] <= 23 if family == "first" else 24 <= b["number"] <= 30)
            for q in b["questionTimestamps"]
            if q["questionNumber"] == number and not q.get("inferred")
        ]
        if not candidates:
            candidates = [
                (q.get("matchDistance", 1), b["number"], q["seconds"])
                for b in metadata["banks"] for q in b["questionTimestamps"]
                if q["questionNumber"] == number and not q.get("inferred")
            ]
        if not candidates:
            raise RuntimeError(f"No detected reference for question {number}")
        _, bank, seconds = min(candidates)
        # Q1's published timestamp can include the introduction; this original
        # frame was independently checked during the previous calibration.
        bank, seconds = (11 if family == "first" else 24, 30) if number == 1 else (bank, seconds + 5)
        path = detector.PUBLIC / f"computer-bank-{bank:02d}.mp4"
        raw = detector.run_checked([
            "ffmpeg", "-v", "error", "-ss", str(seconds), "-i", str(path),
            "-frames:v", "1", "-vf", "scale=640:360,crop=160:80:480:0",
            "-f", "image2pipe", "-vcodec", "png", "-",
        ])
        frame = Image.open(io.BytesIO(raw)).convert("RGB")
        glyph = detector.glyph_from_badge_roi(frame)
        if glyph is None:
            raise RuntimeError(f"Missing badge at reference {number}")
        refs[number] = [glyph]
        x, y = ((number - 1) % 8) * 180, ((number - 1) // 8) * 110
        sheet.paste(frame, (x, y + 25))
        draw.text((x + 3, y + 4), f"Q{number} B{bank} {seconds}s", fill="black")
        anchors.append({"questionNumber": number, "bank": bank, "seconds": seconds})
    sheet.save(OUT / f"templates-{family}.jpg")
    (OUT / f"template-anchors-{family}.json").write_text(json.dumps(anchors, indent=2))
    return refs


def scan(number, refs):
    path = detector.PUBLIC / f"computer-bank-{number:02d}.mp4"
    duration = detector.video_duration(path)
    predictions = detector.frame_predictions(path, refs)
    timestamps, inferred = detector.timestamps_from_predictions(predictions, duration)
    row = {"number": number, "durationSeconds": int(duration),
           "questionTimestamps": timestamps, "inferredQuestions": inferred}
    (OUT / f"bank-{number:02d}-timings.json").write_text(json.dumps(row, indent=2))
    print(f"Bank {number}: detected {48-len(inferred)}/48; inferred {inferred}", flush=True)
    return row


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--templates-only", action="store_true")
    parser.add_argument("--family", choices=["first", "second"], default="first")
    parser.add_argument("--expanded-roi", action="store_true",
                        help="Include lowered question badges below the original 80-pixel crop")
    parser.add_argument("--pdf-templates-bank", type=int,
                        help="Add original printed badge glyphs for this bank's font family")
    parser.add_argument("--banks", default="1,2,3,4,6,7,8,9,10")
    args = parser.parse_args()
    refs = references(args.family)
    if args.pdf_templates_bank:
        for number in range(1, 49):
            path = detector.PUBLIC / f"exam-{args.pdf_templates_bank:02d}" / f"question-{number:03d}.jpeg"
            glyph = detector.question_image_glyph(path)
            if glyph is not None:
                refs[number].append(glyph)
    if args.expanded_roi:
        detector.FRAME_HEIGHT = 140
        detector.FRAME_BYTES = detector.FRAME_WIDTH * detector.FRAME_HEIGHT * 3
    if not args.templates_only:
        numbers = [int(value) for value in args.banks.split(",")]
        catalog = json.loads(Path(".agents/outputs/quantitative-computer-banks/" +
            ("computer-banks.json" if args.family == "first" else "computer-banks-31-50.json")).read_text())
        question_banks = {b["number"] for b in catalog["banks"] if b["questions"]}
        if any(number not in question_banks for number in numbers):
            raise ValueError("Selected bank has no published source questions")
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            rows = list(pool.map(lambda number: scan(number, refs), numbers))
        target = OUT / ("first-bank-timings.json" if args.family == "first" else "late-bank-timings.json")
        previous = json.loads(target.read_text())["banks"] if target.exists() else []
        rows = [b for b in previous if b["number"] in question_banks and b["number"] not in numbers] + rows
        target.write_text(json.dumps({"banks": rows}, indent=2))
