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
    template="""You are selecting a World Cup squad of exactly 23 players from a list of candidates.

HARD CONSTRAINTS (must be obeyed exactly):
{constraints}

CRITICAL RULES:
- Select EXACTLY 23 players total. No more, no less.
- Select EXACTLY 3 goalkeepers (GK). Never more than 3.
- Default composition: 3 GK, 8 DEF, 7 MID, 5 FWD = 23. Respect the min counts from constraints.
- POSITION ACCURACY: Each player's primary_position MUST match where they are assigned.
  Do NOT put a right back (RB) at left back (LB) or vice versa.
  Do NOT put a right winger (RW) at left wing (LW) or vice versa.
  Every player must play in their natural position — no side-swapping.
- If a budget constraint is specified in user preferences, the total value_eur of all 23 selected players must NOT exceed that budget. Build the strongest squad possible within the budget.
- If NO budget is specified, ignore cost entirely and pick the best players.

USER PREFERENCES:
{user_preferences}

CANDIDATE PLAYERS (each line: name | position | overall | wage/value | stats | age | nationality | club):
{candidates}

TASK:
1. Select exactly 23 players meeting all position minimums and maximums above.
2. Ensure every player's listed position matches the role they would fill.
3. For each selected player, write a 1-2 sentence justification referencing their actual stats.
4. List a few notable excluded players and briefly why they were cut.
5. Explain tradeoffs made (e.g. budget sacrifices, positional depth choices).

OUTPUT FORMAT (use this exact structure so it can be parsed):
---SELECTED---
[For each player: short_name | primary_position | overall | wage_eur | justification text]
---EXCLUDED---
[short_name | reason]
---TOTAL_WAGE---
[sum of selected wage_eur]
---FORMATION_NOTES---
[2-3 sentences on positional balance, tradeoffs, and budget rationale if applicable]
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
