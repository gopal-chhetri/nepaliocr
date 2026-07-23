#!/usr/bin/env bash
set -euo pipefail

echo "=== VPS Setup: Nepali OCR ==="

if ! command -v docker &>/dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "${USER}"
  echo "Docker installed. Log out and back in for group changes."
fi

sudo mkdir -p /opt/app/nepaliocr
sudo chown "${USER}:${USER}" /opt/app/nepaliocr

docker network inspect traefik-network &>/dev/null || \
  docker network create traefik-network

echo "=== VPS setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Install Infisical CLI: https://infisical.com/docs/cli/installation"
echo "  2. Authenticate: infisical login"
echo "  3. Deploy: cd /opt/app/nepaliocr && infisical run -- docker compose up -d --build"