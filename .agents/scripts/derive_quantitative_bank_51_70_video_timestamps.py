from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import importlib.util
import json
import subprocess
from io import BytesIO
from pathlib import Path

import fitz
from PIL import Image, ImageOps


ROOT = Path(".")
ATTACHED = ROOT / "attached_assets"
OUTPUT = ROOT / "generated-artifacts/quantitative-bank-51-70/video-timestamps.json"
MANIFEST_PATH = ROOT / ".agents/scripts/quantitative-bank-51-70-video-manifest.json"
SAMPLE_INTERVAL_SECONDS = 10
FRAME_WIDTH = 290
FRAME_HEIGHT = 180
FRAME_BYTES = FRAME_WIDTH * FRAME_HEIGHT * 3
QUESTION_NUMBERS = range(1, 49)

def load_helper(path: str, module_name: str):
    spec = importlib.util.spec_from_file_location(module_name, path)
    if not spec or not spec.loader:
        raise RuntimeError(f"Could not load helper: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


extractor = load_helper(
    ".agents/scripts/extract_uploaded_quantitative_computer_banks.py",
    "quant_bank_extractor",
)
detector = load_helper(
    ".agents/scripts/derive_quantitative_computer_bank_video_timestamps.py",
    "quant_video_detector",
)


def run_checked(args: list[str], *, text: bool = False) -> str | bytes:
    result = subprocess.run(args, check=True, capture_output=True, text=text)
    return result.stdout


def video_duration(path: Path) -> float:
    output = run_checked([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path),
    ], text=True)
    return float(output.strip())


def pdf_paths() -> dict[int, Path]:
    result = {}
    for path in ATTACHED.glob("*.pdf"):
        number = extractor.exam_number(path)
        if number is not None and 51 <= number <= 70:
            result[number] = path
    return result


def glyph_from_source_image(document: fitz.Document, page_number: int) -> int | None:
    page = document[page_number]
    image_data = document.extract_image(extractor.question_image_xref(page))
    with Image.open(BytesIO(image_data["image"])) as source:
        image = source.convert("RGB")
        width, height = image.size
        badge_roi = image.crop((
            round(width * 0.72),
            round(height * 0.08),
            round(width * 0.99),
            round(height * 0.36),
        )).resize((180, 90), Image.Resampling.LANCZOS)
        return clean_glyph_from_badge_roi(badge_roi)


def clean_glyph_from_badge_roi(roi: Image.Image) -> int | None:
    bounds = detector.badge_bounds(roi)
    if bounds is None:
        return None
    left, top, right, bottom = bounds
    badge_width = right - left
    badge_height = bottom - top
    crop = roi.crop((
        round(left + badge_width * 0.16),
        round(top + badge_height * 0.12),
        round(left + badge_width * 0.84),
        round(top + badge_height * 0.88),
    )).convert("RGB")
    cleaned = []
    for red, green, blue in crop.getdata():
        red_ink = red > 65 and red > green * 1.18 and red > blue * 1.12
        blue_ink = blue > 65 and blue > red * 1.14 and blue > green * 1.08
        cleaned.append((255, 255, 255) if red_ink or blue_ink else (red, green, blue))
    crop.putdata(cleaned)
    normalized = ImageOps.autocontrast(
        crop.convert("L").resize(
            (detector.GLYPH_WIDTH, detector.GLYPH_HEIGHT),
            Image.Resampling.BILINEAR,
        )
    )
    mask = bytes(
        1 if pixel < 85 else 0
        for pixel in normalized.get_flattened_data()
    )
    return int.from_bytes(mask, "big") if any(mask) else None


def load_references(paths: dict[int, Path]) -> dict[int, dict[int, list[int]]]:
    references: dict[int, dict[int, list[int]]] = {
        bank_number: {number: [] for number in QUESTION_NUMBERS}
        for bank_number in paths
    }
    for bank_number, pdf_path in sorted(paths.items()):
        with fitz.open(pdf_path) as document:
            if len(document) < 49:
                raise RuntimeError(
                    f"Bank {bank_number} PDF has only {len(document)} pages."
                )
            for question_number in QUESTION_NUMBERS:
                try:
                    glyph = glyph_from_source_image(document, question_number)
                except Exception:
                    continue
                if glyph is not None:
                    references[bank_number][question_number].append(glyph)

    for bank_number, bank_references in references.items():
        for question_number, glyphs in bank_references.items():
            if glyphs:
                continue
            neighboring = sorted(
                (
                    (abs(other_bank - bank_number), other_bank, other_glyphs[question_number])
                    for other_bank, other_glyphs in references.items()
                    if other_bank != bank_number and other_glyphs[question_number]
                ),
                key=lambda item: (item[0], item[1]),
            )
            if not neighboring:
                raise RuntimeError(
                    f"No source badge template for bank {bank_number}, question {question_number}."
                )
            bank_references[question_number].append(neighboring[0][2][0])
    return references


