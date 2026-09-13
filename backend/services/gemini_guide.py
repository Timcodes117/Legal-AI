import json
import re

from backend.core.config import ROOT, gemini_api_key, gemini_model

RULES = (ROOT / "prompts" / "system.md").read_text(encoding="utf-8")


def _compact(bundle: dict) -> dict:
    return {
        "disclaimer": bundle["disclaimer"]["short"],
        "workflow": {
            "title": bundle["workflow"]["title"],
            "summary": bundle["workflow"]["summary"],
            "steps": bundle["workflow"]["steps"][:3],
        },
        "rights": [
            {
                "id": item["id"],
                "title": item["title"],
                "plain": item["plain"],
                "say": (item.get("say") or [])[:2],
            }
            for item in bundle["rights"]
        ],
    }


def refine_answer(language: str, transcript: str, bundle: dict) -> dict | None:
    """Use Gemini to answer the user's words from the approved JSON only."""
    key = gemini_api_key()
    asked = (transcript or "").strip()
    if not key or not asked:
        return None

    allowed_ids = {item["id"] for item in bundle["rights"]}
    payload = {
        "language": language,
        "user_said": asked,
        "content": _compact(bundle),
    }
    prompt = f"""{RULES}

Answer ONLY from the JSON content. Do not invent law.
The user asked about first appearance in a Nigerian court.
Reply in language code "{language}" (en, yo, or ha).
Return JSON only, no markdown:
{{
  "spoken_summary": "2 to 4 short sentences that actually answer the user",
  "right_ids": ["id", "..."],
  "include_workflow": true
}}
right_ids must be a subset of the ids in the JSON. Pick only what the user asked about.
include_workflow is true only if they asked what happens in court today.

JSON:
{json.dumps(payload, ensure_ascii=False)}
"""
    try:
        from google import genai

        client = genai.Client(api_key=key)
        response = client.models.generate_content(model=gemini_model(), contents=prompt)
        raw = (response.text or "").strip()
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)
        data = json.loads(raw)
    except Exception:
        return None

    summary = str(data.get("spoken_summary") or "").strip()
    ids = [item for item in data.get("right_ids") or [] if item in allowed_ids]
    if not summary:
        return None
    return {
        "spoken_summary": summary,
        "right_ids": ids,
        "include_workflow": bool(data.get("include_workflow")),
    }
