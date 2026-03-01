"""
FastAPI backend for the World Cup Squad Builder.
Exposes structured JSON endpoints for the React frontend while using
the same LangChain / RAG pipeline (ingestion, retrieval, reasoning).
"""

import logging
import os
import hashlib
import json
import traceback
from typing import List, Dict, Any, Optional, Tuple

from dotenv import load_dotenv

load_dotenv()

# Configure logging: level INFO to stdout so you can see pipeline steps
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("squad_api")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

from src import ingestion, retrieval, reasoning

# Valid tactic options (must match frontend types)
VALID_FORMATIONS = ("4-3-3", "4-4-2", "3-5-2", "4-2-3-1", "3-4-3")
VALID_BUILD_UP = ("Balanced", "Counter-Attack", "Short Passing")
VALID_DEFENSIVE = ("Balanced", "Deep Block", "High Press", "Aggressive")

app = FastAPI(title="World Cup Squad Builder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Module-level cache ──────────────────────────────────────────────────────
_documents: List[Any] = []
_vector_store: Any = None
_retriever: Any = None
_last_shortlist: List[Dict[str, Any]] = []
_last_squad: Dict[str, Any] = {}

# Persisted FAISS index path (avoid re-embedding 16k docs on every server start)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FAISS_INDEX_PATH = os.path.join(PROJECT_ROOT, "data/faiss_index")

# Pipeline response cache: same request returns cached result (no extra API calls)
_response_cache: Dict[str, Dict[str, Any]] = {}
_response_cache_max_size = 100
_response_cache_keys: List[str] = []  # order for LRU eviction

# ── Formation Templates (must mirror the frontend exactly) ──────────────────
FORMATION_TEMPLATES: Dict[str, List[Dict[str, Any]]] = {
    "4-3-3": [
        {"position": "GK", "x": 50, "y": 90},
        {"position": "LB", "x": 20, "y": 70},
        {"position": "CB", "x": 38, "y": 75},
        {"position": "CB", "x": 62, "y": 75},
        {"position": "RB", "x": 80, "y": 70},
        {"position": "CDM", "x": 50, "y": 55},
        {"position": "CM", "x": 32, "y": 45},
        {"position": "CM", "x": 68, "y": 45},
        {"position": "LW", "x": 20, "y": 20},
        {"position": "ST", "x": 50, "y": 15},
        {"position": "RW", "x": 80, "y": 20},
    ],
    "4-4-2": [
        {"position": "GK", "x": 50, "y": 90},
        {"position": "LB", "x": 20, "y": 70},
        {"position": "CB", "x": 38, "y": 75},
        {"position": "CB", "x": 62, "y": 75},
        {"position": "RB", "x": 80, "y": 70},
        {"position": "LM", "x": 20, "y": 45},
        {"position": "CM", "x": 40, "y": 50},
        {"position": "CM", "x": 60, "y": 50},
        {"position": "RM", "x": 80, "y": 45},
        {"position": "ST", "x": 40, "y": 18},
        {"position": "ST", "x": 60, "y": 18},
    ],
    "3-5-2": [
        {"position": "GK", "x": 50, "y": 90},
        {"position": "CB", "x": 28, "y": 72},
        {"position": "CB", "x": 50, "y": 75},
        {"position": "CB", "x": 72, "y": 72},
        {"position": "LM", "x": 15, "y": 50},
        {"position": "CDM", "x": 35, "y": 55},
        {"position": "CDM", "x": 65, "y": 55},
        {"position": "RM", "x": 85, "y": 50},
        {"position": "CAM", "x": 50, "y": 35},
        {"position": "ST", "x": 40, "y": 15},
        {"position": "ST", "x": 60, "y": 15},
    ],
    "4-2-3-1": [
        {"position": "GK", "x": 50, "y": 90},
        {"position": "LB", "x": 20, "y": 70},
        {"position": "CB", "x": 38, "y": 75},
        {"position": "CB", "x": 62, "y": 75},
        {"position": "RB", "x": 80, "y": 70},
        {"position": "CDM", "x": 40, "y": 55},
        {"position": "CDM", "x": 60, "y": 55},
        {"position": "LM", "x": 22, "y": 35},
        {"position": "CAM", "x": 50, "y": 38},
        {"position": "RM", "x": 78, "y": 35},
        {"position": "ST", "x": 50, "y": 15},
    ],
    "3-4-3": [
        {"position": "GK", "x": 50, "y": 90},
        {"position": "CB", "x": 28, "y": 72},
        {"position": "CB", "x": 50, "y": 75},
        {"position": "CB", "x": 72, "y": 72},
        {"position": "LM", "x": 20, "y": 50},
        {"position": "CM", "x": 40, "y": 52},
        {"position": "CM", "x": 60, "y": 52},
        {"position": "RM", "x": 80, "y": 50},
        {"position": "LW", "x": 25, "y": 20},
        {"position": "ST", "x": 50, "y": 15},
        {"position": "RW", "x": 75, "y": 20},
    ],
}

SLOT_COMPATIBLE_POSITIONS: Dict[str, List[str]] = {
    "GK": ["GK"],
    "CB": ["CB"],
    "LB": ["LB", "LWB"],
    "RB": ["RB", "RWB"],
    "CDM": ["CDM", "CM"],
    "CM": ["CM", "CDM", "CAM"],
    "CAM": ["CAM", "CF"],
    "LM": ["LM", "LW"],
    "RM": ["RM", "RW"],
    "LW": ["LW", "LF"],
    "RW": ["RW", "RF"],
    "ST": ["ST", "CF"],
}

SLOT_TO_CATEGORY: Dict[str, str] = {
    "GK": "GK",
    "CB": "DEF", "LB": "DEF", "RB": "DEF",
    "CDM": "MID", "CM": "MID", "CAM": "MID", "LM": "MID", "RM": "MID",
    "LW": "FWD", "RW": "FWD", "ST": "FWD",
}

COUNTRY_FLAGS: Dict[str, str] = {
    "Argentina": "\U0001f1e6\U0001f1f7", "France": "\U0001f1eb\U0001f1f7",
    "Belgium": "\U0001f1e7\U0001f1ea", "Netherlands": "\U0001f1f3\U0001f1f1",
    "Brazil": "\U0001f1e7\U0001f1f7", "Norway": "\U0001f1f3\U0001f1f4",
    "Germany": "\U0001f1e9\U0001f1ea", "England": "\U0001f3f4\U000e0067\U000e0062\U000e0065\U000e006e\U000e0067\U000e007f",
    "Croatia": "\U0001f1ed\U0001f1f7", "Portugal": "\U0001f1f5\U0001f1f9",
    "Canada": "\U0001f1e8\U0001f1e6", "Spain": "\U0001f1ea\U0001f1f8",
    "Uruguay": "\U0001f1fa\U0001f1fe", "Italy": "\U0001f1ee\U0001f1f9",
    "Poland": "\U0001f1f5\U0001f1f1", "Denmark": "\U0001f1e9\U0001f1f0",
    "Colombia": "\U0001f1e8\U0001f1f4", "Mexico": "\U0001f1f2\U0001f1fd",
    "United States": "\U0001f1fa\U0001f1f8", "Japan": "\U0001f1ef\U0001f1f5",
    "Korea Republic": "\U0001f1f0\U0001f1f7", "Australia": "\U0001f1e6\U0001f1fa",
    "Senegal": "\U0001f1f8\U0001f1f3", "Morocco": "\U0001f1f2\U0001f1e6",
    "Nigeria": "\U0001f1f3\U0001f1ec", "Egypt": "\U0001f1ea\U0001f1ec",
    "Ghana": "\U0001f1ec\U0001f1ed", "Cameroon": "\U0001f1e8\U0001f1f2",
    "Ivory Coast": "\U0001f1e8\U0001f1ee", "Algeria": "\U0001f1e9\U0001f1ff",
    "Tunisia": "\U0001f1f9\U0001f1f3", "Sweden": "\U0001f1f8\U0001f1ea",
    "Switzerland": "\U0001f1e8\U0001f1ed", "Austria": "\U0001f1e6\U0001f1f9",
    "Scotland": "\U0001f3f4\U000e0067\U000e0062\U000e0073\U000e0063\U000e0074\U000e007f",
    "Wales": "\U0001f3f4\U000e0067\U000e0062\U000e0077\U000e006c\U000e0073\U000e007f",
    "Republic of Ireland": "\U0001f1ee\U0001f1ea",
    "Czech Republic": "\U0001f1e8\U0001f1ff", "Turkey": "\U0001f1f9\U0001f1f7",
    "Serbia": "\U0001f1f7\U0001f1f8", "Chile": "\U0001f1e8\U0001f1f1",
    "Paraguay": "\U0001f1f5\U0001f1fe", "Ecuador": "\U0001f1ea\U0001f1e8",
    "Peru": "\U0001f1f5\U0001f1ea", "Venezuela": "\U0001f1fb\U0001f1ea",
    "China PR": "\U0001f1e8\U0001f1f3", "India": "\U0001f1ee\U0001f1f3",
    "Saudi Arabia": "\U0001f1f8\U0001f1e6", "Iran": "\U0001f1ee\U0001f1f7",
    "Qatar": "\U0001f1f6\U0001f1e6", "Costa Rica": "\U0001f1e8\U0001f1f7",
    "Jamaica": "\U0001f1ef\U0001f1f2", "Russia": "\U0001f1f7\U0001f1fa",
    "Ukraine": "\U0001f1fa\U0001f1e6", "Romania": "\U0001f1f7\U0001f1f4",
    "Hungary": "\U0001f1ed\U0001f1fa", "Greece": "\U0001f1ec\U0001f1f7",
    "Finland": "\U0001f1eb\U0001f1ee", "Iceland": "\U0001f1ee\U0001f1f8",
    "Israel": "\U0001f1ee\U0001f1f1", "South Africa": "\U0001f1ff\U0001f1e6",
    "DR Congo": "\U0001f1e8\U0001f1e9", "Mali": "\U0001f1f2\U0001f1f1",
    "Burkina Faso": "\U0001f1e7\U0001f1eb", "Guinea": "\U0001f1ec\U0001f1f3",
    "Gabon": "\U0001f1ec\U0001f1e6", "Panama": "\U0001f1f5\U0001f1e6",
    "Honduras": "\U0001f1ed\U0001f1f3", "Bosnia Herzegovina": "\U0001f1e7\U0001f1e6",
    "Albania": "\U0001f1e6\U0001f1f1", "North Macedonia": "\U0001f1f2\U0001f1f0",
    "Montenegro": "\U0001f1f2\U0001f1ea", "Slovakia": "\U0001f1f8\U0001f1f0",
    "Slovenia": "\U0001f1f8\U0001f1ee", "Bulgaria": "\U0001f1e7\U0001f1ec",
    "Ireland": "\U0001f1ee\U0001f1ea",
}


# ── Utility Functions ───────────────────────────────────────────────────────


def _player_id(p: Dict[str, Any]) -> str:
    key = f"{p.get('short_name', '')}_{p.get('overall', '')}_{p.get('club_name', '')}"
    return hashlib.md5(key.encode()).hexdigest()[:8]


def _safe_int(val: Any, default: int = 0) -> int:
    try:
        return int(float(val or default))
    except (ValueError, TypeError):
        return default


def _safe_float(val: Any, default: float = 0.0) -> float:
    try:
        return float(val or default)
    except (ValueError, TypeError):
        return default


def _get_specific_positions(p: Dict[str, Any]) -> List[str]:
    raw = str(p.get("player_positions", ""))
    return [pos.strip().upper() for pos in raw.split(",") if pos.strip()]


def transform_player(player_data: Dict[str, Any]) -> Dict[str, Any]:
    """Transform backend player metadata to the frontend Player shape. Tolerates missing keys."""
    if not isinstance(player_data, dict):
        player_data = {}
    positions = _get_specific_positions(player_data)
    first_position = positions[0] if positions else str(player_data.get("primary_position") or "ST")
    value_eur = _safe_float(player_data.get("value_eur", 0))

    is_gk = first_position == "GK"
    if is_gk:
        stats = {
            "pace": _safe_int(player_data.get("gk_speed", player_data.get("pace"))),
            "shooting": _safe_int(player_data.get("gk_kicking", player_data.get("shooting"))),
            "passing": _safe_int(player_data.get("gk_kicking", player_data.get("passing"))),
            "dribbling": _safe_int(player_data.get("gk_handling", player_data.get("dribbling"))),
            "defending": _safe_int(player_data.get("gk_positioning", player_data.get("defending"))),
            "physical": _safe_int(player_data.get("gk_reflexes", player_data.get("physic"))),
        }
    else:
        stats = {
            "pace": _safe_int(player_data.get("pace")),
            "shooting": _safe_int(player_data.get("shooting")),
            "passing": _safe_int(player_data.get("passing")),
            "dribbling": _safe_int(player_data.get("dribbling")),
            "defending": _safe_int(player_data.get("defending")),
            "physical": _safe_int(player_data.get("physic")),
        }

    return {
        "id": _player_id(player_data),
        "name": player_data.get("short_name", player_data.get("long_name", "Unknown")),
        "position": first_position,
        "rating": _safe_int(player_data.get("overall")),
        "country": player_data.get("nationality_name", ""),
        "countryFlag": COUNTRY_FLAGS.get(player_data.get("nationality_name", ""), "🏳️"),
        "club": player_data.get("club_name", ""),
        "age": _safe_int(player_data.get("age")),
        "stats": stats,
        "price": round(value_eur / 1_000_000, 1) if value_eur else 0,
        "height": _safe_int(player_data.get("height_cm")),
        "justification": player_data.get("justification", ""),
    }


def _can_play_slot(player_positions: List[str], slot_position: str) -> bool:
    compatible = SLOT_COMPATIBLE_POSITIONS.get(slot_position, [slot_position])
    return any(pp in compatible for pp in player_positions)


def _category_match(player_data: Dict[str, Any], slot_position: str) -> bool:
    slot_cat = SLOT_TO_CATEGORY.get(slot_position, "")
    player_cat = str(player_data.get("primary_position", "")).upper()
    return bool(slot_cat and player_cat == slot_cat)


def ensure_documents_loaded() -> None:
    """Load only documents (CSV parsing). No OpenAI key needed."""
    global _documents
    if not _documents:
        logger.info("Loading and cleaning player data from CSV...")
        _documents = ingestion.load_and_clean_data()
        logger.info("Loaded %d player documents", len(_documents))
    else:
        logger.debug("Using cached documents (%d)", len(_documents))


def ensure_data_loaded() -> None:
    global _documents, _vector_store, _retriever
    ensure_documents_loaded()
    if _vector_store is None:
        if os.path.isdir(FAISS_INDEX_PATH):
            try:
                logger.info("Loading FAISS index from %s (skipping re-embedding)...", FAISS_INDEX_PATH)
                _vector_store = retrieval.load_vector_store(FAISS_INDEX_PATH)
                _retriever = retrieval.get_retriever(_vector_store, k=50)
                logger.info("Vector store loaded from disk.")
            except Exception as e:
                logger.warning("Failed to load FAISS index, rebuilding: %s", e)
                _vector_store = retrieval.create_vector_store(_documents)
                retrieval.save_vector_store(_vector_store, FAISS_INDEX_PATH)
                _retriever = retrieval.get_retriever(_vector_store, k=50)
                logger.info("Vector store built and saved.")
        else:
            logger.info("Building FAISS vector store (first run)...")
            _vector_store = retrieval.create_vector_store(_documents)
            retrieval.save_vector_store(_vector_store, FAISS_INDEX_PATH)
            _retriever = retrieval.get_retriever(_vector_store, k=50)
            logger.info("Vector store ready and saved to %s", FAISS_INDEX_PATH)
    else:
        logger.debug("Using cached vector store.")


def retrieve_diverse_shortlist(query: str) -> List[Dict[str, Any]]:
    """Retrieve a broad shortlist covering all positions (1 main query + 2 supplements to limit embedding calls)."""
    logger.info("Retrieving shortlist for query: %s", query[:80] if query else "(empty)")
    ensure_data_loaded()

    # Main query with larger k to get diverse players in one call
    main_ret = retrieval.get_retriever(_vector_store, k=60)
    docs = list(retrieval.retrieve_players(query, main_ret))

    # Two supplement queries instead of four to reduce embedding API cost
    supplement_queries = [
        "top rated goalkeepers and defenders",
        "skilled midfielders and forwards creative passing",
    ]
    for sq in supplement_queries:
        extra_ret = retrieval.get_retriever(_vector_store, k=15)
        docs.extend(retrieval.retrieve_players(sq, extra_ret))

    seen: set[str] = set()
    shortlist: List[Dict[str, Any]] = []
    for d in docs:
        meta = d.metadata if hasattr(d, "metadata") else {}
        name = str(meta.get("short_name", ""))
        if name and name not in seen:
            seen.add(name)
            shortlist.append(meta)
    logger.info("Shortlist size: %d players", len(shortlist))
    return shortlist


def assign_to_formation(
    selected_players: List[Dict[str, Any]], formation: str
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Place players into pitch slots (11), bench (7), reserves (up to 5).
    Uses strict position matching: sided positions (LB/RB, LW/RW) are never swapped."""
    selected_players = [p for p in selected_players if isinstance(p, dict)]
    template = FORMATION_TEMPLATES.get(formation, FORMATION_TEMPLATES["4-3-3"])
    available = list(range(len(selected_players)))
    slot_player: List[Optional[int]] = [None] * len(template)

    # Pass 1: exact first-position match (highest priority)
    for si, slot in enumerate(template):
        for pi in list(available):
            positions = _get_specific_positions(selected_players[pi])
            if positions and positions[0] == slot["position"]:
                slot_player[si] = pi
                available.remove(pi)
                break

    # Pass 2: compatible position match (respects side constraints)
    for si, slot in enumerate(template):
        if slot_player[si] is not None:
            continue
        for pi in list(available):
            positions = _get_specific_positions(selected_players[pi])
            if _can_play_slot(positions, slot["position"]):
                slot_player[si] = pi
                available.remove(pi)
                break

    pitch_slots = []
    for si, slot in enumerate(template):
        player = None
        if slot_player[si] is not None:
            player = transform_player(selected_players[slot_player[si]])
        pitch_slots.append({
            "position": slot["position"],
            "player": player,
            "x": slot["x"],
            "y": slot["y"],
        })

    remaining = [selected_players[i] for i in available]
    bench_slots = [
        {"position": transform_player(p)["position"], "player": transform_player(p), "x": 0, "y": 0}
        for p in remaining[:7]
    ]
    reserve_slots = [
        {"position": transform_player(p)["position"], "player": transform_player(p), "x": 0, "y": 0}
        for p in remaining[7:12]
    ]

    return pitch_slots, bench_slots, reserve_slots


def _enrich_selected_from_shortlist(
    selected: List[Dict[str, Any]], shortlist: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Ensure every selected player has full metadata (player_positions, value_eur, etc.) by merging from shortlist."""
    by_name = {str(p.get("short_name", "")).strip().upper(): p for p in shortlist}
    by_name_long = {str(p.get("long_name", "")).strip().upper(): p for p in shortlist}
    enriched = []
    for s in selected:
        key = str(s.get("short_name", "")).strip().upper()
        full = by_name.get(key) or by_name_long.get(key)
        if full:
            merged = {**full}
            for k, v in s.items():
                if v is not None and v != "":
                    merged[k] = v
            enriched.append(merged)
        else:
            # Keep as-is; transform_player will use .get() defaults
            enriched.append(s)
    return enriched


# ── Request / Response Models ───────────────────────────────────────────────


class SquadConstraints(BaseModel):
    minGK: int = 3
    maxGK: int = 3
    minDEF: int = 8
    minMID: int = 7
    minFWD: int = 5


class BuildSquadRequest(BaseModel):
    prompt: str
    formation: str = "4-3-3"
    buildUpStyle: str = "Balanced"
    defensiveApproach: str = "Balanced"
    budget: float = 0
    budgetEnabled: bool = False
    constraints: SquadConstraints = SquadConstraints()


class ChatRequest(BaseModel):
    message: str
    formation: str = "4-3-3"
    buildUpStyle: str = "Balanced"
    defensiveApproach: str = "Balanced"
    budget: float = 0
    budgetEnabled: bool = False
    constraints: SquadConstraints = SquadConstraints()


class ReplaceRequest(BaseModel):
    position: str
    currentPlayerId: str
    currentSquadIds: List[str]


# ── Shared pipeline logic ──────────────────────────────────────────────────


def _pipeline_cache_key(
    query: str,
    formation: str,
    build_up_style: str,
    defensive_approach: str,
    budget: float,
    budget_enabled: bool,
    cons: SquadConstraints,
) -> str:
    """Stable cache key for pipeline response caching."""
    key_dict = {
        "query": query or "",
        "formation": formation,
        "build_up_style": build_up_style,
        "defensive_approach": defensive_approach,
        "budget": budget,
        "budget_enabled": budget_enabled,
        "minGK": cons.minGK,
        "maxGK": cons.maxGK,
        "minDEF": cons.minDEF,
        "minMID": cons.minMID,
        "minFWD": cons.minFWD,
    }
    return hashlib.md5(json.dumps(key_dict, sort_keys=True).encode()).hexdigest()


def _run_pipeline(
    query: str,
    formation: str,
    build_up_style: str,
    defensive_approach: str,
    budget: float,
    budget_enabled: bool,
    cons: SquadConstraints,
) -> Dict[str, Any]:
    global _last_shortlist, _last_squad, _response_cache, _response_cache_keys

    cache_key = _pipeline_cache_key(query, formation, build_up_style, defensive_approach, budget, budget_enabled, cons)
    if cache_key in _response_cache:
        logger.info("Returning cached pipeline result for key %s", cache_key[:8])
        return _response_cache[cache_key]

    shortlist = retrieve_diverse_shortlist(query)
    _last_shortlist = shortlist

    constraints_dict: Dict[str, Any] = {
        "max_players": 23,
        "min_gk": cons.minGK,
        "max_gk": cons.maxGK,
        "min_def": cons.minDEF,
        "min_mid": cons.minMID,
        "min_fwd": cons.minFWD,
    }

    user_prefs = (
        f"Formation: {formation}. "
        f"Build-up style: {build_up_style}. "
        f"Defensive approach: {defensive_approach}. "
        f"User query: {query}"
    )
    if budget_enabled and budget > 0:
        user_prefs += (
            f". BUDGET CONSTRAINT (MANDATORY): Total squad value_eur must NOT exceed €{budget} million EUR. "
            f"Build the strongest possible squad within this €{budget}M limit. "
            "If you cannot fit top-tier players, pick the best alternatives that keep total cost under budget."
        )
    else:
        user_prefs += (
            ". No budget constraint — select purely on quality and suitability."
        )

    logger.info("Calling reasoning.build_squad (LLM)...")
    try:
        squad = reasoning.build_squad(shortlist, constraints_dict, user_prefs)
    except Exception as e:
        logger.exception("reasoning.build_squad failed: %s", e)
        raise
    _last_squad = squad

    selected = squad.get("selected", [])
    logger.info("LLM returned %d selected players", len(selected))
    if not selected:
        logger.warning("No players selected by LLM; using top 23 from shortlist by overall.")
        selected = sorted(shortlist, key=lambda p: _safe_int(p.get("overall")), reverse=True)[:23]
    selected = _enrich_selected_from_shortlist(selected, shortlist)
    logger.info("Assigning %d players to formation %s", len(selected), formation)
    try:
        pitch_slots, bench_slots, reserve_slots = assign_to_formation(selected, formation)
    except Exception as e:
        logger.exception("assign_to_formation failed: %s", e)
        raise

    all_players = (
        [s["player"] for s in pitch_slots if s["player"]]
        + [s["player"] for s in bench_slots if s["player"]]
        + [s["player"] for s in reserve_slots if s["player"]]
    )
    total_cost = sum(p["price"] for p in all_players)
    player_count = len(all_players)

    budget_msg = f" within €{budget}M budget" if budget_enabled else ""
    ai_message = (
        f"Built a {formation} {build_up_style.lower()} squad with "
        f"{defensive_approach.lower()} defensive approach. "
        f"{player_count} players selected{budget_msg}. "
        f"Total cost: €{total_cost:.0f}M."
    )

    # Compute top-5 alternatives per pitch slot from the full shortlist
    selected_ids = {s["player"]["id"] for s in pitch_slots if s["player"]}
    logger.info("Building alternatives for %d pitch slots", len(pitch_slots))
    for slot in pitch_slots:
        pos = slot["position"]
        compatible = SLOT_COMPATIBLE_POSITIONS.get(pos, [pos])
        candidates = []
        for p in shortlist:
            pid = _player_id(p)
            if pid in selected_ids and slot["player"] and pid == slot["player"]["id"]:
                continue
            positions = _get_specific_positions(p)
            if any(pp in compatible for pp in positions) or _category_match(p, pos):
                candidates.append(p)
        candidates.sort(key=lambda c: _safe_int(c.get("overall")), reverse=True)
        slot["alternatives"] = [transform_player(c) for c in candidates[:5]]

    result = {
        "pitchSlots": pitch_slots,
        "benchSlots": bench_slots,
        "reserveSlots": reserve_slots,
        "strategyReasoning": squad.get("formation_notes", ""),
        "aiMessage": ai_message,
        "excluded": squad.get("excluded", []),
    }

    # Cache result for identical requests (avoid repeated API calls)
    if len(_response_cache) >= _response_cache_max_size and _response_cache_keys:
        oldest = _response_cache_keys.pop(0)
        _response_cache.pop(oldest, None)
    _response_cache[cache_key] = result
    if cache_key not in _response_cache_keys:
        _response_cache_keys.append(cache_key)

    return result


def _infer_tactics_from_message(message: str) -> Tuple[str, str, str, bool, float]:
    """
    Use the LLM to infer formation, build-up style, defensive approach, and budget
    from the user's natural language (e.g. "I want a defensive team under 200 million").
    Returns (formation, build_up_style, defensive_approach, budget_enabled, budget_millions).
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
    prompt = """You are a football tactics expert. Given the user's message about the kind of team they want, choose the best formation, build-up style, defensive approach, and any budget constraint.

User message: "{message}"

Respond with ONLY a single JSON object, no other text, with exactly these keys:
- "formation": one of 4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 3-4-3
- "buildUpStyle": one of Balanced, Counter-Attack, Short Passing
- "defensiveApproach": one of Balanced, Deep Block, High Press, Aggressive
- "budgetEnabled": true only if the user explicitly asked for a budget or spending limit (e.g. "under 200 million", "max 150M", "budget of 300"); otherwise false
- "budget": number in millions EUR (e.g. 200 for "under 200 million"). Use 0 if no budget mentioned. Reasonable range 50-500.

Interpret tactics: "defensive team" -> 3-5-2 or 4-4-2, Deep Block; "attacking" -> 4-3-3 or 3-4-3, High Press; "possession" -> Short Passing. If the user mentions a budget, set budgetEnabled true and budget to that value in millions."""

    try:
        resp = llm.invoke([HumanMessage(content=prompt.format(message=message or "balanced squad"))])
        content = (resp.content or "").strip()
        if "```" in content:
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                content = content[start:end]
        data = json.loads(content)
        formation = str(data.get("formation", "4-3-3")).strip()
        build_up = str(data.get("buildUpStyle", "Balanced")).strip()
        defensive = str(data.get("defensiveApproach", "Balanced")).strip()
        budget_enabled = bool(data.get("budgetEnabled", False))
        try:
            budget = float(data.get("budget", 0) or 0)
        except (TypeError, ValueError):
            budget = 0.0
        if budget_enabled and (budget <= 0 or budget > 2000):
            budget = 200.0
        if not budget_enabled:
            budget = 0.0
        if formation not in VALID_FORMATIONS:
            formation = "4-3-3"
        if build_up not in VALID_BUILD_UP:
            build_up = "Balanced"
        if defensive not in VALID_DEFENSIVE:
            defensive = "Balanced"
        logger.info(
            "Inferred tactics: formation=%s buildUp=%s defensive=%s budgetEnabled=%s budget=%s",
            formation, build_up, defensive, budget_enabled, budget,
        )
        return formation, build_up, defensive, budget_enabled, budget
    except Exception as e:
        logger.warning("Tactics inference failed, using defaults: %s", e)
        return "4-3-3", "Balanced", "Balanced", False, 0.0


# ── Endpoints ──────────────────────────────────────────────────────────────


@app.post("/api/build-squad")
def build_squad_endpoint(request: BuildSquadRequest):
    logger.info("POST /api/build-squad formation=%s prompt=%s", request.formation, (request.prompt or "")[:60])
    try:
        ensure_data_loaded()
    except FileNotFoundError as e:
        logger.error("Data not found: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

    try:
        result = _run_pipeline(
            query=request.prompt or "Build me a balanced World Cup squad",
            formation=request.formation,
            build_up_style=request.buildUpStyle,
            defensive_approach=request.defensiveApproach,
            budget=request.budget,
            budget_enabled=request.budgetEnabled,
            cons=request.constraints,
        )
        logger.info("POST /api/build-squad success")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Pipeline error: %s", e)
        tb = traceback.format_exc()
        logger.error("Traceback:\n%s", tb)
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline error: {type(e).__name__}: {str(e)}",
        )


@app.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    logger.info("POST /api/chat message=%s", (request.message or "")[:60])
    try:
        ensure_data_loaded()
    except FileNotFoundError as e:
        logger.error("Data not found: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

    try:
        # AI infers formation, build-up, defensive style, and budget from the user's message
        formation, build_up_style, defensive_approach, budget_enabled, budget = _infer_tactics_from_message(
            request.message
        )
        result = _run_pipeline(
            query=request.message,
            formation=formation,
            build_up_style=build_up_style,
            defensive_approach=defensive_approach,
            budget=budget,
            budget_enabled=budget_enabled,
            cons=request.constraints,
        )
        # Return inferred settings so the frontend can update the left panel
        result["formation"] = formation
        result["buildUpStyle"] = build_up_style
        result["defensiveApproach"] = defensive_approach
        result["budgetEnabled"] = budget_enabled
        result["budget"] = budget
        logger.info("POST /api/chat success")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Pipeline error: %s", e)
        logger.error("Traceback:\n%s", traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline error: {type(e).__name__}: {str(e)}",
        )


@app.post("/api/replace-player")
def replace_player_endpoint(request: ReplaceRequest):
    if not _last_shortlist:
        raise HTTPException(status_code=400, detail="No shortlist available. Build a squad first.")

    position = request.position.upper()
    compatible = SLOT_COMPATIBLE_POSITIONS.get(position, [position])
    squad_ids = set(request.currentSquadIds)

    candidates = []
    for p in _last_shortlist:
        pid = _player_id(p)
        if pid in squad_ids or pid == request.currentPlayerId:
            continue
        positions = _get_specific_positions(p)
        if any(pp in compatible for pp in positions) or _category_match(p, position):
            player = transform_player(p)
            reason = _build_replacement_reason(player, position)
            candidates.append({"player": player, "reason": reason})

    candidates.sort(key=lambda c: c["player"]["rating"], reverse=True)
    return candidates[:5]


def _build_replacement_reason(player: Dict[str, Any], position: str) -> str:
    stats = player.get("stats", {})
    parts = []
    if stats.get("pace", 0) > 85:
        parts.append(f"Elite pace ({stats['pace']})")
    if stats.get("defending", 0) > 85:
        parts.append(f"Strong defensive ability ({stats['defending']})")
    if stats.get("passing", 0) > 85:
        parts.append(f"Exceptional passing ({stats['passing']})")
    if stats.get("shooting", 0) > 85:
        parts.append(f"Clinical finishing ({stats['shooting']})")
    if stats.get("physical", 0) > 85:
        parts.append(f"Dominant physicality ({stats['physical']})")
    if not parts:
        parts.append(f"Solid {position} option, rated {player['rating']}")
    return ". ".join(parts) + "."


@app.get("/api/search-players")
def search_players(position: str = "", query: str = "", limit: int = 20):
    """Search the player database by position and/or name. No OpenAI key needed."""
    try:
        ensure_documents_loaded()
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))

    position = position.strip().upper()
    query_lower = query.strip().lower()
    compatible = SLOT_COMPATIBLE_POSITIONS.get(position, [position]) if position else []

    results = []
    for doc in _documents:
        meta = doc.metadata if hasattr(doc, "metadata") else {}
        if position:
            positions = _get_specific_positions(meta)
            if not (any(pp in compatible for pp in positions) or _category_match(meta, position)):
                continue
        if query_lower:
            name = str(meta.get("short_name", "")).lower()
            long_name = str(meta.get("long_name", "")).lower()
            club = str(meta.get("club_name", "")).lower()
            nation = str(meta.get("nationality_name", "")).lower()
            if not any(query_lower in field for field in [name, long_name, club, nation]):
                continue
        results.append(meta)

    results.sort(key=lambda p: _safe_int(p.get("overall")), reverse=True)
    return [transform_player(p) for p in results[:limit]]


@app.get("/")
def root():
    """Root endpoint for Render health checks."""
    return {"status": "ok", "service": "World Cup Squad Builder API"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