def frame_predictions(
    path: Path,
    references: dict[int, list[int]],
    interval: int,
) -> list[dict]:
    process = subprocess.Popen([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path),
        "-vf", (
            f"fps=1/{interval},scale=640:-2,setsar=1,"
            f"crop={FRAME_WIDTH}:{FRAME_HEIGHT}:350:0,format=rgb24"
        ),
        "-pix_fmt", "rgb24", "-f", "rawvideo", "pipe:1",
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if process.stdout is None:
        raise RuntimeError(f"Could not sample frames from {path.name}")

    predictions = []
    sample_index = 0
    while True:
        frame_bytes = process.stdout.read(FRAME_BYTES)
        if not frame_bytes:
            break
        if len(frame_bytes) != FRAME_BYTES:
            raise RuntimeError(f"Incomplete sample frame in {path.name}")

        with Image.frombytes("RGB", (FRAME_WIDTH, FRAME_HEIGHT), frame_bytes) as roi:
            glyph = clean_glyph_from_badge_roi(roi)

        candidate_distances: list[float | None] = [None] * 48
        ranked = []
        if glyph is not None:
            for question_number, templates in references.items():
                distance = min(
                    (glyph ^ template).bit_count() / detector.GLYPH_PIXELS
                    for template in templates
                )
                candidate_distances[question_number - 1] = distance
                ranked.append((distance, question_number))
        ranked.sort()
        best = ranked[0] if ranked else None
        second = ranked[1] if len(ranked) > 1 else None
        margin = second[0] - best[0] if best and second else None
        label = (
            best[1]
            if best and best[0] <= detector.MAX_MATCH_DISTANCE
            and (margin is None or margin >= detector.MIN_MATCH_MARGIN)
            else None
        )
        predictions.append({
            "seconds": sample_index * interval,
            "questionNumber": label,
            "matchDistance": round(best[0], 5) if best else None,
            "margin": round(margin, 5) if margin is not None else None,
            "candidateDistances": (
                [round(item, 5) if item is not None else None
                 for item in candidate_distances]
                if glyph is not None else None
            ),
        })
        sample_index += 1

    process.stdout.close()
    stderr = process.stderr.read().decode("utf-8", errors="replace") if process.stderr else ""
    exit_code = process.wait()
    if exit_code:
        raise RuntimeError(f"ffmpeg failed on {path.name}: {stderr.strip()}")
    return predictions


def derive_bank(bank_number: int, video_path: Path, references: dict[int, list[int]], interval: int) -> dict:
    duration = video_duration(video_path)
    predictions = frame_predictions(video_path, references, interval)
    detector.SAMPLE_INTERVAL_SECONDS = interval
    timestamps, inferred = detector.timestamps_from_predictions(predictions, duration)
    for index, row in enumerate(timestamps):
        next_start = (
            timestamps[index + 1]["seconds"]
            if index + 1 < len(timestamps)
            else round(duration)
        )
        row["startSeconds"] = row.pop("seconds")
        row["endSeconds"] = max(row["startSeconds"] + 1, next_start)
        row["inferred"] = row["inferred"] or (
            index + 1 < len(timestamps) and timestamps[index + 1]["inferred"]
        )

    detected = 48 - len(inferred)
    return {
        "number": bank_number,
        "videoFile": video_path.name,
        "videoUrl": (
            "/api/learning/computerized/quantitative/"
            f"computer-bank-{bank_number}.mp4"
        ),
        "durationSeconds": round(duration),
        "sampleIntervalSeconds": interval,
        "sampledFrames": len(predictions),
        "detectedQuestions": detected,
        "inferredQuestions": inferred,
        "questionTimestamps": timestamps,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--banks",
        default=",".join(str(number) for number in range(51, 71)),
        help="Comma-separated bank numbers in 51–70.",
    )
    parser.add_argument("--sample-interval", type=int, default=SAMPLE_INTERVAL_SECONDS)
    args = parser.parse_args()
    bank_numbers = [int(value) for value in args.banks.split(",")]
    if any(number < 51 or number > 70 for number in bank_numbers):
        raise ValueError("Bank numbers must be between 51 and 70.")
    if args.sample_interval < 5 or args.sample_interval > 30:
        raise ValueError("Sample interval must be 5–30 seconds.")

    pdf_by_number = pdf_paths()
    missing_pdfs = [number for number in bank_numbers if number not in pdf_by_number]
    if missing_pdfs:
        raise RuntimeError(f"Missing source PDFs for banks: {missing_pdfs}")
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    videos = {
        int(item["bankNumber"]): ATTACHED / item["sourceFile"]
        for item in manifest
    }
    missing_videos = [
        number for number in bank_numbers
        if number not in videos or not videos[number].is_file()
    ]
    if missing_videos:
        raise RuntimeError(f"Missing uploaded videos for banks: {missing_videos}")

    references_by_bank = load_references(pdf_by_number)
    rows_by_bank = {}
    with ThreadPoolExecutor(max_workers=min(2, len(bank_numbers))) as executor:
        futures = {
            executor.submit(
                derive_bank,
                bank_number,
                videos[bank_number],
                references_by_bank[bank_number],
                args.sample_interval,
            ): bank_number
            for bank_number in bank_numbers
        }
        for future in as_completed(futures):
            bank_number = futures[future]
            row = future.result()
            rows_by_bank[bank_number] = row
            print(
                f"Bank {bank_number}: detected {row['detectedQuestions']}/48; "
                f"inferred={row['inferredQuestions']}",
                flush=True,
            )
    banks = [rows_by_bank[number] for number in bank_numbers]

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps({
            "sampleIntervalSeconds": args.sample_interval,
            "mappingSource": "uploaded attachment order, cross-checked against named banks 51–53 and 64",
            "banks": banks,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
