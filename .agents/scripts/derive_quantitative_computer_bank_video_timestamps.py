from __future__ import annotations

import json
import subprocess
from collections import Counter
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageOps


ROOT = Path(".")
ATTACHED = ROOT / "attached_assets"
PUBLIC = ROOT / "artifacts/qodratak/public/foundation/quantitative/computer-banks"
OUTPUT = ROOT / ".agents/outputs/quantitative-computer-banks/video-timestamps.json"

VIDEO_GLOB = "FILE_1448-04-17_*.mp4"
VIDEO_COUNT = 20
VIDEO_ONLY_BANKS = {15, 23}
QUESTION_BANKS = [number for number in range(11, 31) if number not in VIDEO_ONLY_BANKS]
SAMPLE_INTERVAL_SECONDS = 5
FRAME_WIDTH = 160
FRAME_HEIGHT = 80
FRAME_BYTES = FRAME_WIDTH * FRAME_HEIGHT * 3
GLYPH_WIDTH = 48
GLYPH_HEIGHT = 64
GLYPH_PIXELS = GLYPH_WIDTH * GLYPH_HEIGHT
MAX_MATCH_DISTANCE = 0.22
MIN_MATCH_MARGIN = 0.012

# These badge samples were visually checked against the displayed question
# numbers. The two video series use slightly different badge rendering than
# their PDF page images, so selected video-style templates supplement the PDF
# templates where the glyphs are ambiguous.
FAMILY_PROTOTYPES = {
    "first": {
        1: [(0, 30)],
        2: [(0, 120)],
        3: [(0, 230)],
        4: [(0, 270), (0, 300), (0, 330)],
        5: [(0, 360)],
        6: [(0, 390)],
        11: [(2, 900)],
        12: [(2, 920)],
        13: [(2, 965), (2, 1015)],
        14: [(2, 1100)],
        15: [(2, 1200)],
        16: [(2, 1280)],
        41: [(2, 3045)],
    },
    "second": {
        1: [(13, 30)],
        2: [(13, 120)],
        3: [(13, 240)],
        4: [(13, 300)],
        5: [(13, 360)],
        6: [(13, 450)],
    },
}


def run_checked(args: list[str], *, text: bool = False) -> str | bytes:
    result = subprocess.run(args, check=True, capture_output=True, text=text)
    return result.stdout


def video_duration(path: Path) -> float:
    output = run_checked([
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(path),
    ], text=True)
    try:
        return float(output.strip())
    except ValueError as error:
        raise RuntimeError(f"Could not read video duration: {path.name}") from error


def badge_bounds(roi: Image.Image) -> tuple[int, int, int, int] | None:
    width, height = roi.size
    pixels = roi.convert("RGB").load()
    green = bytearray(width * height)
    for y in range(height):
        row_offset = y * width
        for x in range(width):
            red, channel_green, blue = pixels[x, y]
            if (
                channel_green > 100
                and channel_green > red * 1.18
                and channel_green > blue * 1.12
                and red < 190
            ):
                green[row_offset + x] = 1

    visited = bytearray(width * height)
    components: list[tuple[int, int, int, int, int]] = []
    for start in range(width * height):
        if not green[start] or visited[start]:
            continue
        visited[start] = 1
        stack = [start]
        area = 0
        min_x = max_x = start % width
        min_y = max_y = start // width
        while stack:
            index = stack.pop()
            y, x = divmod(index, width)
            area += 1
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)
            neighbors = []
            if x:
                neighbors.append(index - 1)
            if x + 1 < width:
                neighbors.append(index + 1)
            if y:
                neighbors.append(index - width)
            if y + 1 < height:
                neighbors.append(index + width)
            for neighbor in neighbors:
                if green[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    stack.append(neighbor)

        box_width = max_x + 1 - min_x
        box_height = max_y + 1 - min_y
        aspect = box_width / max(1, box_height)
        if area > 30 and 0.7 <= aspect <= 1.4:
            components.append((area, min_x, min_y, max_x + 1, max_y + 1))

    if not components:
        return None
    _, left, top, right, bottom = max(components)
    return left, top, right, bottom


def glyph_from_badge_roi(roi: Image.Image) -> int | None:
    bounds = badge_bounds(roi)
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
    )).convert("L")
    normalized = ImageOps.autocontrast(
        crop.resize((GLYPH_WIDTH, GLYPH_HEIGHT), Image.Resampling.BILINEAR)
    )
    mask = bytes(1 if pixel < 85 else 0 for pixel in normalized.get_flattened_data())
    if not any(mask):
        return None
    return int.from_bytes(mask, "big")


