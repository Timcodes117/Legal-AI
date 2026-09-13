REFUSAL_MARKERS = (
    "evade",
    "escape police",
    "hide from court",
    "forge",
    "forged",
    "bribe",
    "how to lie",
    "destroy evidence",
    "run away",
)

RIGHT_HINTS = (
    "right",
    "lawyer",
    "counsel",
    "legal aid",
    "silent",
    "silence",
    "interpreter",
    "bail",
    "beli",
    "charge",
    "ẹ̀tọ́",
    "eto",
    "agbẹjọ́rò",
    "agbejoro",
    "lauya",
    "hakki",
    "hakkin",
)

WORKFLOW_HINTS = (
    "happen",
    "what will",
    "court",
    "first appearance",
    "magistrate",
    "today",
    "process",
    "workflow",
    "ilé-ẹjọ́",
    "ile-ejo",
    "kotu",
    "bayyana",
)


def is_unsafe(text: str) -> bool:
    lowered = (text or "").lower()
    return any(marker in lowered for marker in REFUSAL_MARKERS)


RIGHT_KEYWORDS = (
    ("interpreter", ("interpreter", "understand", "language", "judge said", "didn't understand", "dont understand", "don't understand", "yoruba", "hausa", "pidgin", "olùtumọ̀", "olutumo", "fassara", "fahimta")),
    ("counsel", ("lawyer", "counsel", "legal aid", "agbẹjọ́rò", "agbejoro", "lauya")),
    ("bail", ("bail", "beli", "surety", "release")),
    ("silence", ("silent", "silence", "remain silent", "don't have to answer", "dont have to answer")),
    ("informed_of_charges", ("charge", "arrested for", "offence", "offense", "what did i do", "ẹ̀sùn", "tuhuma")),
    ("dignity", ("beat", "torture", "mistreat", "inhuman", "dignity")),
    ("fair_hearing", ("fair hearing", "delayed", "years", "public")),
    ("appeal", ("appeal", "convict", "sentence")),
)


def infer_focus(text: str) -> str:
    lowered = (text or "").lower()
    wants_rights = any(hint in lowered for hint in RIGHT_HINTS) or bool(infer_right_ids(lowered))
    wants_flow = any(hint in lowered for hint in WORKFLOW_HINTS)
    if wants_rights and not wants_flow:
        return "rights"
    if wants_flow and not wants_rights:
        return "workflow"
    return "both"


def infer_right_ids(text: str) -> list[str]:
    lowered = (text or "").lower()
    found = []
    for right_id, hints in RIGHT_KEYWORDS:
        if any(hint in lowered for hint in hints):
            found.append(right_id)
    return found[:3]
