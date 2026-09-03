#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Installing root dependencies..."
npm ci

services=(
  api-gateway
  auth-service
  authorization-service
  organisation-service
  project-service
  approval-service
  agent-service
  mcp-service
  xterra-fe/frontend
)

for service in "${services[@]}"; do
  echo "Installing $service dependencies..."
  npm --prefix "$service" ci

  if [[ -f "$service/.env.example" && ! -f "$service/.env" ]]; then
    cp "$service/.env.example" "$service/.env"
    echo "Created $service/.env from .env.example"
  fi
done

echo "Setup complete. Start Docker with: npm run infra:up"
echo "Then start the backend with: npm run backend:dev"
