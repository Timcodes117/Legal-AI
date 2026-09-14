# Ace: speech benchmark

This is the only technical task we still need from you for the Sahara submit. You are **not** changing the app. You are scoring how well Sahara hears Yoruba–English and Hausa–English compared with two other speech models (Gemini and Whisper).

Timothy already wrote the script. You run it, wait, and send back one table.

**Deadline:** 15 September 2026, 11:59pm WAT. If this hangs, skip to the demo video first and come back.

---

## What you need

- A computer with **Python 3.10+** (Windows is fine).
- This repo cloned (same folder Timothy uses is best).
- About **30–90 minutes** for the full run. Do not use the live app’s Gemini key for lots of extra questions on the same day.
- **8 GB RAM machines:** close Chrome tabs and Cursor if the PC starts swapping. Use Whisper **tiny** only (the script already does). Do **not** change it to `small` or `medium`.

Ask Timothy for these three values if they are not already in `backend/.env` on that machine:

| Name | What it is |
|---|---|
| `INTRON_API_KEY` | Sahara / Intron voice key |
| `GEMINI_API_KEY` | Google AI Studio key |
| `HF_TOKEN` | Hugging Face **read** token (you create this) |

Never commit `.env`. Never paste keys into Slack/GitHub.

---

## 1. Hugging Face (once)

AfriSwitch is **gated**. The script cannot download clips until you do this:

1. Make a Hugging Face account: https://huggingface.co/join
2. Open https://huggingface.co/datasets/intronhealth/AfriSwitch and **accept access**.
3. Create a token: https://huggingface.co/settings/tokens → **Read**.
4. Open `backend/.env` and add (or replace) this line:

```text
HF_TOKEN=hf_your_token_here
```

If `backend/.env` does not exist, copy `backend/.env.example` to `backend/.env` and fill `INTRON_API_KEY`, `GEMINI_API_KEY`, and `HF_TOKEN`. Leave `WHISPER_MODEL=tiny`.

---

## 2. Install (once, from the repo root)

**Windows (PowerShell):**

```powershell
cd C:\Users\Timothy\Documents\sahara-intron\hackathon
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install -r requirements-benchmark.txt
```

**Mac / Linux:**

```bash
cd /path/to/hackathon
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-benchmark.txt
```

You do **not** need to start the website or the API. Do not run Vite. Do not run `uvicorn`.

---

## 3. Smoke test (2 clips per language)

Still in the repo root, with the venv active:

**Windows:**

```powershell
.\.venv\Scripts\python.exe scripts\benchmark_asr.py --limit 2
```

**Mac / Linux:**

```bash
.venv/bin/python scripts/benchmark_asr.py --limit 2
```

You should see it load AfriSwitch, then lines like `sahara wer=...`, `gemini wer=...`, `whisper wer=...`.

**If it stops immediately** and mentions AfriSwitch / `HF_TOKEN`: go back to step 1. Access must be accepted on that Hugging Face account, and the token must be a **read** token in `backend/.env`.

**If Gemini 503 / quota:** the app already used some free daily Gemini calls. Wait, or ask Timothy. Whisper and Sahara can still run; we still want Gemini in the table if possible.

---

## 4. Full run (25 clips per language)

Only after the smoke test works:

```powershell
.\.venv\Scripts\python.exe scripts\benchmark_asr.py --limit 25
```

That is 25 Yoruba + 25 Hausa clips. Each clip is scored on Sahara, Gemini, and Whisper. There is a short pause between API calls.

Gemini’s **free** daily cap is small (~20 requests/day on some keys). A full 25-per-language run is **50 Gemini calls**, so it may fail halfway. If that happens:

- Keep whatever table was written.
- Or rerun a smaller set that still shows all three models:

```powershell
.\.venv\Scripts\python.exe scripts\benchmark_asr.py --limit 8
```

`--limit 8` is 16 Gemini calls and is more likely to finish on a free key. Prefer `--limit 25` if Gemini still has quota.

Do **not** pass `--skip-gemini` or `--skip-whisper`. The submit needs Sahara **and at least two other** speech models.

---

## 5. What to send back

When it finishes, two files appear:

| File | What to do |
|---|---|
| `benchmark/results/wer.md` | **Send this** (or commit it). This is the table for the submit. |
| `benchmark/results/wer.json` | Leave it. It is gitignored. Do not email it unless Timothy asks. |

The table looks like this (numbers will differ):

```text
| Model | Yoruba–English | Hausa–English |
| Sahara | 0.xxx | 0.xxx |
| gemini | 0.xxx | 0.xxx |
| whisper | 0.xxx | 0.xxx |
```

**Lower WER is better.** We are not trying to “win” every cell. We are showing a fair comparison on the same AfriSwitch clips.

Tell Timothy: smoke passed / full finished / Gemini quota stopped us at `--limit N`. Attach `wer.md`.

---

## Do not

- Do not set `WHISPER_MODEL` to `small` or `medium` on an 8 GB laptop.
- Do not commit `backend/.env` or paste keys.
- Do not run this against the live Render site; it uses local `.env` and the public Sahara/Gemini APIs.
- Do not start the frontend “to help” the benchmark. It only uses extra RAM.

---

## If you get stuck

| Message | Fix |
|---|---|
| AfriSwitch is gated / HF_TOKEN | Accept dataset access, new read token, save in `backend/.env`, run again |
| Set GEMINI_API_KEY | Ask Timothy to put the key in `backend/.env` |
| Set INTRON_API_KEY | Same — Sahara cannot score without it |
| PC freezes on Whisper | Close browsers, keep `tiny`, retry smoke `--limit 2` |
| `google-genai` / `faster-whisper` missing | `pip install -r requirements-benchmark.txt` inside the venv |

You are done when `benchmark/results/wer.md` exists and has Sahara, gemini, and whisper rows. Send that file to Timothy for the submit pack.
