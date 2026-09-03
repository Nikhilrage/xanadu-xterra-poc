# Xterra MCP Service

Standalone MCP Streamable HTTP server at `POST /mcp`. Every request requires `x-agent-id` and `x-api-key`; every tool invocation is re-authorized by Agent Service and OpenFGA.

Business tools are registered per authenticated agent according to its selected registration permissions:

- `get_project_details` — real Project Service data
- `get_lead_details` — clearly marked POC fixture data

Copy `.env.example` to `.env` and adjust the Agent Service URL when needed.
