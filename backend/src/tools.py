"""
LangChain tools wrapping each pipeline stage for agent orchestration.
"""

import json
from typing import Any, List

from langchain_core.tools import Tool

from src import ingestion, retrieval, reasoning, synthesis

# Module-level cache for documents and vector store (set by ingestion, used by retrieval)
_cached_documents: List[Any] = []
_cached_vector_store: Any = None
_cached_retriever: Any = None


def data_ingestion_tool_fn(input_str: str) -> str:
    """Load and clean FIFA player data; cache documents for retrieval."""
    global _cached_documents, _cached_vector_store, _cached_retriever
    _cached_documents = ingestion.load_and_clean_data()
    _cached_vector_store = None
    _cached_retriever = None
    return f"Loaded and cleaned {len(_cached_documents)} players. Use retrieval_or_filter_tool to find players by criteria."


def retrieval_or_filter_tool_fn(input_str: str) -> str:
    """Retrieve players matching the query; returns JSON list of player dicts."""
    global _cached_documents, _cached_vector_store, _cached_retriever
    query = (input_str or "best players").strip()
    if not query:
        query = "best players"
    if not _cached_documents and not _cached_vector_store:
        _cached_documents = ingestion.load_and_clean_data()
    if not _cached_documents:
        return "No player data available. Run data_ingestion_tool first."
    if _cached_vector_store is None:
        _cached_vector_store = retrieval.create_vector_store(_cached_documents)
        _cached_retriever = retrieval.get_retriever(_cached_vector_store, k=30)
    docs = retrieval.retrieve_players(query, _cached_retriever)
    shortlist = []
    for d in docs:
        shortlist.append(d.metadata if hasattr(d, "metadata") else {})
    return json.dumps({"shortlist": shortlist, "query": query})


def reasoning_or_aggregation_tool_fn(input_str: str) -> str:
    """Build squad from shortlist; input is JSON with shortlist, constraints, user_preferences."""
    try:
        data = json.loads(input_str)
    except json.JSONDecodeError:
        return "Invalid JSON. Provide a JSON object with keys: shortlist, constraints (max_players, min_gk, min_def, min_mid, min_fwd, budget?), user_preferences."
    shortlist = data.get("shortlist", [])
    constraints = data.get("constraints", {})
    if not isinstance(constraints, dict):
        constraints = {}
    user_preferences = data.get("user_preferences", "") or ""
    if not shortlist:
        return "Shortlist is empty. Use retrieval_or_filter_tool first to get players."
    constraints.setdefault("max_players", 23)
    constraints.setdefault("min_gk", 3)
    constraints.setdefault("min_def", 6)
    constraints.setdefault("min_mid", 6)
    constraints.setdefault("min_fwd", 4)
    squad = reasoning.build_squad(shortlist, constraints, user_preferences)
    return json.dumps(squad, default=str)


def report_generation_tool_fn(input_str: str) -> str:
    """Generate formatted report; input is JSON with squad and constraints_applied."""
    try:
        data = json.loads(input_str)
    except json.JSONDecodeError:
        return "Invalid JSON. Provide a JSON object with keys: squad, constraints_applied."
    squad = data.get("squad", {})
    constraints_applied = data.get("constraints_applied", {})
    return synthesis.generate_report(squad, constraints_applied)


data_ingestion_tool = Tool(
    name="data_ingestion_tool",
    func=data_ingestion_tool_fn,
    description="Loads and cleans FIFA player data from the dataset. Call this first when the user wants to build a squad. Input can be empty or any message.",
)

retrieval_or_filter_tool = Tool(
    name="retrieval_or_filter_tool",
    func=retrieval_or_filter_tool_fn,
    description="Use this tool to find players matching specific criteria. Input: natural language query, e.g. 'fast defenders', 'best free kick takers', 'young high-potential midfielders', 'cheap goalkeepers'. Returns a shortlist as JSON.",
)

reasoning_or_aggregation_tool = Tool(
    name="reasoning_or_aggregation_tool",
    func=reasoning_or_aggregation_tool_fn,
    description="Use this tool to select the final squad from a shortlist of players, applying roster constraints (max 23 players, min 3 GK, min 6 DEF, min 6 MID, min 4 FWD, optional budget). Input: JSON string with keys 'shortlist' (from retrieval tool), 'constraints', 'user_preferences'.",
)

report_generation_tool = Tool(
    name="report_generation_tool",
    func=report_generation_tool_fn,
    description="Use this tool to generate the final formatted squad report for the user. Input: JSON string with keys 'squad' (from reasoning tool output) and 'constraints_applied'.",
)

ALL_TOOLS = [data_ingestion_tool, retrieval_or_filter_tool, reasoning_or_aggregation_tool, report_generation_tool]
