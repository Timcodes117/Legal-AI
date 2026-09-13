"""Score Sahara vs Gemini vs faster-whisper on AfriSwitch yo/ha clips."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import sys
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
import soundfile as sf
from dotenv import load_dotenv
from jiwer import wer

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / "backend" / ".env")
load_dotenv(ROOT / ".env")

from backend.services.sahara import transcribe_audio  # noqa: E402

LANGS = {"yoruba": "yo", "hausa": "ha"}
PROMPT = (
    "You are an automatic speech recognizer. "
    "Transcribe the audio word for word in the original language mix. "
    "Do not answer the speaker. Do not summarize. Do not give legal advice. "
    "Output only the transcript text."
)


def normalize(text: str) -> str:
    text = (text or "").lower().replace("[[en]]", " ").replace("[[/en]]", " ")
    text = re.sub(r"[^a-z0-9àáèéẹẹ́ìíòóọọ́ùúṣń\s']", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def to_wav_bytes(array, sampling_rate: int) -> bytes:
    import io

    buf = io.BytesIO()
    audio = np.asarray(array, dtype=np.float32)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    sf.write(buf, audio, int(sampling_rate), format="WAV")
    return buf.getvalue()


def login_hf() -> None:
    token = os.getenv("HF_TOKEN", "").strip()
    if not token or token == "paste_your_hf_token_here":
        raise SystemExit(
            "AfriSwitch is gated. 1) Open https://huggingface.co/datasets/intronhealth/AfriSwitch "
            "and accept access. 2) Create a token at https://huggingface.co/settings/tokens "
            "3) Add HF_TOKEN=... to backend/.env"
        )
    from huggingface_hub import login

    login(token=token, add_to_git_credential=False)


def load_clips(config: str, limit: int, max_seconds: float):
    from datasets import load_dataset

    stream = load_dataset("intronhealth/AfriSwitch", config, split="test", streaming=True)
    clips = []
    for row in stream:
        if len(clips) >= limit:
            break
        ref = (row.get("transcription") or "").strip()
        audio = row.get("audio") or {}
        array = audio.get("array")
        rate = audio.get("sampling_rate")
        duration = float(row.get("duration") or 0)
        if not ref or array is None or not rate:
            continue
        if duration > max_seconds:
            continue
        clips.append(
            {
                "id": row.get("filename") or f"{config}-{len(clips)}",
                "language": config,
                "duration": duration,
                "reference": ref,
                "wav": to_wav_bytes(array, rate),
            }
        )
    if len(clips) < limit:
        print(f"warning: only found {len(clips)} {config} clips under {max_seconds}s")
    return clips


def score(reference: str, hypothesis: str) -> float:
    ref = normalize(reference)
    hyp = normalize(hypothesis)
    if not ref:
        return 1.0
    if not hyp:
        return 1.0
    return float(wer(ref, hyp))


async def sahara_one(clip: dict) -> str:
    result = await transcribe_audio(clip["wav"], f"{clip['id']}.wav", LANGS[clip["language"]], "audio/wav")
    return (result.get("transcript") or "").strip()


def gemini_one(client, model: str, clip: dict) -> str:
    from google.genai import types

    response = client.models.generate_content(
        model=model,
        contents=[
            PROMPT,
            types.Part.from_bytes(data=clip["wav"], mime_type="audio/wav"),
        ],
    )
    return (response.text or "").strip()


def whisper_one(model, clip: dict) -> str:
    import io

    segments, _info = model.transcribe(io.BytesIO(clip["wav"]), beam_size=1)
    return " ".join(segment.text for segment in segments).strip()


def write_report(rows: list[dict], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    by = defaultdict(list)
    for row in rows:
        by[(row["model"], row["language"])].append(row["wer"])

    models = ["sahara", "gemini", "whisper"]
    langs = ["yoruba", "hausa"]
    lines = [
        "# ASR benchmark (AfriSwitch)",
        "",
        "Same clips for every model. WER = word error rate (lower is better).",
        "",
        "| Model | Yoruba–English | Hausa–English |",
        "|---|---:|---:|",
    ]
    for model in models:
        cells = []
        for lang in langs:
            vals = by.get((model, lang), [])
            cells.append(f"{sum(vals) / len(vals):.3f}" if vals else "—")
        lines.append(f"| {model} | {cells[0]} | {cells[1]} |")
    lines.extend(
        [
            "",
            f"Clips: {len({(r['language'], r['id']) for r in rows if r['model'] == 'sahara'})} per language (or fewer if a model failed).",
            "Whisper model: tiny (CPU). Gemini: AI Studio. Sahara: Intron API used by the live app.",
            "",
        ]
    )
    (out_dir / "wer.md").write_text("\n".join(lines), encoding="utf-8")
    (out_dir / "wer.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
    print("\n".join(lines))


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=25, help="clips per language")
    parser.add_argument("--max-seconds", type=float, default=12.0)
    parser.add_argument("--sleep", type=float, default=1.2, help="pause between API calls")
    parser.add_argument("--whisper-model", default=os.getenv("WHISPER_MODEL", "tiny"))
    parser.add_argument("--gemini-model", default=os.getenv("GEMINI_STT_MODEL", "gemini-2.0-flash"))
    parser.add_argument("--skip-whisper", action="store_true")
    parser.add_argument("--skip-gemini", action="store_true")
    parser.add_argument("--skip-sahara", action="store_true")
    return parser.parse_args()


async def main() -> int:
    args = parse_args()
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not args.skip_gemini and (not gemini_key or gemini_key == "paste_your_gemini_key_here"):
        print("Set GEMINI_API_KEY in backend/.env")
        return 1
    if not args.skip_sahara:
        from backend.core.config import intron_api_key

        intron_api_key()

    login_hf()
    print("Loading AfriSwitch clips (streaming, short clips only)...")
    clips = []
    for config in LANGS:
        clips.extend(load_clips(config, args.limit, args.max_seconds))
    print(f"Using {len(clips)} clips")

    whisper_model = None
    if not args.skip_whisper:
        from faster_whisper import WhisperModel

        print(f"Loading Whisper {args.whisper_model} on CPU (int8)...")
        whisper_model = WhisperModel(args.whisper_model, device="cpu", compute_type="int8", cpu_threads=2)

    gemini_client = None
    if not args.skip_gemini:
        from google import genai

        gemini_client = genai.Client(api_key=gemini_key)

    rows = []
    for index, clip in enumerate(clips, start=1):
        print(f"[{index}/{len(clips)}] {clip['language']} {clip['id']} ({clip['duration']:.1f}s)")
        if not args.skip_sahara:
            try:
                hyp = await sahara_one(clip)
                rows.append(
                    {
                        "id": clip["id"],
                        "language": clip["language"],
                        "model": "sahara",
                        "reference": clip["reference"],
                        "hypothesis": hyp,
                        "wer": score(clip["reference"], hyp),
                    }
                )
                print(f"  sahara wer={rows[-1]['wer']:.3f}")
            except Exception as exc:
                print(f"  sahara failed: {exc}")
                rows.append(
                    {
                        "id": clip["id"],
                        "language": clip["language"],
                        "model": "sahara",
                        "reference": clip["reference"],
                        "hypothesis": "",
                        "wer": 1.0,
                        "error": str(exc),
                    }
                )
            time.sleep(args.sleep)

        if gemini_client:
            try:
                hyp = gemini_one(gemini_client, args.gemini_model, clip)
                rows.append(
                    {
                        "id": clip["id"],
                        "language": clip["language"],
                        "model": "gemini",
                        "reference": clip["reference"],
                        "hypothesis": hyp,
                        "wer": score(clip["reference"], hyp),
                    }
                )
                print(f"  gemini wer={rows[-1]['wer']:.3f}")
            except Exception as exc:
                print(f"  gemini failed: {exc}")
                rows.append(
                    {
                        "id": clip["id"],
                        "language": clip["language"],
                        "model": "gemini",
                        "reference": clip["reference"],
                        "hypothesis": "",
                        "wer": 1.0,
                        "error": str(exc),
                    }
                )
            time.sleep(args.sleep)

        if whisper_model:
            try:
                hyp = whisper_one(whisper_model, clip)
                rows.append(
                    {
                        "id": clip["id"],
                        "language": clip["language"],
                        "model": "whisper",
                        "reference": clip["reference"],
                        "hypothesis": hyp,
                        "wer": score(clip["reference"], hyp),
                    }
                )
                print(f"  whisper wer={rows[-1]['wer']:.3f}")
            except Exception as exc:
                print(f"  whisper failed: {exc}")
                rows.append(
                    {
                        "id": clip["id"],
                        "language": clip["language"],
                        "model": "whisper",
                        "reference": clip["reference"],
                        "hypothesis": "",
                        "wer": 1.0,
                        "error": str(exc),
                    }
                )

    write_report(rows, ROOT / "benchmark" / "results")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
