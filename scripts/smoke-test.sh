#!/usr/bin/env bash
# scripts/smoke-test.sh — Basic API smoke tests
set -euo pipefail

API_URL="${API_URL:-http://localhost:3000/api/v1}"
PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}  PASS${NC}  $*"; PASS=$((PASS + 1)); }
fail() { echo -e "${RED}  FAIL${NC}  $*"; FAIL=$((FAIL + 1)); }

require_jq() {
  if ! command -v jq &>/dev/null; then
    echo "jq not found — install it for richer output (brew install jq / apt-get install jq)"
  fi
}

check_status() {
  local label="$1" url="$2" expected_status="$3"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" = "$expected_status" ]; then
    ok "$label → HTTP $status"
  else
    fail "$label → expected HTTP $expected_status, got $status  ($url)"
  fi
}

echo ""
echo "=== MTHURA API smoke tests ==="
echo "    Target: $API_URL"
echo ""

require_jq

# ── Health ────────────────────────────────────────────────────────────────────
check_status "GET /health" "$API_URL/health" 200

# ── Auth: send-otp ───────────────────────────────────────────────────────────
SEND_OTP_BODY='{"phone":"+27600000001"}'
SEND_OTP_STATUS=$(curl -s -o /tmp/send_otp_resp.json -w "%{http_code}" \
  -X POST "$API_URL/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d "$SEND_OTP_BODY")

if [ "$SEND_OTP_STATUS" = "201" ] || [ "$SEND_OTP_STATUS" = "200" ]; then
  ok "POST /auth/send-otp → HTTP $SEND_OTP_STATUS"
else
  fail "POST /auth/send-otp → expected 200/201, got $SEND_OTP_STATUS"
fi

# ── Auth: verify-otp (dev OTP = 123456) ──────────────────────────────────────
VERIFY_OTP_BODY='{"phone":"+27600000001","otp":"123456"}'
VERIFY_RESP=$(curl -s -o /tmp/verify_otp_resp.json -w "%{http_code}" \
  -X POST "$API_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "$VERIFY_OTP_BODY")

if [ "$VERIFY_RESP" = "201" ] || [ "$VERIFY_RESP" = "200" ]; then
  ok "POST /auth/verify-otp → HTTP $VERIFY_RESP"
  # Extract token if jq available
  if command -v jq &>/dev/null; then
    TOKEN=$(jq -r '.token // .accessToken // .access_token // empty' /tmp/verify_otp_resp.json 2>/dev/null || true)
  fi
else
  fail "POST /auth/verify-otp → expected 200/201, got $VERIFY_RESP"
  TOKEN=""
fi

# ── Vendors list (public) ─────────────────────────────────────────────────────
check_status "GET /vendors" "$API_URL/vendors" 200

# ── Authenticated endpoint (if token obtained) ───────────────────────────────
if [ -n "${TOKEN:-}" ]; then
  AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$API_URL/auth/me")
  if [ "$AUTH_STATUS" = "200" ]; then
    ok "GET /auth/me (authenticated) → HTTP $AUTH_STATUS"
  else
    fail "GET /auth/me (authenticated) → expected 200, got $AUTH_STATUS"
  fi
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
