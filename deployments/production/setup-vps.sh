#!/bin/sh
set -e

# ============================================================
# NepaliOCR: VPS Setup Script
# Usage: ./setup-vps.sh <vps-ip> <ssh-user>
# Clones the repo to /opt/app/nepaliocr on the VPS.
# ============================================================

VPS=${1:?Usage: setup-vps.sh <vps-ip> <ssh-user>}
USER=${2:?Usage: setup-vps.sh <vps-ip> <ssh-user>}
REPO="git@github.com:gopal-chhetri/nepaliocr.git"
APP_DIR="/opt/app/nepaliocr"

echo ">>> Setting up VPS: $USER@$VPS"

# ── Install Docker (skip if already installed) ──
echo ""
echo ">>> Checking Docker..."
if ssh "$USER@$VPS" "command -v docker > /dev/null 2>&1"; then
    echo "    Docker already installed, skipping."
else
    echo ">>> Installing Docker..."
    ssh "$USER@$VPS" "sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin && sudo usermod -aG docker $USER"
    echo "    Log out and log back in for group changes."
fi

# ── Ensure sudo doesn't require tty (for git pull via SSH) ──
echo ""
echo ">>> Ensuring sudo doesn't require tty..."
ssh "$USER@$VPS" "sudo sed -i 's/^Defaults    requiretty/#Defaults    requiretty/' /etc/sudoers 2>/dev/null || true"

# ── Create app directory with proper ownership ──
echo ""
echo ">>> Creating app directory..."
ssh "$USER@$VPS" "sudo mkdir -p $APP_DIR && sudo chown $USER:$USER $APP_DIR"

# ── Clone or pull the repo ──
echo ""
echo ">>> Cloning repository..."
ssh "$USER@$VPS" "if [ -d $APP_DIR/.git ]; then echo '    Repo exists, skipping clone.'; else git clone $REPO $APP_DIR; fi"

# ── Ensure traefik-network exists ──
echo ""
echo ">>> Ensuring traefik-network exists..."
ssh "$USER@$VPS" "docker network create traefik-network 2>/dev/null || true"

echo ""
echo "============================================"
echo "  VPS setup complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo ""
echo "  1. Log out and log back in (for Docker group)"
echo ""
echo "  2. Set Infisical credentials:"
echo "     export INFISICAL_CLIENT_ID='<vps-deploy-client-id>'"
echo "     export INFISICAL_CLIENT_SECRET='<vps-deploy-client-secret>'"
echo "     export INFISICAL_PROJECT_ID='<project-uuid>'"
echo ""
echo "  3. Deploy:"
echo "     cd $APP_DIR"
echo "     infisical run --env=prod -- ./deployments/production/deploy.sh"
echo ""
