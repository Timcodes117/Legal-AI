import json
import re

from backend.core.config import ROOT, gemini_api_key, gemini_model

RULES = (ROOT / "prompts" / "system.md").read_text(encoding="utf-8")
MODELS = (
    "gemini-3.6-flash",
    gemini_model(),
    "gemini-2.0-flash",
)


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


def _parse_json(raw: str) -> dict:
    text = (raw or "").strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.S)
    if fenced:
        text = fenced.group(1)
    else:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start : end + 1]
    return json.loads(text)


def refine_answer(language: str, transcript: str, bundle: dict) -> tuple[dict | None, str]:
    """Use Gemini to answer the user's words from the approved JSON only."""
    key = gemini_api_key()
    asked = (transcript or "").strip()
    if not key:
        return None, "GEMINI_API_KEY is not set on this server."
    if not asked:
        return None, ""

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
  "include_workflow": false
}}
right_ids must be a subset of the ids in the JSON. Pick at most 3.
If they ask what they can do about their case, prefer counsel, bail, and informed_of_charges.
Do not return every right.
include_workflow is true only if they asked what happens in court, who will be there, or what they will be asked.

JSON:
{json.dumps(payload, ensure_ascii=False)}
"""
    last_error = "Gemini returned no usable answer."
    try:
        from google import genai
    except Exception as exc:
        return None, f"google-genai is not installed: {exc}"

    client = genai.Client(api_key=key)
    for model in dict.fromkeys(MODELS):
        try:
            response = client.models.generate_content(model=model, contents=prompt)
            data = _parse_json(response.text or "")
            summary = str(data.get("spoken_summary") or "").strip()
            ids = [item for item in data.get("right_ids") or [] if item in allowed_ids]
            if not summary:
                last_error = f"{model} returned JSON without spoken_summary."
                continue
            return {
                "spoken_summary": summary,
                "right_ids": ids,
                "include_workflow": bool(data.get("include_workflow")),
            }, ""
        except Exception as exc:
            last_error = f"{model}: {exc}"
            continue
    return None, last_error[:280]
