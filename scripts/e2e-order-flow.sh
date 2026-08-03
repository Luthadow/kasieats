#!/usr/bin/env bash
# Full marketplace loop: customer order → vendor ready → driver deliver → pay/review
set -euo pipefail

API_URL="${API_URL:-http://localhost:3000/api/v1}"
PYTHON="${PYTHON:-python3}"

echo "=== KasiEats E2E order flow ==="
echo "    Target: $API_URL"
echo ""

curl -sf "$API_URL/health" >/dev/null

VENDOR_ID=$(curl -sf "$API_URL/vendors?lat=-25.65&lng=27.24&radiusKm=20" | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")
ITEM_ID=$(curl -sf "$API_URL/vendors/$VENDOR_ID" | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['data']['menuItems'][0]['id'])")

curl -sf -X POST "$API_URL/auth/send-otp" -H 'Content-Type: application/json' -d '{"phone":"+27761234567"}' >/dev/null
CUSTOMER_TOKEN=$(curl -sf -X POST "$API_URL/auth/verify-otp" -H 'Content-Type: application/json' -d '{"phone":"+27761234567","otp":"123456"}' | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['token'])")

ORDER_ID=$(curl -sf -X POST "$API_URL/orders" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"vendorId\":\"$VENDOR_ID\",\"items\":[{\"menuItemId\":\"$ITEM_ID\",\"quantity\":1}],\"deliveryAddress\":\"123 Zuma Street\",\"paymentMethod\":\"cash\"}" \
  | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "Created order $ORDER_ID"

VENDOR_TOKEN=$(curl -sf -X POST "$API_URL/auth/login" -H 'Content-Type: application/json' \
  -d '{"phoneOrEmail":"+27831234567","password":"Vendor123!"}' \
  | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['token'])")

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

for action in pickup en-route arrived deliver; do
  STATUS=$(curl -sf -X POST "$API_URL/deliveries/$DELIVERY_ID/$action" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['data']['status'])")
  echo "Driver $action → $STATUS"
done

FINAL=$("$PYTHON" - <<PY
import json,urllib.request
req=urllib.request.Request("$API_URL/orders/$ORDER_ID", headers={"Authorization":"Bearer $CUSTOMER_TOKEN"})
d=json.load(urllib.request.urlopen(req))["data"]
print(d["status"], d["paymentStatus"])
PY
)
echo "Final order: $FINAL"
test "$FINAL" = "delivered paid"

curl -sf -X POST "$API_URL/reviews" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"orderId\":\"$ORDER_ID\",\"vendorRating\":5,\"driverRating\":5,\"comment\":\"E2E ok\"}" >/dev/null

echo ""
echo "=== E2E order flow PASSED ==="
