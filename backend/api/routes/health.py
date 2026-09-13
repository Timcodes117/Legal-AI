from fastapi import APIRouter

from backend.core.config import gemini_api_key

router = APIRouter()


@router.get("/health")
def health():
    return {
        "ok": True,
        "service": "court-rights",
        "gemini": bool(gemini_api_key()),
    }
