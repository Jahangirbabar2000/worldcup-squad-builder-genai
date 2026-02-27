"""
Gradio web application entry point for the World Cup Squad Builder.
"""

import os
from dotenv import load_dotenv

load_dotenv()

import gradio as gr

from src.agent import create_agent, run_query

# Create agent once at startup (lazy so Gradio can load without API key)
_agent = None


def get_agent():
    global _agent
    if _agent is None:
        _agent = create_agent()
    return _agent


def respond(user_input: str, _budget: float) -> str:
    if not user_input or not user_input.strip():
        return "Please enter a request, e.g. 'Build me a World Cup squad with fast attackers and strong defenders, budget under 500000 EUR'."
    agent = get_agent()
    if _budget and _budget > 0:
        user_input = f"{user_input} (Total wage budget: {int(_budget)} EUR)"
    return run_query(agent, user_input.strip())


def launch_app() -> None:
    with gr.Blocks() as demo:
        gr.Markdown("# World Cup Squad Builder")
        gr.Markdown("Build an optimal 23-player squad from FIFA/EA Sports FC 24 player data. Ask in natural language (e.g. fast defenders, young midfielders, budget limit).")
        budget_slider = gr.Slider(
            minimum=0,
            maximum=2_000_000,
            value=0,
            step=50_000,
            label="Optional total wage budget (EUR). 0 = no limit.",
        )
        inp = gr.Textbox(
            label="Your request",
            placeholder="e.g. Build me a World Cup squad with fast attackers and strong defenders, budget under 500000 EUR",
            lines=3,
        )
        out = gr.Markdown(label="Squad report")
        btn = gr.Button("Build squad")
        btn.click(fn=respond, inputs=[inp, budget_slider], outputs=out)

        gr.Markdown("### Sample queries")
        samples = [
            "Load the player data and build me a balanced World Cup squad.",
            "Find fast defenders and build a squad with a solid defense, budget under 400000 EUR.",
            "Build a squad focused on pace and young high-potential players.",
        ]
        for s in samples:
            bt = gr.Button(s)
            bt.click(fn=lambda q=s: respond(q, 0), inputs=[], outputs=out)

    demo.launch()


if __name__ == "__main__":
    launch_app()
