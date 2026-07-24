#!/bin/sh
set -e

# ============================================================
# NepaliOCR: Production Deploy Script
# Usage: infisical run --env=prod -- ./deploy.sh <image-tag>
# Note: Should be run INSIDE infisical run (secrets already in env)
# ============================================================

IMAGE_TAG=${1:?Usage: deploy.sh <image-tag>}
COMPOSE_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_SERVICE="backend"
FRONTEND_SERVICE="frontend"
HEALTH_URL="http://localhost:8000/health"
HEALTH_RETRIES=20
HEALTH_INTERVAL=5

cd "$COMPOSE_DIR"

# ── Validate required secrets are present ──
echo ">>> Validating environment variables..."
if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASS" ] || [ -z "$DB_NAME" ] || [ -z "$OPENROUTER_API_KEYS" ] || [ -z "$JWT_SECRET" ]; then
    echo "!!! ERROR: Required secrets not found in environment"
    echo "    Make sure this script is run inside: infisical run --env=prod --"
    exit 1
fi
echo "    ✓ Secrets present"

# ── Save current images for rollback ──
CURRENT_BACKEND_IMAGE=$(docker compose ps -q $BACKEND_SERVICE 2>/dev/null | xargs docker inspect --format='{{.Config.Image}}' 2>/dev/null || echo "")
CURRENT_FRONTEND_IMAGE=$(docker compose ps -q $FRONTEND_SERVICE 2>/dev/null | xargs docker inspect --format='{{.Config.Image}}' 2>/dev/null || echo "")
CURRENT_TAG=$(echo "$CURRENT_BACKEND_IMAGE" | cut -d: -f2)
if [ -z "$CURRENT_TAG" ]; then
    CURRENT_TAG="none"
    echo "No existing deployment found."
else
    echo "Current backend: $CURRENT_BACKEND_IMAGE"
    echo "Current frontend: $CURRENT_FRONTEND_IMAGE"
fi

echo "Deploying: ${IMAGE_TAG}"

# ── Log in to GHCR ──
echo ""
echo ">>> Authenticating Docker with GitHub Container Registry..."
echo "$REGISTRY_PASSWORD" | docker login ghcr.io -u "$REGISTRY_USERNAME" --password-stdin

# ── Pull new images ──
echo ""
echo ">>> Pulling images..."
export IMAGE_TAG
docker compose pull $BACKEND_SERVICE $FRONTEND_SERVICE

# ── Ensure database and redis are running ──
echo ""
echo ">>> Ensuring database and cache services are running..."
docker compose up -d postgres redis

# Give database time to initialize with the correct password
echo ">>> Waiting for database to initialize..."
sleep 10

# ── Deploy new version ──
echo ""
echo ">>> Starting new version..."
docker compose up -d --no-deps $BACKEND_SERVICE $FRONTEND_SERVICE

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
    docker compose logs --tail=50 $BACKEND_SERVICE
    echo ""
    echo ">>> Rolling back to ${CURRENT_TAG}..."

    if [ "$CURRENT_TAG" = "none" ]; then
        echo ">>> No previous version to roll back to. Stopping."
        docker compose stop $BACKEND_SERVICE $FRONTEND_SERVICE
        exit 1
    fi

    # Rollback: use the previous image tag
    IMAGE_TAG="$CURRENT_TAG" docker compose up -d --no-deps $BACKEND_SERVICE $FRONTEND_SERVICE

    # Verify rollback
    sleep 5
    if wget -qO- "$HEALTH_URL" > /dev/null 2>&1; then
        echo ">>> Rollback successful. Running: ${CURRENT_TAG}"
    else
        echo "!!! Rollback also failed. Manual intervention required."
    fi
    exit 1
fi

echo ""
echo ">>> Deployment successful!"
echo "    Tag: ${IMAGE_TAG}"

# ── Prune old images ──
echo ""
echo ">>> Pruning old images..."
docker image prune -f

echo ""
echo ">>> Done!"