def question_image_glyph(path: Path) -> int | None:
    with Image.open(path) as source:
        image = source.convert("RGB")
        scale = 640 / image.width
        image = image.resize(
            (640, max(1, round(image.height * scale))),
            Image.Resampling.LANCZOS,
        )
        roi = image.crop((
            round(image.width * 0.78),
            0,
            round(image.width * 0.98),
            max(1, round(image.height * 0.22)),
        ))
        return glyph_from_badge_roi(roi)


def video_frame_glyph(path: Path, seconds: int) -> int | None:
    frame = run_checked([
        "ffmpeg",
        "-v", "error",
        "-ss", str(seconds),
        "-i", str(path),
        "-frames:v", "1",
        "-vf", f"scale=640:360,crop={FRAME_WIDTH}:{FRAME_HEIGHT}:480:0",
        "-f", "image2pipe",
        "-vcodec", "png",
        "-",
    ])
    from io import BytesIO

    with Image.open(BytesIO(frame)) as image:
        return glyph_from_badge_roi(image.convert("RGB"))


def family_for_bank(number: int) -> str:
    return "first" if number <= 23 else "second"


def load_reference_glyphs(
    bank_numbers: Iterable[int],
) -> dict[int, list[int]]:
    references: dict[int, list[int]] = {number: [] for number in range(1, 49)}
    for bank_number in bank_numbers:
        bank_dir = PUBLIC / f"exam-{bank_number:02d}"
        for question_number in range(1, 49):
            image_path = bank_dir / f"question-{question_number:03d}.jpeg"
            if not image_path.exists():
                alternatives = list(bank_dir.glob(
                    f"question-{question_number:03d}.*"
                ))
                image_path = alternatives[0] if alternatives else image_path
            if not image_path.exists():
                continue
            glyph = question_image_glyph(image_path)
            if glyph is not None and glyph not in references[question_number]:
                references[question_number].append(glyph)
    return references


def load_video_prototypes(
    family: str,
    videos: list[Path],
    references: dict[int, list[int]],
) -> None:
    for question_number, samples in FAMILY_PROTOTYPES[family].items():
        for video_index, seconds in samples:
            if video_index >= len(videos):
                continue
            prototype = video_frame_glyph(videos[video_index], seconds)
            if (
                prototype is not None
                and prototype not in references[question_number]
            ):
                references[question_number].append(prototype)


