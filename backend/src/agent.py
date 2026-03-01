"""
Agent orchestration module for the World Cup Squad Builder.
"""

from typing import Any

from langchain_openai import ChatOpenAI
from langchain_classic.memory import ConversationBufferMemory
from langchain_classic.agents import AgentExecutor, create_react_agent

from src.tools import ALL_TOOLS
from src.prompts import REACT_AGENT_PROMPT


def create_agent() -> Any:
    """Create LangChain agent with tools and conversation memory."""
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=False,
    )
    agent = create_react_agent(llm, ALL_TOOLS, REACT_AGENT_PROMPT)
    executor = AgentExecutor(
        agent=agent,
        tools=ALL_TOOLS,
        memory=memory,
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=15,
    )
    return executor


def run_query(agent: Any, user_input: str) -> str:
    """Run user input through the agent and return the final response."""
    try:
        result = agent.invoke({"input": user_input})
        output = result.get("output", result.get("output_text", str(result)))
        return output if output else "No response generated."
    except Exception as e:
        return f"Error: {e}. Please try rephrasing or running data ingestion first."
