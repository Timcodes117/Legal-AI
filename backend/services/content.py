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


FALLBACK_SUMMARIES = {
    "interpreter": {
        "en": "If you do not understand the judge, say so out loud and ask for an interpreter. You have the right to hear the charge in a language you understand. This is not legal advice.",
        "yo": "Tí o kò bá lóye ohun tí adájọ́ sọ, sọ bẹ́ẹ̀ kí o béèrè olùtumọ̀. O ní ẹ̀tọ́ láti gbọ́ ẹ̀sùn ní èdè tí o lóye. Èyí kì í ṣe agbẹjọ́rò.",
        "ha": "Idan ba ka fahimci abin da alkali ya ce ba, faɗa haka ka nemi mai fassara. Kana da hakkin jin tuhumar a yaren da ka fahimta. Wannan ba lauya ba ne.",
    },
    "counsel": {
        "en": "You can ask for a lawyer, including free Legal Aid if you cannot pay. You do not have to answer questions until a lawyer is with you. This is not legal advice.",
        "yo": "O lè béèrè agbẹjọ́rò, tàbí Legal Aid tí o kò bá lówó. O kò ní láti dáhùn títí agbẹjọ́rò yóò fi dé. Èyí kì í ṣe agbẹjọ́rò.",
        "ha": "Za ka iya neman lauya, ko Legal Aid idan ba ka da kuɗi. Ba lallai ka amsa tambayoyi ba har lauya ya zo. Wannan ba lauya ba ne.",
    },
    "bail": {
        "en": "You can ask if you are entitled to bail and on what conditions. Bail itself is free — paying an officer for bail is illegal. This is not legal advice.",
        "yo": "O lè béèrè bóyá o lè gba bail àti àwọn ìpinnu rẹ̀. Bail fúnrarẹ̀ kò ní owó — jíjẹ owó fún ọlọ́pàá fún bail jẹ́ òfin. Èyí kì í ṣe agbẹjọ́rò.",
        "ha": "Za ka iya tambayar ko za a ba ka beli da sharuddan sa. Beli kyauta ne — biyan jami'i don beli haramun ne. Wannan ba lauya ba ne.",
    },
}


def spoken_summary(language: str, right_ids: list[str] | None = None) -> str:
    language = lang_or_en(language)
    for right_id in right_ids or []:
        block = FALLBACK_SUMMARIES.get(right_id)
        if block:
            return block.get(language) or block["en"]
    summaries = {
        "en": "At first appearance, ask for a lawyer, an interpreter, and bail. This is not legal advice.",
        "yo": "Ní ìfarahàn àkọ́kọ́, béèrè agbẹjọ́rò, interpreter, àti bail. Èyí kì í ṣe agbẹjọ́rò.",
        "ha": "A bayyanar farko, nemi lauya, mai fassara, da beli. Wannan ba lauya ba ne.",
    }
    return summaries.get(language, summaries["en"])
