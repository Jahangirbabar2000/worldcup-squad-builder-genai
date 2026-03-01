"""
Stage 3: Reasoning, constraint solving, and squad construction for the World Cup Squad Builder.
"""

import json
import logging
import re
from typing import List, Dict, Any

from langchain_openai import ChatOpenAI

from src.prompts import REASONING_PROMPT

logger = logging.getLogger("squad_api")


def _shortlist_to_candidates_text(shortlist: List[Dict[str, Any]]) -> str:
    """Format shortlist for the reasoning prompt."""
    lines = []
    for p in shortlist:
        name = p.get("short_name", p.get("long_name", "?"))
        pos = p.get("primary_position", "?")
        ovr = p.get("overall", "?")
        wage = p.get("wage_eur", "?")
        pace = p.get("pace", "?")
        shoot = p.get("shooting", "?")
        pass_ = p.get("passing", "?")
        drib = p.get("dribbling", "?")
        def_ = p.get("defending", "?")
        phys = p.get("physic", "?")
        age = p.get("age", "?")
        nation = p.get("nationality_name", "?")
        club = p.get("club_name", "?")
        value = p.get("value_eur", "?")
        lines.append(
            f"{name} | {pos} | overall={ovr} | wage_eur={wage} value_eur={value} | pace={pace} shooting={shoot} passing={pass_} dribbling={drib} defending={def_} physic={phys} | age={age} | {nation} | {club}"
        )
    return "\n".join(lines)


def _parse_num(s: str, default: float = 0.0) -> float:
    """Parse a number from a string that may be '123.45' or 'wage_eur=23000.0'. Returns default on failure."""
    if not s:
        return default
    s = str(s).strip()
    try:
        return float(s)
    except ValueError:
        pass
    # Extract first number (integer or decimal) from string
    m = re.search(r"[\d.]+", s)
    if m:
        try:
            return float(m.group(0))
        except ValueError:
            pass
    return default


def _parse_int(s: str, default: int = 0) -> int:
    """Parse an integer from a string that may be '85' or 'overall=85'. Returns default on failure."""
    return int(_parse_num(s, float(default)))


def parse_llm_squad_output(llm_response: str) -> Dict[str, Any]:
    """Parse section-based LLM output into structured squad dict."""
    selected = []
    excluded = []
    total_wage = 0.0
    formation_notes = ""

    def section(content: str, tag: str) -> str:
        m = re.search(rf"---{tag}---\s*(.*?)(?=---|\Z)", content, re.DOTALL | re.IGNORECASE)
        return m.group(1).strip() if m else ""

    selected_text = section(llm_response, "SELECTED")
    excluded_text = section(llm_response, "EXCLUDED")
    wage_text = section(llm_response, "TOTAL_WAGE")
    formation_text = section(llm_response, "FORMATION_NOTES")
    if formation_text:
        formation_notes = formation_text
    try:
        total_wage = float(re.sub(r"[^\d.]", "", wage_text) or "0")
    except (ValueError, TypeError):
        pass

    for line in selected_text.split("\n"):
        line = line.strip()
        if not line or line.startswith("["):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 5:
            selected.append({
                "short_name": parts[0],
                "primary_position": parts[1] if len(parts) > 1 else "",
                "overall": _parse_int(parts[2], 0) if len(parts) > 2 else 0,
                "wage_eur": _parse_num(parts[3], 0.0) if len(parts) > 3 else 0.0,
                "justification": "|".join(parts[4:]) if len(parts) > 4 else "",
            })
        elif len(parts) >= 1:
            selected.append({
                "short_name": parts[0],
                "primary_position": "",
                "overall": 0,
                "wage_eur": 0,
                "justification": "|".join(parts[1:]) if len(parts) > 1 else "",
            })

    for line in excluded_text.split("\n"):
        line = line.strip()
        if not line or line.startswith("["):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 2:
            excluded.append({"short_name": parts[0], "reason": "|".join(parts[1:])})
        elif len(parts) == 1:
            excluded.append({"short_name": parts[0], "reason": ""})

    return {
        "selected": selected,
        "excluded": excluded,
        "total_wage": total_wage,
        "formation_notes": formation_notes,
    }


def validate_squad(squad: Dict[str, Any], constraints: Dict[str, Any]) -> bool:
    """Check that selected players meet all hard constraints."""
    selected = squad.get("selected") or []
    total_wage = squad.get("total_wage") or 0

    max_players = constraints.get("max_players", 23)
    min_gk = constraints.get("min_gk", 3)
    max_gk = constraints.get("max_gk", 3)
    min_def = constraints.get("min_def", 8)
    min_mid = constraints.get("min_mid", 7)
    min_fwd = constraints.get("min_fwd", 5)
    budget = constraints.get("budget")

    if len(selected) > max_players:
        return False
    counts = {"GK": 0, "DEF": 0, "MID": 0, "FWD": 0}
    for p in selected:
        pos = (p.get("primary_position") or "").upper()
        if pos in counts:
            counts[pos] += 1
    if counts["GK"] < min_gk or counts["GK"] > max_gk:
        return False
    if counts["DEF"] < min_def or counts["MID"] < min_mid or counts["FWD"] < min_fwd:
        return False
    if budget is not None and total_wage > float(budget):
        return False
    return True


def build_squad(
    shortlist: List[Dict[str, Any]],
    constraints: Dict[str, Any],
    user_preferences: str = "",
) -> Dict[str, Any]:
    """Build final squad from shortlist using LLM and validate; retry up to 2 times if invalid."""
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
    max_players = constraints.get("max_players", 23)
    min_gk = constraints.get("min_gk", 3)
    max_gk = constraints.get("max_gk", 3)
    min_def = constraints.get("min_def", 8)
    min_mid = constraints.get("min_mid", 7)
    min_fwd = constraints.get("min_fwd", 5)
    budget = constraints.get("budget")
    constraints_text = (
        f"max_players={max_players}, min_gk={min_gk}, max_gk={max_gk}, "
        f"min_def={min_def}, min_mid={min_mid}, min_fwd={min_fwd}"
        + (f", budget (total value EUR)={budget}" if budget is not None else "")
    )
    candidates_text = _shortlist_to_candidates_text(shortlist)

    for attempt in range(2):
        logger.info("LLM reasoning attempt %d/2", attempt + 1)
        try:
            chain = REASONING_PROMPT | llm
            resp = chain.invoke({
                "candidates": candidates_text,
                "constraints": constraints_text,
                "user_preferences": user_preferences or "None specified.",
            })
            content = resp.content if hasattr(resp, "content") else str(resp)
            squad = parse_llm_squad_output(content)
        except Exception as e:
            logger.exception("LLM invoke or parse failed: %s", e)
            raise
        # Enrich selected with full player data from shortlist by name
        by_name = {str(p.get("short_name", "")).strip().upper(): p for p in shortlist}
        for s in squad["selected"]:
            key = str(s.get("short_name", "")).strip().upper()
            if key in by_name:
                full = by_name[key]
                for k, v in full.items():
                    if k not in s:
                        s[k] = v
        if validate_squad(squad, constraints):
            return squad
        if attempt < 1:
            constraints_text += "\n[Previous selection violated constraints; try again with exactly these rules.]"
    return squad
