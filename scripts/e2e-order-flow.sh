#!/usr/bin/env bash
# Full marketplace loop for MTHURA (Built for the Township Economy).
# Launch payment model: customer pays the vendor via EFT and uploads proof; the
# merchant verifies before the kitchen starts; a 4-digit delivery PIN is generated
# and the driver confirms it on delivery. MTHURA does not process food payments.
#
# Financial Ops Blueprint v1:
#   - Merchant subscription: R350/month (after 30-day trial)
#   - Driver subscription:   R100/month (after 30-day trial)
#   - Grace period: 7 days after expiry
#   - Model A: customer pays food + delivery in one EFT to merchant
#
#   customer order → EFT proof (one-time, blocked on re-upload) → vendor verify
#   → accept/preparing/ready → driver claim/pickup/en-route/arrived/deliver (PIN)
#   → merchant subscription (R350) → driver subscription (R100)
set -euo pipefail

API_URL="${API_URL:-http://localhost:3000/api/v1}"
PYTHON="${PYTHON:-python3}"

echo "=== MTHURA E2E order flow ==="
echo "    Target: $API_URL"
echo "    Financial Ops Blueprint v1: R350 merchant, R100 driver, Model A EFT"
echo "    MTHURA does not process food payments."
echo ""

curl -sf "$API_URL/health" >/dev/null

VENDOR_ID=$(curl -sf "$API_URL/vendors?lat=-25.65&lng=27.24&radiusKm=20" | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")
ITEM_ID=$(curl -sf "$API_URL/vendors/$VENDOR_ID" | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['data']['menuItems'][0]['id'])")

curl -sf -X POST "$API_URL/auth/send-otp" -H 'Content-Type: application/json' -d '{"phone":"+27761234567"}' >/dev/null
CUSTOMER_TOKEN=$(curl -sf -X POST "$API_URL/auth/verify-otp" -H 'Content-Type: application/json' -d '{"phone":"+27761234567","otp":"123456"}' | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['token'])")

ORDER_RESP=$(curl -sf -X POST "$API_URL/orders" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"vendorId\":\"$VENDOR_ID\",\"items\":[{\"menuItemId\":\"$ITEM_ID\",\"quantity\":1}],\"deliveryAddress\":\"123 Zuma Street\",\"paymentMethod\":\"eft\"}" \
  | "$PYTHON" -c "import sys,json; d=json.load(sys.stdin)['data']; print(d['id'], d.get('eftReference','NO_REF'))")
ORDER_ID=$(echo "$ORDER_RESP" | cut -d' ' -f1)
EFT_REF=$(echo "$ORDER_RESP" | cut -d' ' -f2)
echo "Created order $ORDER_ID (eftReference=$EFT_REF)"

# Assert eftReference is set and looks like MTHURA-XXXXXXXX
test "$EFT_REF" != "NO_REF" || { echo "FAIL: eftReference not set on order create"; exit 1; }
echo "$EFT_REF" | grep -qE '^MTHURA-[A-Z0-9]{8}$' || { echo "FAIL: eftReference format unexpected: $EFT_REF"; exit 1; }
echo "Assert: eftReference format MTHURA-XXXXXXXX ✓"

# Customer uploads EFT proof of payment (first time — must succeed)
PROOF_STATUS=$(curl -sf -X POST "$API_URL/orders/$ORDER_ID/eft-proof" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"proofUrl":"https://example.com/proof/e2e.jpg"}' \
  | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['data']['paymentStatus'])")
echo "Customer uploaded EFT proof → $PROOF_STATUS"
test "$PROOF_STATUS" = "proof_submitted"

# Assert second EFT proof upload is rejected with 400 (Financial Ops Blueprint §Fraud Prevention)
SECOND_UPLOAD_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X POST "$API_URL/orders/$ORDER_ID/eft-proof" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"proofUrl":"https://example.com/proof/duplicate.jpg"}' || true)
test "$SECOND_UPLOAD_STATUS" = "400" || { echo "FAIL: second eft-proof upload should return 400 but got $SECOND_UPLOAD_STATUS"; exit 1; }
echo "Assert: second eft-proof upload blocked (400) ✓"

