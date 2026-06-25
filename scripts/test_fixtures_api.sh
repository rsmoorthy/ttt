#!/usr/bin/env bash
# Integration tests for Fixtures API endpoints.
# Usage: ./scripts/test_fixtures_api.sh [base_url]
# Requires API server running and seeded users (admin1, password: secret).

set -euo pipefail

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

echo "Fixtures API tests against ${API}" >&2
echo "----------------------------------------" >&2

# --- League fixtures (17 players from registration) ---
LEAGUE_SLUG="fixtures-league-${TS}"
create_tournament "${LEAGUE_SLUG}"
STAGE_SLUG="league-${TS}"

raw="$(request POST "/tournaments/${LEAGUE_SLUG}/stages" "{\"slug\":\"${STAGE_SLUG}\",\"name\":\"League\",\"stage_type\":\"league\"}")"
expect_status "Create league stage" "201" "${raw}" >/dev/null

players_json='{"players":["Alice","Bob","Carol","Dave","Eve","Frank","Grace","Henry","Ivy","Jack","Kate","Leo","Mia","Noah","Olivia","Paul","Quinn"]}'
raw="$(request PUT "/tournaments/${LEAGUE_SLUG}/registration" "${players_json}")"
expect_status "Register 17 players" "200" "${raw}" >/dev/null

raw="$(request GET "/tournaments/${LEAGUE_SLUG}/stages/${STAGE_SLUG}/fixtures")"
body="$(expect_status "GET league fixtures (empty)" "200" "${raw}")"
expect_json_field "GET league stage_type" "${body}" ".stage_type" "league"
expect_json_field "GET league has_fixtures false" "${body}" ".has_fixtures" "false"

raw="$(request POST "/tournaments/${LEAGUE_SLUG}/stages/${STAGE_SLUG}/fixtures" '{"approx_total_matches":70}')"
body="$(expect_status "POST league fixtures" "200" "${raw}")"
league_total="$(echo "${body}" | jq -r '.total_matches')"
league_per="$(echo "${body}" | jq -r '.matches_per_player')"
league_count="$(echo "${body}" | jq -r '.matches | length')"
if [[ "${league_total}" == "${league_count}" && "${league_per}" -ge 7 && "${league_total}" -ge 64 && "${league_total}" -le 70 ]]; then
  pass "League fixtures near target (total=${league_total}, per=${league_per})"
else
  fail "League fixtures near target" "total 64-70, per>=7" "total=${league_total}, per=${league_per}, count=${league_count}"
fi

raw="$(request POST "/tournaments/${LEAGUE_SLUG}/stages/${STAGE_SLUG}/fixtures" '{}')"
expect_status "POST league without target" "400" "${raw}" >/dev/null

delete_tournament "${LEAGUE_SLUG}"

# --- Superleague fixtures (8 registered players) ---
SUPER_SLUG="fixtures-super-${TS}"
create_tournament "${SUPER_SLUG}"
QF_STAGE="qf-${TS}"

raw="$(request POST "/tournaments/${SUPER_SLUG}/stages" "{\"slug\":\"${QF_STAGE}\",\"name\":\"QF\",\"stage_type\":\"superleague\"}")"
expect_status "Create superleague stage" "201" "${raw}" >/dev/null

super_players='{"players":["P1","P2","P3","P4","P5","P6","P7","P8"]}'
raw="$(request PUT "/tournaments/${SUPER_SLUG}/registration" "${super_players}")"
expect_status "Register 8 players for superleague" "200" "${raw}" >/dev/null

raw="$(request POST "/tournaments/${SUPER_SLUG}/stages/${QF_STAGE}/fixtures" '{}')"
body="$(expect_status "POST superleague fixtures" "200" "${raw}")"
expect_json_field "Superleague total_matches" "${body}" ".total_matches" "12"
expect_json_field "Superleague matches_per_player" "${body}" ".matches_per_player" "3"
expect_json_field "Superleague group A first" "${body}" '.groups.A[0]' "P1"
expect_json_field "Superleague group B first" "${body}" '.groups.B[0]' "P2"

raw="$(request PUT "/tournaments/${SUPER_SLUG}/registration" '{"players":["Only","Two"]}')"
expect_status "Register 2 players for superleague" "200" "${raw}" >/dev/null
raw="$(request POST "/tournaments/${SUPER_SLUG}/stages/${QF_STAGE}/fixtures" '{}')"
expect_status "POST superleague with 2 players" "400" "${raw}" >/dev/null

delete_tournament "${SUPER_SLUG}"

# --- Playoff SF (4 registered players) ---
SF_SLUG="fixtures-sf-${TS}"
create_tournament "${SF_SLUG}"
SF_STAGE="sf-${TS}"

raw="$(request POST "/tournaments/${SF_SLUG}/stages" "{\"slug\":\"${SF_STAGE}\",\"name\":\"SF\",\"stage_type\":\"playoff\"}")"
expect_status "Create SF stage" "201" "${raw}" >/dev/null

sf_players='{"players":["A1","A2","B1","B2"]}'
raw="$(request PUT "/tournaments/${SF_SLUG}/registration" "${sf_players}")"
expect_status "Register 4 players for SF" "200" "${raw}" >/dev/null

raw="$(request POST "/tournaments/${SF_SLUG}/stages/${SF_STAGE}/fixtures" '{}')"
body="$(expect_status "POST SF fixtures" "200" "${raw}")"
expect_json_field "SF total_matches" "${body}" ".total_matches" "2"
expect_json_field "SF match 1 player1" "${body}" '.matches[0].player1' "A1"
expect_json_field "SF match 1 player2" "${body}" '.matches[0].player2' "B2"

delete_tournament "${SF_SLUG}"

# --- Playoff Final (2 registered players) ---
FINAL_SLUG="fixtures-final-${TS}"
create_tournament "${FINAL_SLUG}"
FINAL_STAGE="final-${TS}"

raw="$(request POST "/tournaments/${FINAL_SLUG}/stages" "{\"slug\":\"${FINAL_STAGE}\",\"name\":\"Final\",\"stage_type\":\"playoff\"}")"
expect_status "Create final stage" "201" "${raw}" >/dev/null

final_players='{"players":["Winner1","Winner2"]}'
raw="$(request PUT "/tournaments/${FINAL_SLUG}/registration" "${final_players}")"
expect_status "Register 2 players for final" "200" "${raw}" >/dev/null

raw="$(request POST "/tournaments/${FINAL_SLUG}/stages/${FINAL_STAGE}/fixtures" '{}')"
body="$(expect_status "POST final fixtures" "200" "${raw}")"
expect_json_field "Final total_matches" "${body}" ".total_matches" "1"
expect_json_field "Final player1" "${body}" '.matches[0].player1' "Winner1"
expect_json_field "Final player2" "${body}" '.matches[0].player2' "Winner2"

delete_tournament "${FINAL_SLUG}"

echo "----------------------------------------" >&2
echo "Results: ${PASS} passed, ${FAIL} failed" >&2
if [[ "${FAIL}" -gt 0 ]]; then
  exit 1
fi