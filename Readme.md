# Xanadu Xterra POC

## Ubuntu prerequisites

- Node.js 20 or newer
- npm
- Docker Engine with the Docker Compose plugin

## First-time setup

Run these commands from the repository root:

```bash
npm run setup
npm run infra:up
npm run backend:dev
```

`npm run setup` installs dependencies for the root project, every backend
service, and the frontend. It also creates missing local `.env` files from the
committed `.env.example` files.

The Docker infrastructure remains in the background. Stop all backend services
with `Ctrl+C` and stop the infrastructure with:

```bash
npm run infra:down
```

## Frontend

Start it separately from the repository root:

```bash
npm --prefix xterra-fe/frontend run dev
```

Open `http://localhost:5173/ai-agents`.

## MCP

The local MCP endpoint is `http://localhost:3006/mcp`. For an external MCP
client, forward port `3006` and update `MCP_SERVER_URL` in
`agent-service/.env` before registering an agent.
