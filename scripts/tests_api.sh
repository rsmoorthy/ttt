#!/usr/bin/env bash
# Run all API integration test suites sequentially.
# Usage: ./scripts/tests_api.sh [base_url]
# Requires API server running and seeded users (admin1/guest1/super1, password: secret).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="${1:-http://localhost:3000}"

run_suite() {
  local name="$1"
  local script="$2"
  echo ""
  echo "========================================"
  echo "Running ${name}"
  echo "========================================"
  "${script}" "${BASE_URL}"
}

echo "API integration tests against ${BASE_URL}"
echo "Started at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

run_suite "Tournament API" "${SCRIPT_DIR}/test_tournaments_api.sh"
run_suite "Stage API" "${SCRIPT_DIR}/test_stages_api.sh"
run_suite "Registration API" "${SCRIPT_DIR}/test_registration_api.sh"
run_suite "Fixtures API" "${SCRIPT_DIR}/test_fixtures_api.sh"
run_suite "Schedule API" "${SCRIPT_DIR}/test_schedule_api.sh"
run_suite "Scores API" "${SCRIPT_DIR}/test_scores_api.sh"
run_suite "Leaderboard API" "${SCRIPT_DIR}/test_leaderboard_api.sh"
run_suite "Move Players API" "${SCRIPT_DIR}/test_move_players_api.sh"

echo ""
echo "========================================"
echo "All API test suites passed."
echo "========================================"