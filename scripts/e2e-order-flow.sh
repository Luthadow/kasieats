#!/usr/bin/env bash
# Full marketplace loop for MTHURA (Built for the Township Economy).
# Launch payment model: customer pays the vendor via EFT and uploads proof; the
# merchant verifies before the kitchen starts; a 4-digit delivery PIN is generated
# and the driver confirms it on delivery. MTHURA does not process food payments.
#   customer order → EFT proof → vendor verify → accept/preparing/ready
#   → driver claim/pickup/en-route/arrived/deliver (PIN)
#   → merchant subscription (R150) → driver subscription (R80)
set -euo pipefail

API_URL="${API_URL:-http://localhost:3000/api/v1}"
PYTHON="${PYTHON:-python3}"

echo "=== MTHURA E2E order flow ==="
echo "    Target: $API_URL"
echo "    Note: MTHURA does not process food payments."
echo "          Customers pay vendors via EFT + uploaded proof."
echo ""

curl -sf "$API_URL/health" >/dev/null

VENDOR_ID=$(curl -sf "$API_URL/vendors?lat=-25.65&lng=27.24&radiusKm=20" | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")
ITEM_ID=$(curl -sf "$API_URL/vendors/$VENDOR_ID" | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['data']['menuItems'][0]['id'])")

curl -sf -X POST "$API_URL/auth/send-otp" -H 'Content-Type: application/json' -d '{"phone":"+27761234567"}' >/dev/null
CUSTOMER_TOKEN=$(curl -sf -X POST "$API_URL/auth/verify-otp" -H 'Content-Type: application/json' -d '{"phone":"+27761234567","otp":"123456"}' | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['token'])")

ORDER_ID=$(curl -sf -X POST "$API_URL/orders" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"vendorId\":\"$VENDOR_ID\",\"items\":[{\"menuItemId\":\"$ITEM_ID\",\"quantity\":1}],\"deliveryAddress\":\"123 Zuma Street\",\"paymentMethod\":\"eft\"}" \
  | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "Created order $ORDER_ID (payment_status=awaiting_proof)"

# Customer uploads EFT proof of payment
PROOF_STATUS=$(curl -sf -X POST "$API_URL/orders/$ORDER_ID/eft-proof" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"proofUrl":"https://example.com/proof/e2e.jpg","reference":"E2E-EFT-REF"}' \
  | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['data']['paymentStatus'])")
echo "Customer uploaded EFT proof → $PROOF_STATUS"
test "$PROOF_STATUS" = "proof_submitted"

VENDOR_TOKEN=$(curl -sf -X POST "$API_URL/auth/login" -H 'Content-Type: application/json' \
  -d '{"phoneOrEmail":"+27831234567","password":"Vendor123!"}' \
  | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Vendor verifies EFT payment → generates delivery PIN
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
# payment_status is 'verified' — MTHURA stores EFT verification only, no funds processed
test "$FINAL" = "delivered verified"

curl -sf -X POST "$API_URL/reviews" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"orderId\":\"$ORDER_ID\",\"vendorRating\":5,\"driverRating\":5,\"comment\":\"E2E ok\"}" >/dev/null

echo ""
echo "=== E2E order flow PASSED ==="
echo ""

# ─── Merchant subscription sandbox checkout (R150) ────────────────────────────
echo "=== Merchant subscription checkout (sandbox) ==="
CHECKOUT=$(curl -sf -X POST "$API_URL/subscriptions/checkout" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  | "$PYTHON" -c "import sys,json; d=json.load(sys.stdin)['data']; print(d['reference'], d['amount'])")
SUB_REF=$(echo "$CHECKOUT" | cut -d' ' -f1)
SUB_AMOUNT=$(echo "$CHECKOUT" | cut -d' ' -f2)
echo "Merchant checkout: reference=$SUB_REF amount=R$SUB_AMOUNT"
test "$SUB_AMOUNT" = "150"

CONFIRM=$(curl -sf -X POST "$API_URL/subscriptions/mock-checkout/$SUB_REF/confirm" \
  | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['message'])")
echo "Merchant confirm: $CONFIRM"

# ─── Driver subscription sandbox checkout (R80) ───────────────────────────────
echo "=== Driver subscription checkout (sandbox) ==="
DCHECKOUT=$(curl -sf -X POST "$API_URL/subscriptions/driver/checkout" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  | "$PYTHON" -c "import sys,json; d=json.load(sys.stdin)['data']; print(d['reference'], d['amount'])")
DSUB_REF=$(echo "$DCHECKOUT" | cut -d' ' -f1)
DSUB_AMOUNT=$(echo "$DCHECKOUT" | cut -d' ' -f2)
echo "Driver checkout: reference=$DSUB_REF amount=R$DSUB_AMOUNT"
test "$DSUB_AMOUNT" = "80"

DCONFIRM=$(curl -sf -X POST "$API_URL/subscriptions/mock-checkout/$DSUB_REF/confirm" \
  | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['message'])")
echo "Driver confirm: $DCONFIRM"

echo "=== Subscription flow PASSED ==="
