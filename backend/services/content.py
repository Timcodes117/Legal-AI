import json
from functools import lru_cache

from backend.core.config import CONTENT

SUPPORTED = ("en", "yo", "ha")


def _load(name: str) -> dict:
    return json.loads((CONTENT / name).read_text(encoding="utf-8"))


@lru_cache
def rights() -> dict:
    return _load("rights.json")


@lru_cache
def workflows() -> dict:
    return _load("workflow.json")


@lru_cache
def disclaimers() -> dict:
    return _load("disclaimers.json")


def lang_or_en(code: str) -> str:
    return code if code in SUPPORTED else "en"


def pick(block: dict, language: str):
    language = lang_or_en(language)
    return block.get(language) or block.get("en")


def first_appearance(language: str) -> dict:
    language = lang_or_en(language)
    flow = pick(workflows()["first_appearance"], language)
    items = []
    for right in rights()["rights"]:
        items.append({"id": right["id"], **pick(right, language)})
    notice = pick(disclaimers(), language)
    return {
        "scenario_id": "first_appearance",
        "language": language,
        "workflow": flow,
        "rights": items,
        "disclaimer": notice,
    }


def spoken_summary(language: str) -> str:
    summaries = {
        "en": "At first appearance, ask for a lawyer, an interpreter, and bail. This is not legal advice.",
        "yo": "Ní ìfarahàn àkọ́kọ́, béèrè agbẹjọ́rò, interpreter, àti bail. Èyí kì í ṣe agbẹjọ́rò.",
        "ha": "A bayyanar farko, nemi lauya, mai fassara, da beli. Wannan ba lauya ba ne.",
    }
    return summaries.get(lang_or_en(language), summaries["en"])