def frame_predictions(path: Path, references: dict[int, list[int]]) -> list[dict]:
    args = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel", "error",
        "-i", str(path),
        "-vf",
        (
            f"fps=1/{SAMPLE_INTERVAL_SECONDS},"
            f"scale=640:360,crop={FRAME_WIDTH}:{FRAME_HEIGHT}:480:0,"
            "format=rgb24"
        ),
        "-pix_fmt", "rgb24",
        "-f", "rawvideo",
        "pipe:1",
    ]
    process = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if process.stdout is None:
        raise RuntimeError("Could not read sampled video frames")

    predictions: list[dict] = []
    sample_index = 0
    while True:
        frame_bytes = process.stdout.read(FRAME_BYTES)
        if not frame_bytes:
            break
        if len(frame_bytes) != FRAME_BYTES:
            raise RuntimeError(
                f"Incomplete video frame while sampling {path.name}"
            )
        with Image.frombytes("RGB", (FRAME_WIDTH, FRAME_HEIGHT), frame_bytes) as roi:
            glyph = glyph_from_badge_roi(roi)

        ranked: list[tuple[float, int]] = []
        candidate_distances: list[float | None] = [None] * 48
        if glyph is not None:
            for question_number, templates in references.items():
                if not templates:
                    continue
                distance = min(
                    (glyph ^ template).bit_count() / GLYPH_PIXELS
                    for template in templates
                )
                ranked.append((distance, question_number))
                candidate_distances[question_number - 1] = distance
        ranked.sort()
        best = ranked[0] if ranked else None
        second = ranked[1] if len(ranked) > 1 else None
        margin = second[0] - best[0] if best and second else None
        label = (
            best[1]
            if best
            and best[0] <= MAX_MATCH_DISTANCE
            and (margin is None or margin >= MIN_MATCH_MARGIN)
            else None
        )
        predictions.append({
            "seconds": sample_index * SAMPLE_INTERVAL_SECONDS,
            "questionNumber": label,
            "matchDistance": round(best[0], 5) if best else None,
            "margin": round(margin, 5) if margin is not None else None,
            "glyph": glyph,
            "candidateDistances": (
                [round(distance, 5) if distance is not None else None
                 for distance in candidate_distances]
                if glyph is not None
                else None
            ),
        })
        sample_index += 1

    process.stdout.close()
    stderr = process.stderr.read().decode("utf-8", errors="replace") if process.stderr else ""
    exit_code = process.wait()
    if exit_code:
        raise RuntimeError(
            f"ffmpeg failed while sampling {path.name}: {stderr.strip()}"
        )
    return predictions


def smooth_labels(predictions: list[dict]) -> list[int | None]:
    raw = [item["questionNumber"] for item in predictions]
    smoothed: list[int | None] = []
    for index, label in enumerate(raw):
        nearby = [
            value
            for value in raw[max(0, index - 1):min(len(raw), index + 2)]
            if value is not None
        ]
        if not nearby:
            smoothed.append(None)
            continue
        counts = Counter(nearby)
        winners = [
            value
            for value, count in counts.items()
            if count == max(counts.values())
        ]
        smoothed.append(label if label in winners else min(winners))

    runs: list[tuple[int, int, int]] = []
    index = 0
    while index < len(smoothed):
        label = smoothed[index]
        if label is None:
            index += 1
            continue
        end = index + 1
        while end < len(smoothed) and smoothed[end] == label:
            end += 1
        runs.append((index, end, label))
        index = end

    rejected_runs: set[int] = set()
    for run_index in range(1, len(runs) - 1):
        previous_label = runs[run_index - 1][2]
        label = runs[run_index][2]
        next_label = runs[run_index + 1][2]
        if previous_label < next_label and label > next_label + 1:
            rejected_runs.add(run_index)
    for run_index in rejected_runs:
        start, end, _ = runs[run_index]
        smoothed[start:end] = [None] * (end - start)

    previous = 0
    for index, label in enumerate(smoothed):
        if label is None:
            continue
        if label < previous:
            smoothed[index] = None
        else:
            previous = label
    return smoothed


def calibrate_video_prototypes(
    video_path: Path,
    references: dict[int, list[int]],
) -> int:
    """Learn video-style glyphs only from stable, high-confidence labels."""
    predictions = frame_predictions(video_path, references)
    labels = smooth_labels(predictions)
    candidates: dict[int, list[tuple[float, int, int]]] = {}
    for index, (item, label) in enumerate(zip(predictions, labels)):
        if label is None or item["questionNumber"] != label:
            continue
        glyph = item.get("glyph")
        distances = item.get("candidateDistances")
        if glyph is None or not distances or distances[label - 1] is None:
            continue
        distance = distances[label - 1]
        if distance > 0.12:
            continue
        candidates.setdefault(label, []).append((distance, index, glyph))

    added = 0
    for question_number, samples in candidates.items():
        samples.sort(key=lambda sample: sample[0])
        selected: list[tuple[int, int]] = []
        for _, index, glyph in samples:
            if any(abs(index - existing_index) < 3 for existing_index, _ in selected):
                continue
            selected.append((index, glyph))
            if len(selected) == 3:
                break
        for _, glyph in selected:
            if glyph not in references[question_number]:
                references[question_number].append(glyph)
                added += 1
    print(
        f"Calibrated {video_path.name}: "
        f"{len(candidates)}/48 questions, {added} video glyphs"
    )
    return len(candidates)


