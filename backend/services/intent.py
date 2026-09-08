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


def infer_focus(text: str) -> str:
    lowered = (text or "").lower()
    wants_rights = any(hint in lowered for hint in RIGHT_HINTS)
    wants_flow = any(hint in lowered for hint in WORKFLOW_HINTS)
    if wants_rights and not wants_flow:
        return "rights"
    if wants_flow and not wants_rights:
        return "workflow"
    return "both"
