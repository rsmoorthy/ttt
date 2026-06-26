#!/usr/bin/env bash
# Integration tests for Scores (matches) API endpoints.
# Usage: ./scripts/test_scores_api.sh [base_url]
# Requires API server running and seeded users (admin1/scorer1/guest1/super1, password: secret).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DB_PATH="${DB_PATH:-${PROJECT_ROOT}/data/ttt.db}"
BASE_URL="${1:-http://localhost:3000}"
API="${BASE_URL}/api"
COOKIE_JAR="$(mktemp)"
TS="$(date +%s)"
PASS=0
FAIL=0

cleanup() {
  rm -f "${COOKIE_JAR}"
}
trap cleanup EXIT

pass() {
  echo "PASS: $1" >&2
  PASS=$((PASS + 1))
}

fail() {
  echo "FAIL: $1" >&2
  echo "  expected: $2" >&2
  echo "  got:      $3" >&2
  FAIL=$((FAIL + 1))
}

login() {
  local user="$1"
  curl -s -c "${COOKIE_JAR}" -b "${COOKIE_JAR}" \
    -X POST "${API}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${user}\",\"password\":\"secret\"}" \
    -o /dev/null
}

request() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  if [[ -n "${body}" ]]; then
    curl -s -w "\n%{http_code}" -b "${COOKIE_JAR}" \
      -X "${method}" "${API}${path}" \
      -H "Content-Type: application/json" \
      -d "${body}"
  else
    curl -s -w "\n%{http_code}" -b "${COOKIE_JAR}" \
      -X "${method}" "${API}${path}"
  fi
}

expect_status() {
  local name="$1"
  local expected="$2"
  local raw="$3"
  local body status
  body="$(echo "${raw}" | sed '$d')"
  status="$(echo "${raw}" | tail -n1)"
  if [[ "${status}" == "${expected}" ]]; then
    pass "${name} (${status})"
  else
    fail "${name}" "HTTP ${expected}" "HTTP ${status} body=${body}"
  fi
  echo "${body}"
}

expect_json_field() {
  local name="$1"
  local json="$2"
  local jq_expr="$3"
  local expected="$4"
  local actual
  actual="$(echo "${json}" | jq -r "${jq_expr}")"
  if [[ "${actual}" == "${expected}" ]]; then
    pass "${name}"
  else
    fail "${name}" "${expected}" "${actual}"
  fi
}

create_tournament() {
  local slug="$1"
  login super1
  local raw
  raw="$(request POST "/tournaments" "{\"slug\":\"${slug}\",\"name\":\"${slug}\",\"description\":\"\",\"status\":\"open\"}")"
  expect_status "Create tournament ${slug}" "201" "${raw}" >/dev/null
  login admin1
}

delete_tournament() {
  local slug="$1"
  login super1
  local raw
  raw="$(request DELETE "/tournaments/${slug}")"
  expect_status "Delete tournament ${slug}" "204" "${raw}" >/dev/null
}

if ! sqlite3 "${DB_PATH}" "SELECT 1 FROM users WHERE username='scorer1';" | grep -q 1; then
  scorer_hash="$(sqlite3 "${DB_PATH}" "SELECT password FROM users WHERE username='admin1' LIMIT 1;")"
  sqlite3 "${DB_PATH}" \
    "INSERT INTO users (username, password, role) VALUES ('scorer1', '${scorer_hash}', 'scorer');"
  echo "Seeded scorer1 test user" >&2
fi

echo "Scores API tests against ${API}" >&2
echo "----------------------------------------" >&2

TOURN_SLUG="scores-${TS}"
create_tournament "${TOURN_SLUG}"
STAGE_SLUG="league-${TS}"
MATCHES_PATH="/tournaments/${TOURN_SLUG}/stages/${STAGE_SLUG}/matches"

raw="$(request POST "/tournaments/${TOURN_SLUG}/stages" "{\"slug\":\"${STAGE_SLUG}\",\"name\":\"League\",\"stage_type\":\"league\"}")"
expect_status "Create league stage" "201" "${raw}" >/dev/null

