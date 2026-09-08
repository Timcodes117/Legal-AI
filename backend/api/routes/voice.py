from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from backend.schemas.requests import SpeakAsk
from backend.services.guide import pack_answer
from backend.services.sahara import speak_text, transcribe_audio

router = APIRouter()


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = Form("en"),
):
    blob = await audio.read()
    if not blob:
        raise HTTPException(status_code=400, detail="Empty audio upload.")
    try:
        result = await transcribe_audio(
            blob,
            audio.filename or "clip.webm",
            language,
            audio.content_type or "application/octet-stream",
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Sahara STT failed: {exc}") from exc

    answer = pack_answer(language, result["transcript"], "sahara_stt")
    answer["stt"] = {
        "file_id": result["file_id"],
        "status": result["status"],
        "duration_seconds": result["duration_seconds"],
        "language": result["language"],
    }
    return answer


@router.post("/speak")
async def speak(body: SpeakAsk):
    try:
        return await speak_text(body.text, body.language)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Sahara TTS failed: {exc}") from exc
