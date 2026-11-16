# HARNESS: neither the tool-based page nor the agent-readonly page shows a server; wired like the
# quickstart main.py. One process on :8061 serves both doc agents on sub-paths.
from ag_ui_antigravity import create_antigravity_app

from agents.app_context import app_context_agent
from agents.gen_ui_tool_based import gen_ui_tool_based_agent
from agents.reasoning import reasoning_agent  # HARNESS 2026-11-16: the doc's reasoning.py (was the quickstart agent)

app = create_antigravity_app(
    {"/tool-based": gen_ui_tool_based_agent(), "/app-context": app_context_agent(), "/reasoning-default": reasoning_agent(), "/reasoning-custom": reasoning_agent()}, path="/"
)
