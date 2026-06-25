#!/usr/bin/env bash
# Integration tests for Registration API endpoints.
# Usage: ./scripts/test_registration_api.sh [base_url]
# Requires API server running and seeded users (admin1/guest1/super1, password: secret).

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
API="${BASE_URL}/api"
COOKIE_JAR="$(mktemp)"
TEST_SLUG="reg-test-$(date +%s)"
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

logout() {
  curl -s -c "${COOKIE_JAR}" -b "${COOKIE_JAR}" \
    -X POST "${API}/auth/logout" -o /dev/null
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

echo "Registration API tests against ${API}" >&2
echo "----------------------------------------" >&2

# 1. Unauthenticated GET -> 401
logout 2>/dev/null || true
rm -f "${COOKIE_JAR}"
touch "${COOKIE_JAR}"
raw="$(request GET "/tournaments/summer-open-2026/registration")"
expect_status "GET registration without auth" "401" "${raw}"

# 2. Unauthenticated PUT -> 401
raw="$(request PUT "/tournaments/summer-open-2026/registration" '{"players":[]}')"
expect_status "PUT registration without auth" "401" "${raw}"

# 3. Guest forbidden on PUT -> 403
login guest1
raw="$(request PUT "/tournaments/summer-open-2026/registration" '{"players":["Alice"]}')"
expect_status "PUT registration as guest" "403" "${raw}"

# 4. Guest can GET existing tournament -> 200
raw="$(request GET "/tournaments/summer-open-2026/registration")"
body="$(expect_status "GET registration as guest" "200" "${raw}")"
if echo "${body}" | jq -e '.players | type == "array"' >/dev/null; then
  pass "GET response has players array"
else
  fail "GET response has players array" "array" "$(echo "${body}" | jq -r '.players | type')"
fi

# 5. GET unknown tournament -> 404
raw="$(request GET "/tournaments/does-not-exist/registration")"
expect_status "GET registration unknown tournament" "404" "${raw}"

# 6. Create temp tournament as superadmin
logout
login super1
raw="$(request POST "/tournaments" "{\"slug\":\"${TEST_SLUG}\",\"name\":\"Reg Test\",\"description\":\"\",\"status\":\"open\"}")"
expect_status "Create test tournament" "201" "${raw}"

# 7. Admin GET empty registration -> 200, players []
login admin1
raw="$(request GET "/tournaments/${TEST_SLUG}/registration")"
body="$(expect_status "GET empty registration" "200" "${raw}")"
expect_json_field "Empty registration players count" "${body}" ".players | length" "0"

# 8. Admin PUT string array (skip empty names)
raw="$(request PUT "/tournaments/${TEST_SLUG}/registration" '{"players":["Alice","Bob",""," Carol "]}')"
body="$(expect_status "PUT registration string array" "200" "${raw}")"
expect_json_field "String array player count" "${body}" ".players | length" "3"
expect_json_field "First player name" "${body}" '.players[0].player_name' "Alice"
expect_json_field "First sort_order" "${body}" '.players[0].sort_order' "0"
expect_json_field "Third player name" "${body}" '.players[2].player_name' "Carol"
expect_json_field "Third sort_order" "${body}" '.players[2].sort_order' "2"

# 9. Guest reads saved registration
login guest1
raw="$(request GET "/tournaments/${TEST_SLUG}/registration")"
body="$(expect_status "Guest reads saved registration" "200" "${raw}")"
expect_json_field "Guest sees Alice" "${body}" '.players[0].player_name' "Alice"

# 10. Admin PUT object array
login admin1
raw="$(request PUT "/tournaments/${TEST_SLUG}/registration" '{"players":[{"player_name":"Dave"},{"player_name":"Eve"}]}')"
body="$(expect_status "PUT registration object array" "200" "${raw}")"
expect_json_field "Object array replaces list" "${body}" '.players | length' "2"
expect_json_field "Object array first player" "${body}" '.players[0].player_name' "Dave"

# 11. PUT empty player_name object -> 400
raw="$(request PUT "/tournaments/${TEST_SLUG}/registration" '{"players":[{"player_name":""}]}')"
expect_status "PUT empty player_name object" "400" "${raw}"

# 12. PUT more than 30 players -> 400
players_json="$(python3 - <<'PY'
import json
print(json.dumps({"players": [f"P{i}" for i in range(31)]}))
PY
)"
raw="$(request PUT "/tournaments/${TEST_SLUG}/registration" "${players_json}")"
expect_status "PUT more than 30 players" "400" "${raw}"

# 13. PUT clears list with empty array
raw="$(request PUT "/tournaments/${TEST_SLUG}/registration" '{"players":[]}')"
body="$(expect_status "PUT clear registration" "200" "${raw}")"
expect_json_field "Cleared registration" "${body}" ".players | length" "0"

# 14. PUT unknown tournament -> 404
raw="$(request PUT "/tournaments/does-not-exist/registration" '{"players":["X"]}')"
expect_status "PUT unknown tournament" "404" "${raw}"

# 15. Cleanup test tournament
login super1
raw="$(request DELETE "/tournaments/${TEST_SLUG}")"
expect_status "Delete test tournament" "204" "${raw}"

echo "----------------------------------------" >&2
echo "Results: ${PASS} passed, ${FAIL} failed" >&2
if [[ "${FAIL}" -gt 0 ]]; then
  exit 1
fi