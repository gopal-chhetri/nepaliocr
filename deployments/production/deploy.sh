#!/usr/bin/env bash
# Usage: infisical run -- ./deployments/production/deploy.sh
set -euo pipefail

COMPOSE_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="/opt/app/nepaliocr"

echo "=== Deploying Nepali OCR ==="

mkdir -p "${TARGET_DIR}"
cp "${COMPOSE_DIR}/compose.yml" "${TARGET_DIR}/compose.yml"

cd "${TARGET_DIR}"

echo "Starting services..."
docker compose up -d --build

docker image prune -f

echo "=== Deploy complete ==="