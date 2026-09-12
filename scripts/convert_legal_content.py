"""Convert Person A's legal_content markdown into hackathon/content JSON."""

from __future__ import annotations

import json
import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "legal_content"
if not SRC.exists():
    SRC = Path(r"C:\Users\Timothy\Documents\sahara-intron\legal_content")
OUT = Path(__file__).resolve().parents[1] / "content"

RIGHT_IDS = [
    "interpreter",
    "counsel",
    "silence",
    "bail",
    "informed_of_charges",
    "fair_hearing",
    "dignity",
    "appeal",
]

RIGHT_STAGES = {
    "interpreter": ["arrest", "first_appearance", "trial"],
    "counsel": ["arrest", "first_appearance", "trial"],
    "silence": ["arrest", "first_appearance", "trial"],
    "bail": ["arrest", "first_appearance"],
    "informed_of_charges": ["arrest", "first_appearance"],
    "fair_hearing": ["first_appearance", "trial"],
    "dignity": ["arrest", "first_appearance", "trial"],
    "appeal": ["judgment"],
}

MEANING_KEYS = ("what it means", "ohun tí ó túmọ̀ sí", "abin da ake nufi")
SAY_KEYS = ("what you can say", "ohun tí o lè sọ", "abin da za")
PROBLEM_KEYS = ("common problems", "àwọn ìṣòro", "matsalolin")
HAPPENS_KEYS = ("what happens", "ohun tí ó máa ṣẹlẹ̀", "ohun tí ó ṣẹlẹ̀", "abin da ke faruwa")
EXPECT_KEYS = ("what you should expect", "ohun tí ó yẹ kí o retí", "abin da ya kamata")


def _norm(label: str) -> str:
    return re.sub(r"\s+", " ", label).strip().lower().rstrip(":")


def _key_matches(label: str, keys: tuple[str, ...]) -> bool:
    n = _norm(label)
    return any(n.startswith(k) or k in n for k in keys)


def bullets(text: str) -> list[str]:
    items = []
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("- "):
            items.append(line[2:].strip().strip('"“”'))
    if items:
        return items
    para = " ".join(text.split())
    return [para] if para else []


def split_sections(text: str, heading: str) -> list[tuple[str, str]]:
    parts = re.split(rf"(?=^{heading} )", text.strip(), flags=re.M)
    out = []
    for part in parts:
        if not part.strip().startswith(heading):
            continue
        first, _, rest = part.partition("\n")
        title = first[len(heading) :].strip()
        out.append((title, rest.strip()))
    return out


def labeled_blocks(body: str) -> dict[str, str]:
    pieces = re.split(r"\*\*([^*]+)\*\*", body)
    blocks: dict[str, str] = {}
    for i in range(1, len(pieces) - 1, 2):
        blocks[_norm(pieces[i])] = pieces[i + 1].strip()
    return blocks


def find_block(blocks: dict[str, str], keys: tuple[str, ...]) -> str:
    for label, value in blocks.items():
        if _key_matches(label, keys):
            return value
    return ""


def parse_rights(path: Path) -> list[dict]:
    items = []
    for title, body in split_sections(path.read_text(encoding="utf-8"), "###"):
        blocks = labeled_blocks(body)
        meaning = " ".join(find_block(blocks, MEANING_KEYS).split())
        problems = bullets(find_block(blocks, PROBLEM_KEYS))
        say = bullets(find_block(blocks, SAY_KEYS))[:4]
        items.append(
            {
                "title": title,
                "plain": meaning,
                "in_practice": problems[0] if problems else "",
                "say": say,
            }
        )
    return items


def parse_stage(path: Path, needle: str) -> dict:
    text = path.read_text(encoding="utf-8")
    for heading in ("##", "###"):
        for title, body in split_sections(text, heading):
            if needle.lower() in title.lower():
                body = re.split(r"\n(?=#{2,3} )", body)[0]
                blocks = labeled_blocks(body)
                happens = " ".join(find_block(blocks, HAPPENS_KEYS).split())
                steps = bullets(find_block(blocks, EXPECT_KEYS))
                say = bullets(find_block(blocks, SAY_KEYS))
                if say:
                    steps = steps + say
                clean_title = re.sub(
                    r"^(stage|ìpele|mataki):\s*", "", title, flags=re.I
                ).strip()
                return {"title": clean_title, "summary": happens, "steps": steps[:6]}
    raise SystemExit(f"Stage containing {needle!r} not found in {path}")


def parse_disclaimers(path: Path) -> dict:
    blocks = labeled_blocks(path.read_text(encoding="utf-8"))
    items = list(blocks.items())
    short = ""
    if items:
        heading, body = items[0]
        heading = heading.rstrip(".").strip()
        heading = heading[0].upper() + heading[1:] if heading else heading
        short = f"{heading}. {' '.join(body.split())}".strip()
    when = ""
    for label, value in items[1:]:
        if any(word in label for word in ("must", "gbọ́dọ̀", "dole", "real lawyer", "agbẹjọ́rò gidi", "lauya na gaske")):
            when = "; ".join(bullets(value)[:4]) or " ".join(value.split())
            break
    return {"short": short, "when_to_see_lawyer": when}


def align_rights(en, yo, ha):
    if len(ha) == len(en) + 1:
        # duplicate Hausa silence sections — keep the longer one
        drop = 2 if len(ha[3].get("plain", "")) >= len(ha[2].get("plain", "")) else 3
        if len(ha[2]["plain"]) < len(ha[3]["plain"]):
            drop = 2
        ha = [item for i, item in enumerate(ha) if i != drop]
    if not (len(en) == len(yo) == len(ha) == 8):
        raise SystemExit(f"Right counts en={len(en)} yo={len(yo)} ha={len(ha)}")
    return en, yo, ha


def main() -> None:
    en, yo, ha = align_rights(
        parse_rights(SRC / "rights_en.md"),
        parse_rights(SRC / "rights_yo.md"),
        parse_rights(SRC / "rights_ha.md"),
    )
    rights = {"scenario": "first_appearance", "rights": []}
    for idx, right_id in enumerate(RIGHT_IDS):
        rights["rights"].append(
            {
                "id": right_id,
                "stages": RIGHT_STAGES[right_id],
                "en": en[idx],
                "yo": yo[idx],
                "ha": ha[idx],
            }
        )

    workflow = {
        "first_appearance": {
            "id": "first_appearance",
            "en": parse_stage(SRC / "workflows_en.md", "First Court Appearance"),
            "yo": parse_stage(SRC / "workflows_yo.md", "Ìfarahàn"),
            "ha": parse_stage(SRC / "workflows_ha.md", "Gabatarwar Kotu"),
        }
    }
    disclaimers = {
        "en": parse_disclaimers(SRC / "disclaimers_en.md"),
        "yo": parse_disclaimers(SRC / "disclaimers_yo.md"),
        "ha": parse_disclaimers(SRC / "disclaimers_ha.md"),
    }

    OUT.mkdir(exist_ok=True)
    (OUT / "rights.json").write_text(
        json.dumps(rights, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (OUT / "workflow.json").write_text(
        json.dumps(workflow, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (OUT / "disclaimers.json").write_text(
        json.dumps(disclaimers, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Wrote {len(rights['rights'])} rights to {OUT}")


if __name__ == "__main__":
    main()
