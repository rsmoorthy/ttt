#!/usr/bin/env bash
# Integration tests for Move Players API endpoints.
# Usage: ./scripts/test_move_players_api.sh [base_url]
# Requires API server running and seeded users (admin1/guest1/super1, password: secret).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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

echo "Move Players API tests against ${API}" >&2
echo "----------------------------------------" >&2

TOURN_SLUG="move-players-${TS}"
create_tournament "${TOURN_SLUG}"
LEAGUE_STAGE="league-${TS}"
QF_STAGE="qf-${TS}"
MOVE_PATH="/tournaments/${TOURN_SLUG}/stages/${LEAGUE_STAGE}/move-players"

raw="$(request POST "/tournaments/${TOURN_SLUG}/stages" "{\"slug\":\"${LEAGUE_STAGE}\",\"name\":\"League\",\"stage_type\":\"league\"}")"
expect_status "Create league stage" "201" "${raw}" >/dev/null
raw="$(request POST "/tournaments/${TOURN_SLUG}/stages" "{\"slug\":\"${QF_STAGE}\",\"name\":\"QF\",\"stage_type\":\"superleague\"}")"
expect_status "Create superleague stage" "201" "${raw}" >/dev/null

# Guest forbidden
login guest1
raw="$(request POST "${MOVE_PATH}" '{"target_stage":"'"${QF_STAGE}"'","players":["P1"]}')"
expect_status "POST move-players as guest" "403" "${raw}" >/dev/null

# Missing players -> 400
login admin1
raw="$(request POST "${MOVE_PATH}" '{"target_stage":"'"${QF_STAGE}"'","players":[]}')"
expect_status "POST move-players empty players" "400" "${raw}" >/dev/null

# Same source and target -> 409
raw="$(request POST "${MOVE_PATH}" '{"target_stage":"'"${LEAGUE_STAGE}"'","players":["P1"]}')"
body="$(expect_status "POST move-players same stage" "409" "${raw}")"
expect_json_field "Same stage error" "${body}" ".error" "target_stage must differ from source stage"

# Unknown target -> 404
raw="$(request POST "${MOVE_PATH}" '{"target_stage":"missing-stage","players":["P1"]}')"
expect_status "POST move-players unknown target" "404" "${raw}" >/dev/null

# Move eight players in rank order
move_payload="$(jq -nc --arg target "${QF_STAGE}" \
  '{target_stage: $target, players: ["P1","P2","P3","P4","P5","P6","P7","P8"]}')"
raw="$(request POST "${MOVE_PATH}" "${move_payload}")"
body="$(expect_status "POST move-players as admin" "200" "${raw}")"
expect_json_field "Move source stage" "${body}" ".source_stage" "${LEAGUE_STAGE}"
expect_json_field "Move target stage" "${body}" ".target_stage" "${QF_STAGE}"
expect_json_field "Moved player count" "${body}" ".players | length" "8"
expect_json_field "First moved player" "${body}" '.players[0].player_name' "P1"
expect_json_field "First moved sort_order" "${body}" '.players[0].sort_order' "0"
expect_json_field "Eighth moved player" "${body}" '.players[7].player_name' "P8"

# Target stage players endpoint uses moved list
raw="$(request GET "/tournaments/${TOURN_SLUG}/stages/${QF_STAGE}/players")"
body="$(expect_status "GET target stage players after move" "200" "${raw}")"
expect_json_field "Target player source" "${body}" ".source" "stages_players"
expect_json_field "Target player count" "${body}" ".players | length" "8"
expect_json_field "Target preserves rank order" "${body}" '.players[2].player_name' "P3"

# Superleague fixtures from moved players
raw="$(request POST "/tournaments/${TOURN_SLUG}/stages/${QF_STAGE}/fixtures" '{}')"
body="$(expect_status "POST superleague fixtures from moved players" "200" "${raw}")"
expect_json_field "Superleague total_matches" "${body}" ".total_matches" "12"
expect_json_field "Superleague matches_per_player" "${body}" ".matches_per_player" "3"
expect_json_field "Superleague group A rank 1" "${body}" '.groups.A[0]' "P1"
expect_json_field "Superleague group A rank 3" "${body}" '.groups.A[1]' "P3"
expect_json_field "Superleague group B rank 2" "${body}" '.groups.B[0]' "P2"
expect_json_field "Superleague group B rank 4" "${body}" '.groups.B[1]' "P4"

# Replacing moved players updates target list
raw="$(request POST "${MOVE_PATH}" '{"target_stage":"'"${QF_STAGE}"'","players":["Top1","Top2"]}')"
body="$(expect_status "POST move-players overwrite" "200" "${raw}")"
expect_json_field "Overwrite player count" "${body}" ".players | length" "2"
expect_json_field "Overwrite first player" "${body}" '.players[0].player_name' "Top1"

raw="$(request POST "/tournaments/${TOURN_SLUG}/stages/${QF_STAGE}/fixtures" '{}')"
expect_status "POST superleague fixtures with 2 moved players fails" "400" "${raw}" >/dev/null

delete_tournament "${TOURN_SLUG}"

echo "----------------------------------------" >&2
echo "Results: ${PASS} passed, ${FAIL} failed" >&2
if [[ "${FAIL}" -gt 0 ]]; then
  exit 1
fi