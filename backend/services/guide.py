from backend.services.content import first_appearance, lang_or_en, spoken_summary
from backend.services.gemini_guide import refine_answer
from backend.services.intent import infer_focus, is_unsafe

MAX_RIGHTS = 3
DEFAULT_RIGHT_IDS = ("counsel", "bail", "informed_of_charges")


def _slim_rights(items: list | None) -> list | None:
    if not items:
        return None
    slim = []
    for item in items[:MAX_RIGHTS]:
        slim.append(
            {
                "id": item["id"],
                "title": item["title"],
                "say": (item.get("say") or [])[:2],
            }
        )
    return slim


def _slim_workflow(flow: dict | None) -> dict | None:
    if not flow:
        return None
    return {
        "title": flow["title"],
        "steps": (flow.get("steps") or [])[:3],
    }


def _pick_rights(bundle: dict, ids: list[str] | None) -> list:
    by_id = {item["id"]: item for item in bundle["rights"]}
    chosen = [by_id[item_id] for item_id in (ids or []) if item_id in by_id]
    if chosen:
        return chosen[:MAX_RIGHTS]
    return [by_id[item_id] for item_id in DEFAULT_RIGHT_IDS if item_id in by_id]


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
    rights = _pick_rights(bundle, DEFAULT_RIGHT_IDS if focus in ("rights", "both") else None)
    if focus == "workflow":
        rights = None
    grounded = False
    grounded_error = ""

    if transcript.strip():
        refined, grounded_error = refine_answer(language, transcript, bundle)
        if refined:
            grounded = True
            grounded_error = ""
            summary = refined["spoken_summary"]
            rights = _pick_rights(bundle, refined.get("right_ids"))
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
        "grounded_error": grounded_error,
        "scenario_id": bundle["scenario_id"],
        "disclaimer": bundle["disclaimer"],
        "spoken_summary": summary,
        "workflow": _slim_workflow(workflow),
        "rights": _slim_rights(rights),
    }
