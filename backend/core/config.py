import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT = BACKEND_DIR.parent
FRONTEND = ROOT / "frontend"
DIST = FRONTEND / "dist"
CONTENT = ROOT / "content"

# Deploy: platform env wins. Local: backend/.env, then optional repo-root .env.
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(ROOT / ".env")

STT_URL = os.getenv("SAHARA_STT_URL", "https://infer.voice.intron.io/file/v1/upload/sync")
TTS_URL = os.getenv("SAHARA_TTS_URL", "https://infer.voice.intron.io/tts/v1/generate")


DEFAULT_CORS_ORIGINS = (
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "https://legal-ai-web-five.vercel.app",
)


def cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "")
    extra = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return list(dict.fromkeys([*DEFAULT_CORS_ORIGINS, *extra]))


def intron_api_key() -> str:
    key = os.getenv("INTRON_API_KEY", "").strip()
    if not key or key == "paste_your_key_here":
        raise RuntimeError("Set INTRON_API_KEY in backend/.env or the host environment.")
    return key


def gemini_api_key() -> str:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key or key == "paste_your_gemini_key_here":
        return ""
    return key


def gemini_model() -> str:
    return "gemini-3.6-flash"
