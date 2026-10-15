#!/usr/bin/env python3
"""Trim the first 30 seconds from owner-provided Tahsili lesson videos.

This intentionally does not download videos from YouTube. Pass only original
video files that you have permission to edit.
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_DIR = ROOT / "generated-artifacts" / "tahsili-videos"
TRIM_SECONDS = 30.0


def probe_video(path: Path) -> tuple[float, dict]:
    result = subprocess.run(
        [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration:stream=codec_type,width,height",
            "-of", "json",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    metadata = json.loads(result.stdout)
    streams = metadata.get("streams", [])
    if not any(stream.get("codec_type") == "video" for stream in streams):
        raise ValueError("الملف لا يحتوي على مسار فيديو.")
    durations = [
        float(value)
        for value in [
            metadata.get("format", {}).get("duration"),
            *(stream.get("duration") for stream in streams),
        ]
        if value not in (None, "N/A", "")
    ]
    if not durations:
        raise ValueError("تعذر تحديد مدة الفيديو.")
    return max(durations), metadata


def trim_video(source: Path, output_dir: Path, overwrite: bool) -> dict:
    source = source.expanduser().resolve()
    if not source.is_file():
        raise FileNotFoundError(f"الملف غير موجود: {source}")

    duration, metadata = probe_video(source)
    if duration <= TRIM_SECONDS:
        raise ValueError(f"مدة الفيديو {duration:.2f} ثانية؛ يجب أن تزيد على 30 ثانية.")

    output_dir.mkdir(parents=True, exist_ok=True)
    output = output_dir / f"{source.stem}-after-first-30s.mp4"
    if output.exists() and not overwrite:
        raise FileExistsError(f"الملف الناتج موجود بالفعل: {output} (استخدم --overwrite لاستبداله)")

    temporary = output.with_name(f"{output.stem}.partial{output.suffix}")
    if temporary.exists():
        temporary.unlink()

    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin",
        "-i", str(source),
        "-ss", str(TRIM_SECONDS),
        "-map", "0:v:0",
        "-map", "0:a?",
        "-sn", "-dn",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        "-y", str(temporary),
    ]

    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
        output_duration, output_metadata = probe_video(temporary)
        expected_duration = duration - TRIM_SECONDS
        tolerance = max(1.5, duration * 0.005)
        if abs(output_duration - expected_duration) > tolerance:
            raise RuntimeError(
                f"المدة الناتجة غير مطابقة: المتوقع قرابة {expected_duration:.2f} "
                f"ثانية، والناتج {output_duration:.2f} ثانية."
            )
        if temporary.stat().st_size <= 0:
            raise RuntimeError("ملف الفيديو الناتج فارغ.")
        temporary.replace(output)
    except subprocess.CalledProcessError as error:
        detail = error.stderr.strip()[-2000:] if error.stderr else "خطأ غير محدد من FFmpeg."
        raise RuntimeError(f"تعذر قص الفيديو: {detail}") from error
    finally:
        if temporary.exists():
            temporary.unlink()

    video_stream = next(
        stream for stream in metadata.get("streams", [])
        if stream.get("codec_type") == "video"
    )
    return {
        "source": str(source),
        "output": str(output),
        "inputDurationSeconds": round(duration, 2),
        "removedSeconds": int(TRIM_SECONDS),
        "outputDurationSeconds": round(output_duration, 2),
        "resolution": f"{video_stream.get('width', '?')}x{video_stream.get('height', '?')}",
        "outputBytes": output.stat().st_size,
        "verified": True,
        "outputStreams": len(output_metadata.get("streams", [])),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="قص أول 30 ثانية من ملفات الفيديو الأصلية التي تملك حق تعديلها."
    )
    parser.add_argument("videos", nargs="+", type=Path, help="مسار فيديو واحد أو أكثر")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"مجلد الفيديوهات الناتجة (الافتراضي: {DEFAULT_OUTPUT_DIR})",
    )
    parser.add_argument("--overwrite", action="store_true", help="استبدال ملف ناتج موجود")
    args = parser.parse_args()

    output_dir = args.output_dir.expanduser()
    if not output_dir.is_absolute():
        output_dir = ROOT / output_dir

    results = []
    failures = []
    for video in args.videos:
        try:
            result = trim_video(video, output_dir, args.overwrite)
            results.append(result)
            print(f"تم: {result['source']} → {result['output']} ({result['outputDurationSeconds']} ث)")
        except Exception as error:  # Continue the batch and report each failed file.
            failures.append({"source": str(video), "error": str(error)})
            print(f"تعذر: {video}: {error}", file=sys.stderr)

    print(json.dumps({"processed": results, "failed": failures}, ensure_ascii=False, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