def align_missing_questions(
    predictions: list[dict],
    start_index: int,
    end_index: int,
    start_question: int,
    end_question: int,
) -> dict[int, tuple[int, float]]:
    """Align missing labels between two reliable observations without moving anchors."""
    if end_question <= start_question + 1 or end_index <= start_index:
        return {}
    frame_indices = [
        index
        for index in range(start_index, end_index + 1)
        if predictions[index].get("candidateDistances") is not None
    ]
    required_states = end_question - start_question + 1
    if (
        len(frame_indices) < required_states
        or frame_indices[0] != start_index
        or frame_indices[-1] != end_index
    ):
        return {}

    first_distances = predictions[start_index]["candidateDistances"]
    first_emission = first_distances[start_question - 1]
    if first_emission is None:
        return {}
    costs = {start_question: first_emission}
    parent_rows: list[dict[int, int]] = []

    for position, frame_index in enumerate(frame_indices[1:], start=1):
        is_final = position == len(frame_indices) - 1
        distances = predictions[frame_index]["candidateDistances"]
        next_costs: dict[int, float] = {}
        parents: dict[int, int] = {}
        lowest_question = start_question
        highest_question = min(end_question, start_question + position)
        for question_number in range(lowest_question, highest_question + 1):
            if is_final and question_number != end_question:
                continue
            if not is_final and question_number == end_question:
                continue
            emission = distances[question_number - 1]
            if emission is None:
                continue
            for previous_question in (question_number, question_number - 1):
                if previous_question not in costs:
                    continue
                transition = 0.001 if previous_question < question_number else 0.0
                candidate_cost = costs[previous_question] + transition + emission
                if candidate_cost < next_costs.get(question_number, float("inf")):
                    next_costs[question_number] = candidate_cost
                    parents[question_number] = previous_question
        if not next_costs:
            return {}
        costs = next_costs
        parent_rows.append(parents)

    if end_question not in costs:
        return {}
    states = [end_question]
    state = end_question
    for parents in reversed(parent_rows):
        state = parents.get(state)
        if state is None:
            return {}
        states.append(state)
    states.reverse()
    if set(states) != set(range(start_question, end_question + 1)):
        return {}

    aligned: dict[int, tuple[int, float]] = {}
    for frame_index, question_number in zip(frame_indices, states):
        if question_number <= start_question or question_number >= end_question:
            continue
        distances = predictions[frame_index]["candidateDistances"]
        distance = distances[question_number - 1]
        if distance is not None and question_number not in aligned:
            aligned[question_number] = (
                predictions[frame_index]["seconds"],
                distance,
            )
    return aligned


