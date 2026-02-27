"""
Centralized prompt templates for the World Cup Squad Builder project.
"""

from langchain_core.prompts import PromptTemplate

RETRIEVAL_QUERY_PROMPT = PromptTemplate(
    input_variables=["user_query"],
    template="""Convert the following casual user request about building a football/soccer squad into a concise search query focused on player attributes (positions, stats like pace/defending/shooting, age, wage, nationality, etc.). Output only the search query, no explanation.

User request: {user_query}

Search query:""",
)

REASONING_PROMPT = PromptTemplate(
    input_variables=["candidates", "constraints", "user_preferences"],
    template="""You are selecting a World Cup squad from a list of candidate players. You must respect ALL hard constraints and optional budget if given.

CONSTRAINTS:
{constraints}

USER PREFERENCES (apply when possible):
{user_preferences}

CANDIDATE PLAYERS (each line is one player with stats):
{candidates}

TASK:
1. Select exactly the maximum number of players allowed, meeting minimums for each position (GK, DEF, MID, FWD).
2. If a total wage budget is specified, the sum of selected players' wage_eur must not exceed it.
3. For each selected player, write a 1-2 sentence justification that references their actual stats (e.g. pace, overall, defending).
4. List a few notable excluded players and briefly why they were cut.
5. State any tradeoffs (e.g. "sacrificed depth in midfield to stay under budget").

OUTPUT FORMAT (use this exact structure so it can be parsed):
---SELECTED---
[For each player list: short_name | primary_position | overall | wage_eur | justification text]
---EXCLUDED---
[short_name | reason]
---TOTAL_WAGE---
[sum of selected wage_eur]
---FORMATION_NOTES---
[2-3 sentences on positional balance and tradeoffs]
""",
)

SYNTHESIS_PROMPT = PromptTemplate(
    input_variables=["squad", "constraints_applied"],
    template="""Generate a formatted squad report from the following structured squad data.

CONSTRAINTS THAT WERE APPLIED:
{constraints_applied}

SQUAD DATA:
{squad}

Include in your report:
1. A clear squad table grouped by position (GK, DEF, MID, FWD) with player name, position, overall rating, key stat, and a short justification.
2. A 2-3 sentence "Squad philosophy" summary.
3. If a budget was applied: total wage and budget summary.
4. A short list of notable excluded players and why they were cut.
5. This exact disclaimer: "This is an educational tool, not professional sports analytics advice. Selections are based on FIFA video game ratings and do not reflect real-world performance."
6. Data source: "Player data from EA Sports FC 24 complete player dataset (Kaggle, Stefano Leone)."

Write in clear, readable markdown where appropriate.
""",
)

# ReAct agent prompt: must include tools, tool_names, agent_scratchpad, input; optional chat_history for memory
REACT_AGENT_PROMPT = PromptTemplate(
    input_variables=["chat_history", "input", "agent_scratchpad", "tools", "tool_names"],
    template="""You are a World Cup Squad Builder assistant. You help users build an optimal 23-player squad from FIFA/EA Sports FC 24 player data.

You have access to these tools:
- data_ingestion_tool: Load and clean FIFA player data (call once at start if user wants to build a squad).
- retrieval_or_filter_tool: Find players matching criteria (e.g. "fast defenders", "young midfielders"). Input is a natural language query.
- reasoning_or_aggregation_tool: Select the final squad from a shortlist applying roster constraints. Input is a JSON string with "shortlist", "constraints", and "user_preferences".
- report_generation_tool: Generate the final formatted squad report. Input is a JSON string with "squad" and "constraints_applied".

Typical flow: 1) Ingest data if needed, 2) Retrieve players with retrieval_or_filter_tool, 3) Build squad with reasoning_or_aggregation_tool, 4) Generate report with report_generation_tool. Remember user preferences (budget, style) across turns.

Use this format:
Thought: your reasoning
Action: the tool name
Action Input: the tool input
Observation: result from the tool
... (repeat as needed)
Thought: I now know the final answer
Final Answer: the squad report or answer for the user

Previous chat history (remember user preferences):
{chat_history}

User input: {input}

Tools:
{tools}

Tool names: {tool_names}

Thought: {agent_scratchpad}""",
)
