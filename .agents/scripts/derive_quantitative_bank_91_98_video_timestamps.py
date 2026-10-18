#!/usr/bin/env python3
"""Detect question-number badge positions in the supplied 91–98 bank videos."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TIMING_HELPER = ROOT / ".agents/scripts/derive_quantitative_computer_bank_video_timestamps.py"
VIDEO_MANIFEST = ROOT / ".agents/scripts/quantitative-bank-91-98-video-manifest.json"
IMAGE_ROOT = ROOT / "generated-artifacts/quantitative-banks-91-110/source-images"
ATTACHMENTS = ROOT / "attached_assets"
OUTPUT = ROOT / ".agents/outputs/quantitative-computer-banks/video-timestamps-91-98.json"

spec = importlib.util.spec_from_file_location("computer_bank_video_timing", TIMING_HELPER)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Could not load timing helpers from {TIMING_HELPER}")
timing = importlib.util.module_from_spec(spec)
spec.loader.exec_module(timing)


def main() -> None:
    videos = json.loads(VIDEO_MANIFEST.read_text(encoding="utf-8"))
    # These question cards are wide PDF crops; their numbered badge is below the
    # publisher header. The matching video badge sits 40px below the frame top.
    timing.FRAME_TOP_Y = 40
    references = timing.load_reference_glyphs(
        range(91, 111),
        image_root=IMAGE_ROOT,
        badge_region_bottom=0.45,
    )
    if not all(references.values()):
        missing = [number for number, glyphs in references.items() if not glyphs]
        raise RuntimeError(f"Question-number reference glyphs are missing: {missing}")

    results = []
    for item in videos:
        bank_number = int(item["bankNumber"])
        video_path = ATTACHMENTS / item["sourceFile"]
        if not video_path.is_file():
            raise FileNotFoundError(video_path)
        duration = timing.video_duration(video_path)
        predictions = timing.frame_predictions(video_path, references)
        labels = timing.smooth_labels(predictions)
        timestamps, inferred = timing.timestamps_from_predictions(predictions, duration)
        direct: dict[int, dict] = {}
        for prediction, label in zip(predictions, labels):
            if (
                label is None
                or prediction.get("questionNumber") != label
                or label in direct
            ):
                continue
            direct[label] = {
                "seconds": prediction["seconds"],
                "matchDistance": prediction.get("matchDistance"),
            }

        seconds = [row["seconds"] for row in timestamps]
        monotonic = all(left < right for left, right in zip(seconds, seconds[1:]))
        within_duration = bool(seconds) and seconds[-1] < duration
        usable = len(direct) >= 24 and monotonic and within_duration
        result = {
            "bankNumber": bank_number,
            "videoFile": item["sourceFile"],
            "videoUrl": f"/foundation/quantitative/computer-banks/computer-bank-{bank_number:02d}.mp4",
            "durationSeconds": round(duration, 3),
            "sampleIntervalSeconds": timing.SAMPLE_INTERVAL_SECONDS,
            "sampledFrames": len(predictions),
            "directAnchorCount": len(direct),
            "directAnchorQuestions": sorted(direct),
            "inferredQuestions": inferred,
            "timingUsable": usable,
            "questionTimestamps": timestamps,
            "directAnchors": direct,
        }
        results.append(result)
        print(
            f"Bank {bank_number}: {len(direct)}/48 direct badge anchors; "
            f"timing usable={usable}; inferred={len(inferred)}"
        )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(
            {
                "method": "video_question_badge_matching_5s_samples",
                "notes": "Interpolated timestamps are explicitly marked inferred; never treated as manually verified.",
                "banks": results,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