players_json='{"players":["Alice","Bob","Carol","Dave"]}'
raw="$(request PUT "/tournaments/${TOURN_SLUG}/registration" "${players_json}")"
expect_status "Register players" "200" "${raw}" >/dev/null

raw="$(request POST "/tournaments/${TOURN_SLUG}/stages/${STAGE_SLUG}/fixtures" '{"approx_total_matches":6}')"
expect_status "Create fixtures" "200" "${raw}" >/dev/null

# Guest can list matches
login guest1
raw="$(request GET "${MATCHES_PATH}")"
body="$(expect_status "GET matches as guest" "200" "${raw}")"
expect_json_field "Guest sees matches" "${body}" ".matches | length" "6"

# Guest cannot edit scores
raw="$(request PATCH "${MATCHES_PATH}/1" '{"game1":"11-7"}')"
expect_status "PATCH match as guest forbidden" "403" "${raw}" >/dev/null

# Guest cannot mark match complete
raw="$(request POST "${MATCHES_PATH}/1/complete")"
expect_status "POST complete as guest forbidden" "403" "${raw}" >/dev/null

# Scorer can update scores
login scorer1
raw="$(request PATCH "${MATCHES_PATH}/1" '{"game1":"11-7","game2":"9-11","game3":"11-8"}')"
body="$(expect_status "PATCH match as scorer" "200" "${raw}")"
expect_json_field "Scorer updated game1" "${body}" ".game1" "11-7"
expect_json_field "Scorer updated game3" "${body}" ".game3" "11-8"

# Invalid score format -> 400
raw="$(request PATCH "${MATCHES_PATH}/2" '{"game1":"11x7"}')"
expect_status "PATCH invalid score format" "400" "${raw}" >/dev/null

# Scorer can complete match
raw="$(request POST "${MATCHES_PATH}/1/complete")"
body="$(expect_status "POST complete as scorer" "200" "${raw}")"
expect_json_field "Match marked complete" "${body}" ".is_completed" "true"

# Scorer cannot edit completed match
raw="$(request PATCH "${MATCHES_PATH}/1" '{"game4":"11-5"}')"
expect_status "PATCH completed match as scorer forbidden" "403" "${raw}" >/dev/null

# Admin can still edit completed match
login admin1
raw="$(request PATCH "${MATCHES_PATH}/1" '{"game4":"11-5"}')"
body="$(expect_status "PATCH completed match as admin" "200" "${raw}")"
expect_json_field "Admin updated completed match" "${body}" ".game4" "11-5"

# Walkover on another match
raw="$(request PATCH "${MATCHES_PATH}/2" '{"walkover_win":"Carol"}')"
body="$(expect_status "PATCH walkover as admin" "200" "${raw}")"
expect_json_field "Walkover saved" "${body}" ".walkover_win" "Carol"

# Complete walkover match
login scorer1
raw="$(request POST "${MATCHES_PATH}/2/complete")"
expect_status "POST complete walkover match" "200" "${raw}" >/dev/null

# Cannot complete without scores
raw="$(request POST "${MATCHES_PATH}/3/complete")"
expect_status "POST complete without scores" "400" "${raw}" >/dev/null

# Filter matches by player
login guest1
raw="$(request GET "${MATCHES_PATH}?player=Alice")"
body="$(expect_status "GET matches filtered by player" "200" "${raw}")"
filtered_count="$(echo "${body}" | jq '[.matches[] | select(.player1=="Alice" or .player2=="Alice")] | length')"
listed_count="$(echo "${body}" | jq '.matches | length')"
if [[ "${filtered_count}" == "${listed_count}" && "${listed_count}" -ge 1 ]]; then
  pass "Player filter returns only Alice matches"
else
  fail "Player filter returns only Alice matches" "all rows include Alice" "count=${listed_count}"
fi

delete_tournament "${TOURN_SLUG}"

echo "----------------------------------------" >&2
echo "Results: ${PASS} passed, ${FAIL} failed" >&2
if [[ "${FAIL}" -gt 0 ]]; then
  exit 1
fi