VENDOR_TOKEN=$(curl -sf -X POST "$API_URL/auth/login" -H 'Content-Type: application/json' \
  -d '{"phoneOrEmail":"+27831234567","password":"Vendor123!"}' \
  | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Vendor verifies EFT payment → status becomes 'verified' (Payment Confirmed) → generates delivery PIN
VERIFY=$(curl -sf -X POST "$API_URL/orders/$ORDER_ID/verify-eft" -H "Authorization: Bearer $VENDOR_TOKEN" \
  | "$PYTHON" -c "import sys,json; d=json.load(sys.stdin)['data']; print(d['paymentStatus'], d['deliveryPin'])")
PAY_STATUS=$(echo "$VERIFY" | cut -d' ' -f1)
DELIVERY_PIN=$(echo "$VERIFY" | cut -d' ' -f2)
echo "Vendor verify-eft → $PAY_STATUS (delivery PIN $DELIVERY_PIN)"
test "$PAY_STATUS" = "verified"

for action in accept preparing ready; do
  STATUS=$(curl -sf -X POST "$API_URL/orders/$ORDER_ID/$action" -H "Authorization: Bearer $VENDOR_TOKEN" \
    | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['data']['status'])")
  echo "Vendor $action → $STATUS"
done

DRIVER_TOKEN=$(curl -sf -X POST "$API_URL/auth/login" -H 'Content-Type: application/json' \
  -d '{"phoneOrEmail":"+27851234567","password":"Driver123!"}' \
  | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -sf -X PATCH "$API_URL/deliveries/driver/status" \
  -H "Authorization: Bearer $DRIVER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"isOnline":true,"latitude":-25.67,"longitude":27.24}' >/dev/null

DELIVERY_ID=$(curl -sf -X POST "$API_URL/deliveries/$ORDER_ID/claim" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

for action in pickup en-route arrived; do
  STATUS=$(curl -sf -X POST "$API_URL/deliveries/$DELIVERY_ID/$action" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['data']['status'])")
  echo "Driver $action → $STATUS"
done

# Driver completes delivery with the customer's PIN
DELIVER_STATUS=$(curl -sf -X POST "$API_URL/deliveries/$DELIVERY_ID/deliver" \
  -H "Authorization: Bearer $DRIVER_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"pin\":\"$DELIVERY_PIN\"}" \
  | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['data']['status'])")
echo "Driver deliver (PIN $DELIVERY_PIN) → $DELIVER_STATUS"

FINAL=$("$PYTHON" - <<PY
import json,urllib.request
req=urllib.request.Request("$API_URL/orders/$ORDER_ID", headers={"Authorization":"Bearer $CUSTOMER_TOKEN"})
d=json.load(urllib.request.urlopen(req))["data"]
print(d["status"], d["paymentStatus"])
PY
)
echo "Final order: $FINAL"
# payment_status is 'verified' (Payment Confirmed) — MTHURA stores EFT verification only, no funds processed
test "$FINAL" = "delivered verified"

curl -sf -X POST "$API_URL/reviews" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"orderId\":\"$ORDER_ID\",\"vendorRating\":5,\"driverRating\":5,\"comment\":\"E2E ok\"}" >/dev/null

echo ""
echo "=== E2E order flow PASSED ==="
echo ""

# ─── Merchant subscription sandbox checkout (R350) ────────────────────────────
echo "=== Merchant subscription checkout (sandbox) — R350 ==="
CHECKOUT=$(curl -sf -X POST "$API_URL/subscriptions/checkout" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  | "$PYTHON" -c "import sys,json; d=json.load(sys.stdin)['data']; print(d['reference'], d['amount'])")
SUB_REF=$(echo "$CHECKOUT" | cut -d' ' -f1)
SUB_AMOUNT=$(echo "$CHECKOUT" | cut -d' ' -f2)
echo "Merchant checkout: reference=$SUB_REF amount=R$SUB_AMOUNT"
test "$SUB_AMOUNT" = "350" || { echo "FAIL: expected merchant subscription R350, got R$SUB_AMOUNT"; exit 1; }
echo "Assert: merchant subscription amount = R350 ✓"

CONFIRM=$(curl -sf -X POST "$API_URL/subscriptions/mock-checkout/$SUB_REF/confirm" \
  | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['message'])")
echo "Merchant confirm: $CONFIRM"

# ─── Driver subscription sandbox checkout (R100) ─────────────────────────────
echo "=== Driver subscription checkout (sandbox) — R100 ==="
DCHECKOUT=$(curl -sf -X POST "$API_URL/subscriptions/driver/checkout" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  | "$PYTHON" -c "import sys,json; d=json.load(sys.stdin)['data']; print(d['reference'], d['amount'])")
DSUB_REF=$(echo "$DCHECKOUT" | cut -d' ' -f1)
DSUB_AMOUNT=$(echo "$DCHECKOUT" | cut -d' ' -f2)
echo "Driver checkout: reference=$DSUB_REF amount=R$DSUB_AMOUNT"
test "$DSUB_AMOUNT" = "100" || { echo "FAIL: expected driver subscription R100, got R$DSUB_AMOUNT"; exit 1; }
echo "Assert: driver subscription amount = R100 ✓"

DCONFIRM=$(curl -sf -X POST "$API_URL/subscriptions/mock-checkout/$DSUB_REF/confirm" \
  | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['message'])")
echo "Driver confirm: $DCONFIRM"

echo "=== Subscription flow PASSED ==="
