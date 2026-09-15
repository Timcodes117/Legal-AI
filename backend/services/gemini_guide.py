import json
import re
import time

from backend.core.config import ROOT, gemini_api_key

RULES = (ROOT / "prompts" / "system.md").read_text(encoding="utf-8")
CURRENT_MODELS = ("gemini-3.6-flash",)


def _models() -> tuple[str, ...]:
    return CURRENT_MODELS


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
Reply in language code "{language}" (en, yo, or ha). Match the user's mix if they mixed languages.
The user_said field is what they actually asked. Answer THAT situation. Do not recite a generic first-appearance brochure.
If they do not understand the judge or English: lead with the interpreter right.
If they have no lawyer or no money: lead with Legal Aid / counsel.
If they were told to pay for bail: say bail itself is free and paying an officer for bail is illegal.
If they were not told the charge: lead with the right to be informed.
If they asked what happens today / who will be there / how to plead: set include_workflow true and explain those three steps. Otherwise include_workflow is false.
3 to 5 short sentences. Last sentence: this is information, not legal advice.
Return JSON only, no markdown:
{{
  "spoken_summary": "specific answer to user_said",
  "right_ids": ["id", "..."],
  "include_workflow": false
}}
right_ids must be a subset of the ids in the JSON. Pick at most 3, only what they raised.

JSON:
{json.dumps(payload, ensure_ascii=False)}
"""
    last_error = "Gemini returned no usable answer."
    try:
        from google import genai
    except Exception as exc:
        return None, f"google-genai is not installed: {exc}"

    client = genai.Client(api_key=key)
    for model in _models():
        for attempt in range(2):
            try:
                response = client.models.generate_content(model=model, contents=prompt)
                data = _parse_json(response.text or "")
                summary = str(data.get("spoken_summary") or "").strip()
                ids = [item for item in data.get("right_ids") or [] if item in allowed_ids]
                if not summary:
                    last_error = f"{model} returned JSON without spoken_summary."
                    break
                return {
                    "spoken_summary": summary,
                    "right_ids": ids,
                    "include_workflow": bool(data.get("include_workflow")),
                }, ""
            except Exception as exc:
                last_error = f"{model}: {exc}"
                text = str(exc)
                if attempt == 0 and ("503" in text or "UNAVAILABLE" in text):
                    time.sleep(0.8)
                    continue
                break
    return None, last_error[:280]
