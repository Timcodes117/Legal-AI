# Court Rights

A voice-first guide to Nigerian first-appearance rights. Speak in English, Yoruba, Hausa, or a mix. [Sahara](https://docs.voice.intron.io/docs/index/introduction) transcribes the audio; the API returns what happens in court, key rights, and phrases you can use.

This is general information, not legal advice. For a real case, contact a lawyer or [Legal Aid](https://nulai.org).

**Live API:** [https://legal-ai-api-c6v0.onrender.com/api/health](https://legal-ai-api-c6v0.onrender.com/api/health)

## Features

- Language picker: English, Yoruba, Hausa
- Hold-to-talk or typed questions
- First-appearance workflow, rights, and sample phrases
- Optional spoken reply (Sahara TTS)
- Content in `content/` (English, Yoruba, Hausa)

## Stack

| Layer | Tech |
|---|---|
| API | FastAPI, Sahara STT/TTS |
| UI | Vite, React |
| Content | JSON (`content/`) |

## Repository

```
backend/     FastAPI app
frontend/    Vite + React
content/     Rights, workflow, disclaimers
prompts/     Agent system prompt
scripts/     Markdown → JSON converter
```

## Local development

**1. Environment**

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

| File | Variables |
|---|---|
| `backend/.env` | `INTRON_API_KEY`, `CORS_ORIGINS`, Sahara URLs |
| `frontend/.env` | `VITE_API_BASE` (empty locally; Render URL in production) |

Get `INTRON_API_KEY` from [voice.intron.io](https://voice.intron.io) → Developer.

**2. API** (repo root)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

**3. UI**

```powershell
cd frontend
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). With `VITE_API_BASE` empty, Vite proxies `/api` to port 8000.

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness |
| `GET` | `/api/briefing?language=en` | First-appearance pack (`en` / `yo` / `ha`) |
| `POST` | `/api/ask` | `{ "text", "language" }` → same pack |
| `POST` | `/api/transcribe` | Audio + language → Sahara STT → pack |
| `POST` | `/api/speak` | Short Sahara TTS clip |

Sahara language codes: `en`, `yo` (Yoruba–English), `ha` (Hausa–English).

## Deployment

The repo is a monorepo. API and UI are separate hosts.

**Render (API)** — root directory empty:

```text
Build:  pip install -r requirements.txt
Start:  uvicorn backend.app:app --host 0.0.0.0 --port $PORT
```

Set `INTRON_API_KEY` and `CORS_ORIGINS` (include the Vercel origin).

**Vercel (UI)** — root directory `frontend`:

```text
Build:   npm run build
Output:  dist
```

Set `VITE_API_BASE` to `https://legal-ai-api-c6v0.onrender.com` (no trailing slash), then redeploy.

## Content updates

Legal copy is maintained as markdown and converted into `content/*.json`:

```powershell
.\.venv\Scripts\python.exe scripts\convert_legal_content.py
```

Restart the API after converting so it reloads JSON.
