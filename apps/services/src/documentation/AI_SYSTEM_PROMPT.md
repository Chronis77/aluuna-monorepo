### Aluuna System Prompt (Quick Reference)

This prompt is assembled dynamically from `apps/services/src/openai/prompt.config.json` and the MCP user context. Edit the JSON to change static sections.

Sections:
- Identity: Defines voice and therapeutic stance.
- Mode: One of `crisis_support`, `daily_check_in`, `insight_generation`, `free`.
- Safety: Crisis and boundary rules.
- Response Style: How Aluuna responds.
- Tool-Calling and Memory Policy: When/how to search and write memory.
- Database Alignment Guide: Mapping of memories to tables.
- RAG Policy: How to retrieve and use vector memory.
- Boundaries: Professional and ethical boundaries.
- User Context: MCP-rendered summary, parts, insights, trends, sessions, context.

Note: The MCP is built from DB via `buildMCP(...)` and rendered by `formatMCPForOpenAI(...)`.


