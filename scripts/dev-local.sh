#!/usr/bin/env bash
# Start the local Next.js development server.
#
# Usage:
#   ./scripts/dev-local.sh
#   PORT=3001 ./scripts/dev-local.sh

set -euo pipefail

PORT="${PORT:-3000}"
DEV_HOST="${DEV_HOST:-127.0.0.1}"

echo "Starting Mamahjong dev server..."
echo "URL: http://${DEV_HOST}:${PORT}"
echo

exec npx next dev --hostname "$DEV_HOST" --port "$PORT"
