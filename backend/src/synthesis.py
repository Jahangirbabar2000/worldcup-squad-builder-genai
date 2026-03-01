"""
Stage 4: Synthesis and report generation for the World Cup Squad Builder.
"""

import json
from typing import List, Dict, Any

from langchain_openai import ChatOpenAI

from src.prompts import SYNTHESIS_PROMPT


def format_squad_table(selected_players: List[Dict[str, Any]]) -> str:
    """Format selected players as a text table grouped by position."""
    order = ["GK", "DEF", "MID", "FWD"]
    by_pos: Dict[str, List[Dict[str, Any]]] = {p: [] for p in order}
    for player in selected_players:
        pos = (player.get("primary_position") or "FWD").upper()
        if pos not in by_pos:
            by_pos[pos] = []
        by_pos[pos].append(player)

    lines = []
    for pos in order:
        players = by_pos.get(pos, [])
        if not players:
            continue
        lines.append(f"\n### {pos}")
        for p in players:
            name = p.get("short_name", "?")
            ovr = p.get("overall", "?")
            pace = p.get("pace", "?")
            defend = p.get("defending", "?")
            shoot = p.get("shooting", "?")
            wage = p.get("wage_eur", "?")
            just = (p.get("justification") or "")[:80]
            if pos == "GK":
                stat = f"Overall {ovr}"
            elif pos == "DEF":
                stat = f"Def {defend}"
            else:
                stat = f"Pace {pace} Shoot {shoot}"
            lines.append(f"  {name} | {pos} | {ovr} | {stat} | Wage {wage} | {just}")
    return "\n".join(lines) if lines else "No players"


def generate_report(squad: Dict[str, Any], constraints_applied: Dict[str, Any]) -> str:
    """Generate formatted squad report using LLM and SYNTHESIS_PROMPT."""
    selected = squad.get("selected") or []
    table = format_squad_table(selected)
    squad_text = (
        f"Squad table:\n{table}\n\n"
        f"Total wage: {squad.get('total_wage', 0)}\n"
        f"Formation notes: {squad.get('formation_notes', '')}\n"
        f"Excluded: {squad.get('excluded', [])}"
    )
    constraints_text = json.dumps(constraints_applied, indent=2)

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
    chain = SYNTHESIS_PROMPT | llm
    resp = chain.invoke({"squad": squad_text, "constraints_applied": constraints_text})
    return resp.content if hasattr(resp, "content") else str(resp)
