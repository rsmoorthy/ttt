#!/usr/bin/env bash
# Integration tests for Leaderboard API endpoints.
# Usage: ./scripts/test_leaderboard_api.sh [base_url]
# Requires API server running and seeded users (admin1/guest1/super1, password: secret).

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

patch_match() {
  local path="$1"
  local body="$2"
  local raw
  raw="$(request PATCH "${path}" "${body}")"
  expect_status "PATCH ${path}" "200" "${raw}" >/dev/null
}

patch_win_for_player() {
  local player="$1"
  local slno="$2"
  local body_favor_player1="$3"
  local body_favor_player2="$4"
  local player1 player2

  player1="$(echo "${matches_json}" | jq -r --argjson slno "${slno}" '.matches[] | select(.slno == $slno) | .player1')"
  player2="$(echo "${matches_json}" | jq -r --argjson slno "${slno}" '.matches[] | select(.slno == $slno) | .player2')"

  if [[ "${player1}" == "${player}" ]]; then
    patch_match "${MATCHES_PATH}/${slno}" "${body_favor_player1}"
  elif [[ "${player2}" == "${player}" ]]; then
    patch_match "${MATCHES_PATH}/${slno}" "${body_favor_player2}"
  else
    fail "Patch win for ${player}" "match includes player" "slno=${slno} has ${player1} vs ${player2}"
  fi
}

echo "Leaderboard API tests against ${API}" >&2
echo "----------------------------------------" >&2

TOURN_SLUG="leaderboard-${TS}"
create_tournament "${TOURN_SLUG}"
STAGE_SLUG="league-${TS}"
BOARD_PATH="/tournaments/${TOURN_SLUG}/stages/${STAGE_SLUG}/leaderboard"
MATCHES_PATH="/tournaments/${TOURN_SLUG}/stages/${STAGE_SLUG}/matches"

raw="$(request POST "/tournaments/${TOURN_SLUG}/stages" "{\"slug\":\"${STAGE_SLUG}\",\"name\":\"League\",\"stage_type\":\"league\"}")"
expect_status "Create league stage" "201" "${raw}" >/dev/null

players_json="$(jq -nc --argjson names "$(printf '%s\n' P{1..12} | jq -R . | jq -s .)" '{players: $names}')"
raw="$(request PUT "/tournaments/${TOURN_SLUG}/registration" "${players_json}")"
expect_status "Register 12 players" "200" "${raw}" >/dev/null

raw="$(request POST "/tournaments/${TOURN_SLUG}/stages/${STAGE_SLUG}/fixtures" '{"approx_total_matches":30}')"
expect_status "Create league fixtures for 12 players" "200" "${raw}" >/dev/null

# Guest can read empty leaderboard
login guest1
raw="$(request GET "${BOARD_PATH}")"
body="$(expect_status "GET leaderboard as guest (no scores)" "200" "${raw}")"
entry_count="$(echo "${body}" | jq '.entries | length')"
if [[ "${entry_count}" -ge 12 ]]; then
  pass "Leaderboard includes more than 10 players (${entry_count})"
else
  fail "Leaderboard includes more than 10 players" ">= 12" "${entry_count}"
fi

# Enter scores to create a three-way tie on wins with different NRR
login admin1
matches_raw="$(request GET "${MATCHES_PATH}")"
matches_json="$(echo "${matches_raw}" | sed '$d')"
dominant_slno="$(echo "${matches_json}" | jq -r '.matches[] | select(.player1=="P1" or .player2=="P1") | .slno' | head -n1)"
medium_slno="$(echo "${matches_json}" | jq -r '.matches[] | select(.player1=="P2" or .player2=="P2") | .slno' | head -n1)"
tight_slno="$(echo "${matches_json}" | jq -r '.matches[] | select(.player1=="P3" or .player2=="P3") | .slno' | head -n1)"

patch_win_for_player "P1" "${dominant_slno}" \
  '{"game1":"11-2","game2":"11-3","game3":"11-4"}' \
  '{"game1":"2-11","game2":"3-11","game3":"4-11"}'
patch_win_for_player "P2" "${medium_slno}" \
  '{"game1":"11-8","game2":"11-9","game3":"11-7"}' \
  '{"game1":"8-11","game2":"9-11","game3":"7-11"}'
patch_win_for_player "P3" "${tight_slno}" \
  '{"game1":"11-9","game2":"9-11","game3":"11-9","game4":"8-11","game5":"11-9"}' \
  '{"game1":"9-11","game2":"11-9","game3":"9-11","game4":"11-8","game5":"9-11"}'

login guest1
raw="$(request GET "${BOARD_PATH}")"
body="$(expect_status "GET leaderboard with scored matches" "200" "${raw}")"

leader_names="$(echo "${body}" | jq -r '[.entries[] | select(.wins == 1) | .player_name] | .[0:3] | join(",")')"
if echo "${leader_names}" | grep -q "P1" && echo "${leader_names}" | grep -q "P2" && echo "${leader_names}" | grep -q "P3"; then
  pass "Top tied-win group includes P1, P2, and P3"
else
  fail "Top tied-win group includes P1, P2, and P3" "P1,P2,P3 present" "${leader_names}"
fi

p1_rank="$(echo "${body}" | jq -r '.entries[] | select(.player_name=="P1") | .rank')"
p2_rank="$(echo "${body}" | jq -r '.entries[] | select(.player_name=="P2") | .rank')"
p3_rank="$(echo "${body}" | jq -r '.entries[] | select(.player_name=="P3") | .rank')"
p1_nrr="$(echo "${body}" | jq -r '.entries[] | select(.player_name=="P1") | .nrr')"
p2_nrr="$(echo "${body}" | jq -r '.entries[] | select(.player_name=="P2") | .nrr')"
p3_nrr="$(echo "${body}" | jq -r '.entries[] | select(.player_name=="P3") | .nrr')"

if [[ "${p1_rank}" -lt "${p2_rank}" && "${p2_rank}" -lt "${p3_rank}" ]]; then
  pass "Tied wins ordered by NRR: P1(${p1_rank}) before P2(${p2_rank}) before P3(${p3_rank})"
else
  fail "Tied wins ordered by NRR" "P1 rank < P2 rank < P3 rank" "ranks=${p1_rank},${p2_rank},${p3_rank}"
fi

if awk "BEGIN {exit !(${p1_nrr} > ${p2_nrr} && ${p2_nrr} > ${p3_nrr})}"; then
  pass "NRR decreases for tied-win players: ${p1_nrr} > ${p2_nrr} > ${p3_nrr}"
else
  fail "NRR decreases for tied-win players" "P1 > P2 > P3" "${p1_nrr}, ${p2_nrr}, ${p3_nrr}"
fi

expect_json_field "P1 has one win" "${body}" '.entries[] | select(.player_name=="P1") | .wins' "1"
expect_json_field "P2 has one win" "${body}" '.entries[] | select(.player_name=="P2") | .wins' "1"
expect_json_field "P3 has one win" "${body}" '.entries[] | select(.player_name=="P3") | .wins' "1"

# Unknown stage -> 404
raw="$(request GET "/tournaments/${TOURN_SLUG}/stages/does-not-exist/leaderboard")"
expect_status "GET leaderboard unknown stage" "404" "${raw}" >/dev/null

delete_tournament "${TOURN_SLUG}"

echo "----------------------------------------" >&2
echo "Results: ${PASS} passed, ${FAIL} failed" >&2
if [[ "${FAIL}" -gt 0 ]]; then
  exit 1
fi