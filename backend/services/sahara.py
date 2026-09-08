import httpx

from backend.core.config import STT_URL, TTS_URL, intron_api_key

LANGUAGE_TO_STT = {"en": "en", "yo": "yo", "ha": "ha", "pcm": "pcm"}
TTS_VOICE = {
    "en": {"voice_language": "en", "voice_accent": "yoruba"},
    "yo": {"voice_language": "yo", "voice_accent": "yoruba"},
    "ha": {"voice_language": "ha", "voice_accent": "hausa"},
    "pcm": {"voice_language": "pcm", "voice_accent": "pidgin"},
}


async def transcribe_audio(
    audio_bytes: bytes,
    filename: str,
    language: str,
    content_type: str = "application/octet-stream",
) -> dict:
    lang = LANGUAGE_TO_STT.get(language, "en")
    files = {"audio_file_blob": (filename or "clip.webm", audio_bytes, content_type)}
    data = {
        "audio_file_name": filename or "clip",
        "use_language_asr_input": lang,
        "use_category": "file_category_legal",
        "use_disable_llm_corrections": "FALSE",
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            STT_URL,
            headers={"Authorization": f"Bearer {intron_api_key()}"},
            data=data,
            files=files,
        )
    response.raise_for_status()
    payload = response.json()
    body = payload.get("data") or {}
    return {
        "transcript": body.get("audio_transcript") or "",
        "file_id": body.get("file_id"),
        "status": body.get("processing_status"),
        "duration_seconds": body.get("processed_audio_duration_in_seconds"),
        "language": lang,
        "raw": payload,
    }


async def speak_text(text: str, language: str) -> dict:
    voice = TTS_VOICE.get(language, TTS_VOICE["en"])
    spoken = (text or "").strip()
    if len(spoken) > 90:
        spoken = spoken[:87].rsplit(" ", 1)[0] + "..."
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            TTS_URL,
            headers={
                "Authorization": f"Bearer {intron_api_key()}",
                "Content-Type": "application/json",
            },
            json={
                "text": spoken,
                "voice_language": voice["voice_language"],
                "voice_accent": voice["voice_accent"],
                "voice_gender": "female",
                "output_audio_format": "wav",
            },
        )
    response.raise_for_status()
    payload = response.json()
    body = payload.get("data") or {}
    return {
        "audio_url": body.get("audio_path"),
        "status": body.get("processing_status"),
        "spoken_text": spoken,
        "raw": payload,
    }