def timestamps_from_predictions(
    predictions: list[dict],
    duration: float,
) -> tuple[list[dict], list[int]]:
    labels = smooth_labels(predictions)
    observed: dict[int, tuple[int, float, int]] = {}
    for index, (item, label) in enumerate(zip(predictions, labels)):
        if (
            label is None
            or item.get("questionNumber") != label
            or label < 1
            or label > 48
            or label in observed
        ):
            continue
        candidate_distances = item.get("candidateDistances")
        match_distance = (
            candidate_distances[label - 1]
            if candidate_distances and candidate_distances[label - 1] is not None
            else item["matchDistance"]
        )
        observed[label] = (
            item["seconds"],
            match_distance if match_distance is not None else 1.0,
            index,
        )

    times = {question_number: item[0] for question_number, item in observed.items()}
    inferred: list[int] = []
    inferred_distances: dict[int, float] = {}
    anchors = sorted(
        (question_number, item[2])
        for question_number, item in observed.items()
    )
    for (start_question, start_index), (end_question, end_index) in zip(
        anchors,
        anchors[1:],
    ):
        aligned = align_missing_questions(
            predictions,
            start_index,
            end_index,
            start_question,
            end_question,
        )
        for question_number, (seconds, distance) in aligned.items():
            if question_number not in times:
                times[question_number] = seconds
                inferred.append(question_number)
                inferred_distances[question_number] = distance

    for question_number in range(1, 49):
        if question_number in times:
            continue
        previous = max((q for q in times if q < question_number), default=None)
        following = min((q for q in times if q > question_number), default=None)
        if previous is not None and following is not None:
            start = times[previous]
            end = times[following]
            gap = following - previous
            times[question_number] = round(
                start + (end - start) * (question_number - previous) / gap
            )
        elif following is not None:
            times[question_number] = max(
                0,
                times[following] - 60 * (following - question_number),
            )
        elif previous is not None:
            times[question_number] = min(
                max(0, round(duration)),
                times[previous] + 60 * (question_number - previous),
            )
        else:
            times[question_number] = round(
                duration * (question_number - 1) / 48
            )
        inferred.append(question_number)

    previous_seconds = -1
    for question_number in range(1, 49):
        seconds = int(times[question_number])
        if seconds <= previous_seconds:
            seconds = previous_seconds + SAMPLE_INTERVAL_SECONDS
            times[question_number] = seconds
            if question_number not in inferred:
                inferred.append(question_number)
        previous_seconds = seconds

    rows = []
    for question_number in range(1, 49):
        observed_item = observed.get(question_number)
        rows.append({
            "questionNumber": question_number,
            "seconds": int(times[question_number]),
            "matchDistance": (
                observed_item[1]
                if observed_item
                else inferred_distances.get(question_number)
            ),
            "inferred": question_number in inferred,
        })
    return rows, sorted(inferred)


def main() -> None:
    videos = sorted(ATTACHED.glob(VIDEO_GLOB))
    if len(videos) != VIDEO_COUNT:
        raise RuntimeError(
            f"Expected exactly {VIDEO_COUNT} source videos matching "
            f"{VIDEO_GLOB}; found {len(videos)}"
        )

    family_banks = {
        "first": [number for number in QUESTION_BANKS if number <= 22],
        "second": [number for number in QUESTION_BANKS if number >= 24],
    }
    family_references = {
        family: load_reference_glyphs(numbers)
        for family, numbers in family_banks.items()
    }
    for family, references in family_references.items():
        load_video_prototypes(family, videos, references)
    calibration_video_indices = {
        "first": 2,
        "second": 13,
    }
    for family, video_index in calibration_video_indices.items():
        calibrate_video_prototypes(
            videos[video_index],
            family_references[family],
        )

    banks = []
    for video_index, video_path in enumerate(videos):
        bank_number = 11 + video_index
        duration = video_duration(video_path)
        row = {
            "number": bank_number,
            "videoFile": video_path.name,
            "videoUrl": (
                f"/foundation/quantitative/computer-banks/"
                f"computer-bank-{bank_number:02d}.mp4"
            ),
            "durationSeconds": round(duration),
            "sampleIntervalSeconds": SAMPLE_INTERVAL_SECONDS,
            "questionTimestamps": [],
        }
        if bank_number in VIDEO_ONLY_BANKS:
            banks.append(row)
            print(f"Bank {bank_number}: video only, {round(duration)}s")
            continue

        predictions = frame_predictions(
            video_path,
            family_references[family_for_bank(bank_number)],
        )
        timestamps, inferred = timestamps_from_predictions(predictions, duration)
        row["questionTimestamps"] = timestamps
        row["sampledFrames"] = len(predictions)
        row["detectedQuestions"] = 48 - len(inferred)
        row["inferredQuestions"] = inferred
        banks.append(row)
        print(
            f"Bank {bank_number}: {len(predictions)} frames, "
            f"{48 - len(inferred)}/48 detected, "
            f"inferred={inferred}"
        )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps({
            "sampleIntervalSeconds": SAMPLE_INTERVAL_SECONDS,
            "banks": banks,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()