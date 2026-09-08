# Court Rights Voice Guide

Voice-first legal-information app for the Sahara CodeSwitch Africa Challenge (Legal & Public Services). Speak in English, Yoruba, Hausa, or a mix. Sahara transcribes; the app returns first-appearance rights and what you can say.

This is information, not legal advice.

## What is in this repo (Person B)

- `backend/` — FastAPI. Sahara STT/TTS stay on the server so the API key is never in the browser.

```
backend/
  app.py                 # create_app(), middleware, mount routers
  core/config.py         # paths, env, CORS
  api/router.py          # /api prefix
  api/routes/            # health, guide, voice, pages
  schemas/               # request models
  services/              # content, intent, Sahara, pack_answer
```
- `frontend/` — Phone-first hold-to-talk UI.
- `content/` — Rights, workflow, disclaimers. Person A should refine Yoruba/Hausa.

## Setup

1. Env files are **separate** (backend and frontend deploy on different hosts).

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

- `backend/.env`: `INTRON_API_KEY` (Developer tab) and later `CORS_ORIGINS` with the live UI URL.
- `frontend/.env`: `VITE_INTRON_WIDGET_KEY` (View Integration) and `VITE_API_BASE` (empty locally; the live API URL in production).

A root `.env` still works as a local fallback for the backend only.

2. Backend (terminal 1):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

3. Vite + React UI (terminal 2):

```powershell
cd frontend
npm install
npm run dev
```

4. Open http://127.0.0.1:5173

Optional: put `VITE_INTRON_WIDGET_KEY` in `frontend/.env` for the official widget. Without it, hold-to-talk still uses `/api/transcribe`.

## Try it

1. Pick English, Yoruba, or Hausa.
2. Hold the green button and say something like: “They gave me a court date. What are my rights?”
3. Release. Sahara should show a transcript, then rights and sample phrases.
4. Optional: type instead of speaking, or tap **Hear the short answer** (Sahara TTS).

Language codes sent to Sahara: `en`, `yo` (Yoruba–English), `ha` (Hausa–English). See [Intron Voice docs](https://docs.voice.intron.io/docs/index/introduction).

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/briefing?language=en` | First-appearance pack |
| POST | `/api/transcribe` | Audio + language → Sahara STT → rights |
| POST | `/api/ask` | Typed question → same content |
| POST | `/api/speak` | Short Sahara TTS line |

## Next (still Person B)

- Benchmark Sahara vs 2 other models in `../imb` on Yoruba–English / Hausa–English clips.
- Document upload / compare.
- Deploy a phone-reachable URL.
