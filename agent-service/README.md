# Agent Service

Standalone agent registration and authorization service. It does not modify or depend on source files in the existing services.

## Registration flow

`POST /agents/register` generates an Agent ID and one-time API key, stores the key hash and selected tools in one PostgreSQL `agents` table, creates OpenFGA tuples, and returns an MCP configuration.

The Docker PostgreSQL initializer creates `agent_db`. Copy `.env.example` to `.env` and adjust values locally.
