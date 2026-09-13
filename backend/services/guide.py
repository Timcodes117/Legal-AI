from backend.services.content import first_appearance, lang_or_en, spoken_summary
from backend.services.gemini_guide import refine_answer
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
    summary = spoken_summary(language)
    workflow = bundle["workflow"] if focus in ("workflow", "both") else None
    rights = bundle["rights"] if focus in ("rights", "both") else None
    grounded = False

    if transcript.strip():
        refined = refine_answer(language, transcript, bundle)
        if refined:
            grounded = True
            summary = refined["spoken_summary"]
            if refined["right_ids"]:
                chosen = {item_id for item_id in refined["right_ids"]}
                rights = [item for item in bundle["rights"] if item["id"] in chosen] or rights
            workflow = bundle["workflow"] if refined["include_workflow"] else None
            focus = "both" if workflow and rights else "workflow" if workflow else "rights"

    return {
        "ok": True,
        "refused": False,
        "transcript": transcript,
        "language": language,
        "source": source,
        "focus": focus,
        "grounded": grounded,
        "scenario_id": bundle["scenario_id"],
        "disclaimer": bundle["disclaimer"],
        "spoken_summary": summary,
        "workflow": workflow,
        "rights": rights,
    }
