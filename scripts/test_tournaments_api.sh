#!/usr/bin/env bash
# Integration tests for Tournament API endpoints.
# Usage: ./scripts/test_tournaments_api.sh [base_url]
# Requires API server running and seeded users (admin1/guest1/super1, password: secret).

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
API="${BASE_URL}/api"
COOKIE_JAR="$(mktemp)"
TEST_SLUG="tourn-test-$(date +%s)"
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

echo "Tournament API tests against ${API}" >&2
echo "----------------------------------------" >&2

# 1. Unauthenticated GET list -> 401
logout 2>/dev/null || true
rm -f "${COOKIE_JAR}"
touch "${COOKIE_JAR}"
raw="$(request GET "/tournaments")"
expect_status "GET tournaments without auth" "401" "${raw}"

# 2. Unauthenticated POST -> 401
raw="$(request POST "/tournaments" "{\"slug\":\"${TEST_SLUG}\",\"name\":\"Test\"}")"
expect_status "POST tournament without auth" "401" "${raw}"

# 3. Guest can list tournaments -> 200
login guest1
raw="$(request GET "/tournaments")"
body="$(expect_status "GET tournaments as guest" "200" "${raw}")"
if echo "${body}" | jq -e '.tournaments | type == "array"' >/dev/null; then
  pass "GET response has tournaments array"
else
  fail "GET response has tournaments array" "array" "$(echo "${body}" | jq -r '.tournaments | type')"
fi

# 4. Guest forbidden on POST -> 403
raw="$(request POST "/tournaments" "{\"slug\":\"${TEST_SLUG}\",\"name\":\"Test\"}")"
expect_status "POST tournament as guest" "403" "${raw}"

# 5. Admin forbidden on POST -> 403
login admin1
raw="$(request POST "/tournaments" "{\"slug\":\"${TEST_SLUG}\",\"name\":\"Test\"}")"
expect_status "POST tournament as admin" "403" "${raw}"

# 6. Superadmin creates tournament -> 201
login super1
raw="$(request POST "/tournaments" "{\"slug\":\"${TEST_SLUG}\",\"name\":\"Tournament Test\",\"description\":\"desc\",\"status\":\"open\"}")"
body="$(expect_status "POST tournament as superadmin" "201" "${raw}")"
expect_json_field "Created slug" "${body}" ".slug" "${TEST_SLUG}"
expect_json_field "Created name" "${body}" ".name" "Tournament Test"
expect_json_field "Created status" "${body}" ".status" "open"

# 7. Duplicate slug -> 409
raw="$(request POST "/tournaments" "{\"slug\":\"${TEST_SLUG}\",\"name\":\"Duplicate\"}")"
expect_status "POST duplicate tournament slug" "409" "${raw}"

# 8. Invalid slug -> 400
raw="$(request POST "/tournaments" "{\"slug\":\"Invalid_Slug\",\"name\":\"Bad\"}")"
expect_status "POST invalid tournament slug" "400" "${raw}"

# 9. Guest GET single tournament -> 200
login guest1
raw="$(request GET "/tournaments/${TEST_SLUG}")"
body="$(expect_status "GET tournament as guest" "200" "${raw}")"
expect_json_field "GET tournament slug" "${body}" ".slug" "${TEST_SLUG}"

# 10. GET unknown tournament -> 404
raw="$(request GET "/tournaments/does-not-exist-${TEST_SLUG}")"
expect_status "GET unknown tournament" "404" "${raw}"

# 11. Guest forbidden on PUT -> 403
raw="$(request PUT "/tournaments/${TEST_SLUG}" '{"name":"Updated"}')"
expect_status "PUT tournament as guest" "403" "${raw}"

# 12. Superadmin updates tournament -> 200
login super1
raw="$(request PUT "/tournaments/${TEST_SLUG}" '{"name":"Tournament Updated","status":"closed"}')"
body="$(expect_status "PUT tournament as superadmin" "200" "${raw}")"
expect_json_field "Updated name" "${body}" ".name" "Tournament Updated"
expect_json_field "Updated status" "${body}" ".status" "closed"

# 13. PUT empty body -> 400
raw="$(request PUT "/tournaments/${TEST_SLUG}" '{}')"
expect_status "PUT tournament empty body" "400" "${raw}"

# 14. PUT unknown tournament -> 404
raw="$(request PUT "/tournaments/does-not-exist-${TEST_SLUG}" '{"name":"X"}')"
expect_status "PUT unknown tournament" "404" "${raw}"

# 15. Guest forbidden on DELETE -> 403
login guest1
raw="$(request DELETE "/tournaments/${TEST_SLUG}")"
expect_status "DELETE tournament as guest" "403" "${raw}"

# 16. Superadmin deletes tournament -> 204
login super1
raw="$(request DELETE "/tournaments/${TEST_SLUG}")"
expect_status "DELETE tournament as superadmin" "204" "${raw}"

# 17. DELETE unknown tournament -> 404
raw="$(request DELETE "/tournaments/${TEST_SLUG}")"
expect_status "DELETE unknown tournament" "404" "${raw}"

# 18. GET after delete -> 404
login guest1
raw="$(request GET "/tournaments/${TEST_SLUG}")"
expect_status "GET tournament after delete" "404" "${raw}"

echo "----------------------------------------" >&2
echo "Results: ${PASS} passed, ${FAIL} failed" >&2
if [[ "${FAIL}" -gt 0 ]]; then
  exit 1
fi