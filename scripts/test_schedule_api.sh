#!/usr/bin/env bash
# Integration tests for Schedule API endpoints.
# Usage: ./scripts/test_schedule_api.sh [base_url]
# Requires API server running, schedule service on SCHEDULE_SERVICE_URL, and seeded users.

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

echo "Schedule API tests against ${API}" >&2
echo "----------------------------------------" >&2

LEAGUE_SLUG="schedule-league-${TS}"
create_tournament "${LEAGUE_SLUG}"
LEAGUE_STAGE="league-${TS}"
SCHEDULE_PATH="/tournaments/${LEAGUE_SLUG}/stages/${LEAGUE_STAGE}/schedule"

raw="$(request POST "/tournaments/${LEAGUE_SLUG}/stages" "{\"slug\":\"${LEAGUE_STAGE}\",\"name\":\"League\",\"stage_type\":\"league\"}")"
expect_status "Create league stage" "201" "${raw}" >/dev/null

# GET without fixtures -> 409
raw="$(request GET "${SCHEDULE_PATH}")"
body="$(expect_status "GET schedule without fixtures" "409" "${raw}")"
expect_json_field "GET schedule error message" "${body}" ".error" "Create fixtures before scheduling"

# POST without fixtures -> 409
raw="$(request POST "${SCHEDULE_PATH}" '{"numSlots":3,"numTables":2,"maxMatchesPerSlot":4}')"
body="$(expect_status "POST schedule without fixtures" "409" "${raw}")"
expect_json_field "POST schedule error message" "${body}" ".error" "No fixtures to schedule"

players_json='{"players":["Alice","Bob","Carol","Dave"]}'
raw="$(request PUT "/tournaments/${LEAGUE_SLUG}/registration" "${players_json}")"
expect_status "Register 4 players" "200" "${raw}" >/dev/null

raw="$(request POST "/tournaments/${LEAGUE_SLUG}/stages/${LEAGUE_STAGE}/fixtures" '{"approx_total_matches":6}')"
expect_status "Create league fixtures" "200" "${raw}" >/dev/null

# POST invalid body -> 400
raw="$(request POST "${SCHEDULE_PATH}" '{"numSlots":0,"numTables":2,"maxMatchesPerSlot":4}')"
expect_status "POST schedule invalid numSlots" "400" "${raw}" >/dev/null

# POST schedule for league -> 200
raw="$(request POST "${SCHEDULE_PATH}" '{"numSlots":3,"numTables":2,"maxMatchesPerSlot":4}')"
body="$(expect_status "POST schedule for league" "200" "${raw}")"
match_count="$(echo "${body}" | jq -r '.matches | length')"
if [[ "${match_count}" == "6" ]]; then
  pass "POST schedule returns all matches"
else
  fail "POST schedule returns all matches" "6" "${match_count}"
fi

first_hour_slot="$(echo "${body}" | jq -r '.matches[0].hour_slot')"
first_tbl="$(echo "${body}" | jq -r '.matches[0].tbl')"
if [[ "${first_hour_slot}" =~ ^[0-9]+$ && "${first_tbl}" =~ ^[0-9]+$ ]]; then
  pass "POST schedule assigns hour_slot and tbl"
else
  fail "POST schedule assigns hour_slot and tbl" "numeric values" "hour_slot=${first_hour_slot}, tbl=${first_tbl}"
fi

# GET schedule after POST -> 200 with persisted slots
raw="$(request GET "${SCHEDULE_PATH}")"
body="$(expect_status "GET schedule after POST" "200" "${raw}")"
expect_json_field "GET schedule stage_type" "${body}" ".stage_type" "league"
expect_json_field "GET schedule has_fixtures" "${body}" ".has_fixtures" "true"
expect_json_field "GET schedule match count" "${body}" ".matches | length" "6"
scheduled_count="$(echo "${body}" | jq '[.matches[] | select(.hour_slot != null and .tbl != null)] | length')"
if [[ "${scheduled_count}" == "6" ]]; then
  pass "GET schedule shows persisted slots"
else
  fail "GET schedule shows persisted slots" "6" "${scheduled_count}"
fi

# POST schedule again overwrites existing slots
raw="$(request POST "${SCHEDULE_PATH}" '{"numSlots":4,"numTables":2,"maxMatchesPerSlot":4}')"
body="$(expect_status "POST schedule overwrite" "200" "${raw}")"
expect_json_field "POST overwrite match count" "${body}" ".matches | length" "6"

# Superleague stage rejects automated scheduling -> 400
SUPER_SLUG="schedule-super-${TS}"
create_tournament "${SUPER_SLUG}"
SUPER_STAGE="qf-${TS}"
SUPER_PATH="/tournaments/${SUPER_SLUG}/stages/${SUPER_STAGE}/schedule"

raw="$(request POST "/tournaments/${SUPER_SLUG}/stages" "{\"slug\":\"${SUPER_STAGE}\",\"name\":\"QF\",\"stage_type\":\"superleague\"}")"
expect_status "Create superleague stage" "201" "${raw}" >/dev/null

super_players='{"players":["P1","P2","P3","P4","P5","P6","P7","P8"]}'
raw="$(request PUT "/tournaments/${SUPER_SLUG}/registration" "${super_players}")"
expect_status "Register 8 players for superleague" "200" "${raw}" >/dev/null

raw="$(request POST "/tournaments/${SUPER_SLUG}/stages/${SUPER_STAGE}/fixtures" '{}')"
expect_status "Create superleague fixtures" "200" "${raw}" >/dev/null

raw="$(request POST "${SUPER_PATH}" '{"numSlots":3,"numTables":2,"maxMatchesPerSlot":4}')"
body="$(expect_status "POST schedule for superleague" "400" "${raw}")"
expect_json_field "Superleague schedule error" "${body}" ".error" "Automated scheduling is only available for league stages"

delete_tournament "${LEAGUE_SLUG}"
delete_tournament "${SUPER_SLUG}"

echo "----------------------------------------" >&2
echo "Results: ${PASS} passed, ${FAIL} failed" >&2
if [[ "${FAIL}" -gt 0 ]]; then
  exit 1
fi