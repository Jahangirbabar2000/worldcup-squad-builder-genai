"""
LangChain tools wrapping each pipeline stage for agent orchestration.

Owner:
    Person C

Purpose:
    - Expose the main pipeline capabilities as LangChain `Tool` objects so
      that an agent can call them in a ReAct-style reasoning loop.
    - Each tool should correspond to one or more stages of the pipeline:
        * Data ingestion
        * Retrieval / filtering
        * Reasoning / aggregation
        * Report generation

Dependencies (for eventual implementation):
    - `langchain.tools.Tool`
    - `src.ingestion.load_and_clean_data`
    - `src.retrieval.create_vector_store`, `src.retrieval.get_retriever`, `src.retrieval.retrieve_players`
    - `src.reasoning.build_squad`
    - `src.synthesis.generate_report`

Naming conventions (as per assignment guidance):
    - data_ingestion_tool
    - retrieval_or_filter_tool
    - reasoning_or_aggregation_tool
    - report_generation_tool

Important design note:
    - LangChain tools typically accept a single string argument. For more complex
      inputs (e.g., JSON with constraints), define thin wrapper functions that:
        * accept a string, parse or deserialize it, call the underlying
          pipeline function(s), then
        * return a stringified representation suitable for the agent.
    - This file only defines function signatures and documentation; actual `Tool`
      instances should be created in the implementation phase.
"""

from typing import Any


def data_ingestion_tool_fn(input_str: str) -> str:
    """
    Wrapper function intended to back the `data_ingestion_tool` LangChain Tool.

    Intended behavior (for implementation):
        - Ignore or lightly interpret `input_str` (since ingestion does not
          typically need complex parameters), or optionally accept configuration
          flags from the string.
        - Call `src.ingestion.load_and_clean_data()` to:
            * Load raw data
            * Clean and normalize it
            * Cache the processed CSV
            * Convert rows to `Document` objects
        - Optionally serialize or summarize the resulting documents (e.g., as JSON
          or a descriptive string) to return to the agent.

    Parameters:
        input_str:
            Placeholder string input required by the LangChain `Tool` interface.
            May be unused or reserved for configuration in the future.

    Returns:
        A string representation or summary of the ingested and cleaned player data
        suitable for the agent to reason about or pass to other tools.

    Notes for implementation:
        - The actual `Tool` object should be declared elsewhere as:
              Tool(
                  name="data_ingestion_tool",
                  func=data_ingestion_tool_fn,
                  description="Loads and cleans FIFA player data."
              )
        - Ensure that any heavy objects (e.g., full document lists) are either
          cached or referenced indirectly to avoid unnecessary serialization.
    """
    pass


def retrieval_or_filter_tool_fn(input_str: str) -> str:
    """
    Wrapper function intended to back the `retrieval_or_filter_tool` LangChain Tool.

    Intended behavior (for implementation):
        - Interpret `input_str` as a natural-language query describing desired
          player traits (e.g., "fast defenders", "young high-potential midfielders").
        - Ensure that a retriever exists by:
            * Accessing or constructing a FAISS vector store from ingested documents.
            * Calling `src.retrieval.get_retriever(vector_store, k=10)` or similar.
        - Use `src.retrieval.retrieve_players(query, retriever)` to obtain
          a shortlist of candidate players.
        - Return the shortlist in a serialized form (e.g., JSON) that can be
          consumed by the reasoning tool or agent.

    Parameters:
        input_str:
            Natural-language description of the player search criteria.

    Returns:
        A string representation (e.g., JSON) of retrieved player candidates.

    Notes for implementation:
        - Consider caching the vector store and retriever so that repeated calls
          do not recompute embeddings.
        - Clearly document the serialization format so that the reasoning tool
          can parse it reliably.
    """
    pass


def reasoning_or_aggregation_tool_fn(input_str: str) -> str:
    """
    Wrapper function intended to back the `reasoning_or_aggregation_tool` LangChain Tool.

    Intended behavior (for implementation):
        - Interpret `input_str` as a serialized object (e.g., JSON) that encodes:
            * shortlist: list of player dictionaries
            * constraints: dictionary with max_players, positional minimums, budget, etc.
            * user_preferences: string describing style and priorities
        - Deserialize this input into Python structures.
        - Call `src.reasoning.build_squad(shortlist, constraints, user_preferences)`
          to obtain the final squad structure.
        - Serialize the resulting squad dict back into a string (e.g., JSON)
          for the agent or downstream tools.

    Parameters:
        input_str:
            A serialized representation of the inputs required by `build_squad`.

    Returns:
        A string representation (e.g., JSON) of the final squad structure,
        including selected and excluded players, total wage, and formation notes.

    Notes for implementation:
        - Make sure to define and document the expected JSON schema for `input_str`
          and the returned string.
        - Any validation errors or constraint violations should be handled by
          `build_squad` and/or clearly surfaced in the output.
    """
    pass


def report_generation_tool_fn(input_str: str) -> str:
    """
    Wrapper function intended to back the `report_generation_tool` LangChain Tool.

    Intended behavior (for implementation):
        - Interpret `input_str` as a serialized structure (e.g., JSON) containing:
            * squad: the structured squad dict from `build_squad`
            * constraints_applied: the constraints dict used to generate the squad
        - Deserialize into Python objects.
        - Call `src.synthesis.generate_report(squad, constraints_applied)` to
          produce a user-facing report string.
        - Return that report string directly to the agent.

    Parameters:
        input_str:
            Serialized representation of the `squad` and `constraints_applied`
            needed by `generate_report`.

    Returns:
        A human-readable report string ready to display in the Gradio UI or as
        the agent's final answer.

    Notes for implementation:
        - This tool is likely to be called near the end of the agent's reasoning
          chain to synthesize all previous steps into a polished response.
        - Ensure that any serialization/deserialization logic is robust and
          well-documented for grading.
    """
    pass

# NOTE:
# Actual `Tool` objects (e.g., `data_ingestion_tool`, `retrieval_or_filter_tool`,
# `reasoning_or_aggregation_tool`, `report_generation_tool`) should be created
# in the implementation phase using the above *_fn wrappers.

