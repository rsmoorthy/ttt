#!/usr/bin/env bash
# Integration tests for Stage API endpoints.
# Usage: ./scripts/test_stages_api.sh [base_url]
# Requires API server running and seeded users (admin1/guest1/super1, password: secret).

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
API="${BASE_URL}/api"
COOKIE_JAR="$(mktemp)"
TS="$(date +%s)"
TEST_SLUG="stage-tourn-${TS}"
STAGE_SLUG="league-${TS}"
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

echo "Stage API tests against ${API}" >&2
echo "----------------------------------------" >&2

# Setup: create test tournament
logout 2>/dev/null || true
rm -f "${COOKIE_JAR}"
touch "${COOKIE_JAR}"
login super1
raw="$(request POST "/tournaments" "{\"slug\":\"${TEST_SLUG}\",\"name\":\"Stage Test Tournament\",\"description\":\"\",\"status\":\"open\"}")"
expect_status "Setup: create test tournament" "201" "${raw}"

STAGES_PATH="/tournaments/${TEST_SLUG}/stages"

# 1. Unauthenticated GET list -> 401
logout
rm -f "${COOKIE_JAR}"
touch "${COOKIE_JAR}"
raw="$(request GET "${STAGES_PATH}")"
expect_status "GET stages without auth" "401" "${raw}"

# 2. GET unknown tournament -> 404
login guest1
raw="$(request GET "/tournaments/does-not-exist-${TEST_SLUG}/stages")"
expect_status "GET stages unknown tournament" "404" "${raw}"

# 3. Guest lists empty stages -> 200
raw="$(request GET "${STAGES_PATH}")"
body="$(expect_status "GET stages as guest (empty)" "200" "${raw}")"
expect_json_field "Empty stages tournament" "${body}" ".tournament" "${TEST_SLUG}"
expect_json_field "Empty stages count" "${body}" ".stages | length" "0"

# 4. Guest forbidden on POST -> 403
raw="$(request POST "${STAGES_PATH}" "{\"slug\":\"${STAGE_SLUG}\",\"name\":\"League\"}")"
expect_status "POST stage as guest" "403" "${raw}"

# 5. Admin creates stage -> 201
login admin1
raw="$(request POST "${STAGES_PATH}" "{\"slug\":\"${STAGE_SLUG}\",\"name\":\"League\",\"description\":\"Round robin\",\"stage_type\":\"league\",\"is_completed\":false}")"
body="$(expect_status "POST stage as admin" "201" "${raw}")"
expect_json_field "Created stage slug" "${body}" ".slug" "${STAGE_SLUG}"
expect_json_field "Created stage name" "${body}" ".name" "League"
expect_json_field "Created stage type" "${body}" ".stage_type" "league"
expect_json_field "Created stage is_completed" "${body}" ".is_completed" "false"

# 6. Default stage_type to league when omitted -> 201
DEFAULT_SLUG="default-${TS}"
raw="$(request POST "${STAGES_PATH}" "{\"slug\":\"${DEFAULT_SLUG}\",\"name\":\"Default League\"}")"
body="$(expect_status "POST stage without stage_type" "201" "${raw}")"
expect_json_field "Default stage_type" "${body}" ".stage_type" "league"

# 7. Invalid stage_type -> 400
raw="$(request POST "${STAGES_PATH}" "{\"slug\":\"bad-type-${TS}\",\"name\":\"Bad\",\"stage_type\":\"knockout\"}")"
expect_status "POST invalid stage_type" "400" "${raw}"

# 8. Duplicate stage slug -> 409
raw="$(request POST "${STAGES_PATH}" "{\"slug\":\"${STAGE_SLUG}\",\"name\":\"Duplicate\"}")"
expect_status "POST duplicate stage slug" "409" "${raw}"

# 9. Invalid stage slug -> 400
raw="$(request POST "${STAGES_PATH}" "{\"slug\":\"Bad_Slug\",\"name\":\"Bad\"}")"
expect_status "POST invalid stage slug" "400" "${raw}"

# 10. Guest lists stages -> 200 with two stages
login guest1
raw="$(request GET "${STAGES_PATH}")"
body="$(expect_status "GET stages after create" "200" "${raw}")"
expect_json_field "Stages count after create" "${body}" ".stages | length" "2"
expect_json_field "Listed league stage slug" "${body}" ".stages[] | select(.slug==\"${STAGE_SLUG}\") | .slug" "${STAGE_SLUG}"
expect_json_field "Listed league stage_type" "${body}" ".stages[] | select(.slug==\"${STAGE_SLUG}\") | .stage_type" "league"

# 11. Guest GET single stage -> 200
raw="$(request GET "${STAGES_PATH}/${STAGE_SLUG}")"
body="$(expect_status "GET stage as guest" "200" "${raw}")"
expect_json_field "GET stage tournament" "${body}" ".tournament" "${TEST_SLUG}"
expect_json_field "GET stage slug" "${body}" ".slug" "${STAGE_SLUG}"

# 12. GET unknown stage -> 404
raw="$(request GET "${STAGES_PATH}/does-not-exist")"
expect_status "GET unknown stage" "404" "${raw}"

# 13. Guest forbidden on PUT -> 403
raw="$(request PUT "${STAGES_PATH}/${STAGE_SLUG}" '{"name":"Updated"}')"
expect_status "PUT stage as guest" "403" "${raw}"

# 14. Admin updates stage -> 200
login admin1
raw="$(request PUT "${STAGES_PATH}/${STAGE_SLUG}" '{"name":"League Updated","description":"Updated desc","stage_type":"superleague","is_completed":true}')"
body="$(expect_status "PUT stage as admin" "200" "${raw}")"
expect_json_field "Updated stage name" "${body}" ".name" "League Updated"
expect_json_field "Updated stage description" "${body}" ".description" "Updated desc"
expect_json_field "Updated stage type" "${body}" ".stage_type" "superleague"
expect_json_field "Updated stage is_completed" "${body}" ".is_completed" "true"

# 15. PUT empty body -> 400
raw="$(request PUT "${STAGES_PATH}/${STAGE_SLUG}" '{}')"
expect_status "PUT stage empty body" "400" "${raw}"

# 16. Guest forbidden on DELETE -> 403
login guest1
raw="$(request DELETE "${STAGES_PATH}/${STAGE_SLUG}")"
expect_status "DELETE stage as guest" "403" "${raw}"

# 17. Admin deletes stages -> 204
login admin1
raw="$(request DELETE "${STAGES_PATH}/${STAGE_SLUG}")"
expect_status "DELETE league stage as admin" "204" "${raw}"
raw="$(request DELETE "${STAGES_PATH}/${DEFAULT_SLUG}")"
expect_status "DELETE default stage as admin" "204" "${raw}"

# 18. GET list after delete -> empty
login guest1
raw="$(request GET "${STAGES_PATH}")"
body="$(expect_status "GET stages after delete" "200" "${raw}")"
expect_json_field "Stages empty after delete" "${body}" ".stages | length" "0"

# 19. DELETE unknown stage -> 404
login admin1
raw="$(request DELETE "${STAGES_PATH}/does-not-exist")"
expect_status "DELETE unknown stage" "404" "${raw}"

# Cleanup: delete test tournament
login super1
raw="$(request DELETE "/tournaments/${TEST_SLUG}")"
expect_status "Cleanup: delete test tournament" "204" "${raw}"

echo "----------------------------------------" >&2
echo "Results: ${PASS} passed, ${FAIL} failed" >&2
if [[ "${FAIL}" -gt 0 ]]; then
  exit 1
fi