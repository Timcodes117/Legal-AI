from fastapi import APIRouter

from backend.schemas.requests import TextAsk
from backend.services.guide import pack_answer, pack_briefing

router = APIRouter()


@router.get("/briefing")
def briefing(language: str = "en"):
    return pack_briefing(language)


@router.post("/ask")
def ask_text(body: TextAsk):
    return pack_answer(body.language, body.text.strip(), "text")
