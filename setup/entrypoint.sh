#!/bin/sh
set -eu

DB_PATH="${DB_PATH:-/data/ttt.db}"
DB_DIR="$(dirname "${DB_PATH}")"

mkdir -p "${DB_DIR}"

if [ ! -f "${DB_PATH}" ]; then
  echo "Database not found; initializing ${DB_PATH}"
  bash /app/scripts/create_db.sh "${DB_PATH}"
else
  echo "Using existing database: ${DB_PATH}"
fi

export DB_PATH
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"
export NODE_ENV="${NODE_ENV:-production}"
export SCHEDULE_SERVICE_URL="${SCHEDULE_SERVICE_URL:-http://127.0.0.1:8383}"
export SESSION_SECRET="${SESSION_SECRET:-change-me-in-production}"
# HTTP-only Docker (port 80, no TLS): secure cookies are not sent by browsers.
export SESSION_COOKIE_SECURE="${SESSION_COOKIE_SECURE:-0}"
export TRUST_PROXY="${TRUST_PROXY:-1}"

NGINX_PID=""
PYTHON_PID=""
NODE_PID=""

shutdown() {
  echo "Shutting down services..."
  if [ -n "${NGINX_PID}" ]; then kill "${NGINX_PID}" 2>/dev/null || true; fi
  if [ -n "${PYTHON_PID}" ]; then kill "${PYTHON_PID}" 2>/dev/null || true; fi
  if [ -n "${NODE_PID}" ]; then kill "${NODE_PID}" 2>/dev/null || true; fi
  wait 2>/dev/null || true
}

trap shutdown TERM INT

echo "Starting nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

echo "Starting schedule service..."
cd /app/schedule_service
python3 server.py &
PYTHON_PID=$!

echo "Starting API..."
cd /app
node apps/api/dist/index.js &
NODE_PID=$!

while true; do
  if ! kill -0 "${NGINX_PID}" 2>/dev/null; then
    echo "nginx exited"
    break
  fi
  if ! kill -0 "${PYTHON_PID}" 2>/dev/null; then
    echo "schedule service exited"
    break
  fi
  if ! kill -0 "${NODE_PID}" 2>/dev/null; then
    echo "API exited"
    break
  fi
  sleep 2
done

shutdown
exit 1