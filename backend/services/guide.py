from backend.services.content import first_appearance, lang_or_en, spoken_summary
from backend.services.intent import infer_focus, is_unsafe


def pack_answer(language: str, transcript: str, source: str) -> dict:
    language = lang_or_en(language)
    if is_unsafe(transcript):
        bundle = first_appearance(language)
        return {
            "ok": False,
            "refused": True,
            "transcript": transcript,
            "language": language,
            "source": source,
            "message": bundle["disclaimer"]["short"],
            "disclaimer": bundle["disclaimer"],
        }

    bundle = first_appearance(language)
    focus = infer_focus(transcript)
    return {
        "ok": True,
        "refused": False,
        "transcript": transcript,
        "language": language,
        "source": source,
        "focus": focus,
        "scenario_id": bundle["scenario_id"],
        "disclaimer": bundle["disclaimer"],
        "spoken_summary": spoken_summary(language),
        "workflow": bundle["workflow"] if focus in ("workflow", "both") else None,
        "rights": bundle["rights"] if focus in ("rights", "both") else None,
    }
