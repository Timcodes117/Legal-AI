from fastapi import APIRouter
from fastapi.responses import FileResponse

from backend.core.config import DIST

router = APIRouter()


@router.get("/")
def index():
    built = DIST / "index.html"
    if built.exists():
        return FileResponse(built)
    return {
        "ok": True,
        "hint": "In development, run the Vite app: cd frontend && npm run dev",
    }
