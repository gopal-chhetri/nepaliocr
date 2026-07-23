#!/bin/sh
set -e

# ============================================================
# NepaliOCR: Production Deploy Script (VPS build)
# Usage: infisical run --env=prod -- ./deploy.sh
# Builds and deploys from local git checkout on the VPS.
# ============================================================

REPO_DIR="/opt/app/nepaliocr"
COMPOSE_DIR="$REPO_DIR/deployments/production"
HEALTH_URL="http://localhost:8000/health"
HEALTH_RETRIES=20
HEALTH_INTERVAL=5

cd "$REPO_DIR"

# ── Validate required secrets are present ──
echo ">>> Validating environment variables..."
if [ -z "$DB_PASS" ] || [ -z "$OPENROUTER_API_KEYS" ] || [ -z "$JWT_SECRET" ]; then
    echo "!!! ERROR: Required secrets not found in environment"
    exit 1
fi
echo "    ✓ Secrets present"

# ── Save current HEAD for rollback ──
CURRENT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "")

# ── Pull latest code ──
echo ""
echo ">>> Pulling latest code..."
git pull

# ── Ensure database and redis are running ──
echo ""
echo ">>> Ensuring database and cache services are running..."
docker compose -f "$COMPOSE_DIR/compose.yml" up -d postgres redis

# Give database time to initialize
echo ">>> Waiting for database to initialize..."
sleep 10

# ── Build new images ──
echo ""
echo ">>> Building images..."
docker compose -f "$COMPOSE_DIR/compose.yml" build

# ── Deploy new version ──
echo ""
echo ">>> Starting new version..."
docker compose -f "$COMPOSE_DIR/compose.yml" up -d

# ── Health check ──
echo ""
echo ">>> Waiting for health check..."
RETRIES=$HEALTH_RETRIES
until [ $RETRIES -eq 0 ] || wget -qO- "$HEALTH_URL" > /dev/null 2>&1; do
    RETRIES=$((RETRIES - 1))
    echo "    Retries left: $RETRIES"
    sleep $HEALTH_INTERVAL
done

if [ $RETRIES -eq 0 ]; then
    echo ""
    echo "!!! Health check failed!"
    echo ""
    echo ">>> Showing last 50 lines of backend logs:"
    docker compose -f "$COMPOSE_DIR/compose.yml" logs --tail=50 backend
    echo ""

    if [ -n "$CURRENT_SHA" ]; then
        echo ">>> Rolling back to $CURRENT_SHA..."
        git reset --hard "$CURRENT_SHA"
        docker compose -f "$COMPOSE_DIR/compose.yml" build
        docker compose -f "$COMPOSE_DIR/compose.yml" up -d

        sleep 5
        if wget -qO- "$HEALTH_URL" > /dev/null 2>&1; then
            echo ">>> Rollback successful."
        else
            echo "!!! Rollback also failed. Manual intervention required."
        fi
    else
        echo "!!! No previous SHA to roll back to."
    fi
    exit 1
fi

echo ""
echo ">>> Deployment successful!"

# ── Prune old images ──
echo ""
echo ">>> Pruning old images..."
docker image prune -f

echo ""
echo ">>> Done!"
