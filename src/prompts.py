"""
Centralized prompt templates for the World Cup Squad Builder project.

Owner:
    Initial drafts by Person A, refinements by Person B and Person C.

Purpose:
    - Define and document all LLM prompts used across the four pipeline stages:
        * Optional retrieval query rewriting (Stage 2).
        * Squad reasoning and constraint satisfaction (Stage 3).
        * Final report synthesis (Stage 4).
        * Agent system / orchestration prompt for ReAct-style reasoning.
    - Allow graders to inspect a single file to understand all LLM interactions,
      which is important for the architecture and responsible AI grading criteria.

Dependencies (for eventual implementation):
    - `langchain.prompts.PromptTemplate` or `langchain_core.prompts.PromptTemplate`.

Expected prompt templates (to be implemented as module-level `PromptTemplate` variables):
    - RETRIEVAL_QUERY_PROMPT:
        * Input variables: `user_query`
        * Goal: Convert casual user descriptions into concise attribute-based
          retrieval queries (e.g., stats and positions).
    - REASONING_PROMPT:
        * Input variables: `candidates`, `constraints`, `user_preferences`
        * Goal: Select exactly N players from a candidate list while respecting
          hard roster constraints and optional budget, providing justifications,
          excluded players, and tradeoffs in a structured, parseable format.
    - SYNTHESIS_PROMPT:
        * Input variables: `squad`, `constraints_applied`
        * Goal: Generate a formatted squad report with player table, squad
          philosophy, budget summary, notable exclusions, data-source citation,
          and an educational-use disclaimer.
    - AGENT_SYSTEM_PROMPT:
        * Input variables: (as needed for agent creation)
        * Goal: Describe the agent's role, tools, and ReAct-style behavior,
          ensuring it reasons step-by-step with Thought → Action → Observation
          loops and uses tools appropriately.

Implementation notes:
    - When implemented, each prompt should be declared as a module-level variable, e.g.:
        RETRIEVAL_QUERY_PROMPT: PromptTemplate = PromptTemplate(...)
        REASONING_PROMPT: PromptTemplate = PromptTemplate(...)
        SYNTHESIS_PROMPT: PromptTemplate = PromptTemplate(...)
        AGENT_SYSTEM_PROMPT: PromptTemplate = PromptTemplate(...)
    - Output formats for reasoning/synthesis prompts should be structured
      (e.g., JSON-like or clearly parseable sections) to support validation
      and post-processing in `src.reasoning` and `src.synthesis`.
    - Prompts should explicitly instruct the model to:
        * Reference actual stats from the input.
        * Respect hard constraints (no violating roster rules).
        * State limitations and assumptions (for responsible AI).
"""

# NOTE:
# No PromptTemplate instances are created here yet, in accordance with the
# "no implementation code" scaffolding requirement. Instead, this file
# serves as a specification for how Person A/B/C should define them.
#
# Suggested future structure (for implementers):
#
# from langchain_core.prompts import PromptTemplate
#
# RETRIEVAL_QUERY_PROMPT: PromptTemplate
# REASONING_PROMPT: PromptTemplate
# SYNTHESIS_PROMPT: PromptTemplate
# AGENT_SYSTEM_PROMPT: PromptTemplate

