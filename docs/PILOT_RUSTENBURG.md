# KasiEats Rustenburg Pilot Launch Guide

## Pilot scope

Launch KasiEats in **Rustenburg townships** with 5 active food outlets, 1 active driver, and ops managed via the admin dashboard.

## Seeded accounts (after `yarn db:seed`)

| Role | Login | Notes |
|------|-------|-------|
| Admin | admin@kasieats.co.za / Admin123! | http://localhost:3002 |
| Customer | 0761234567 · OTP 123456 | Customer app |
| Vendor | 0831234567 · OTP 123456 | Mama Lindiwe's (vendor web :3001) |
| Driver | 0851234567 · OTP 123456 | Driver app :8082 |

### Active vendors (5)

1. Mama Lindiwe's Kota Stand — Tlhabane
2. Joe's Shisanyama — Boitekong
3. Sis Mary's Home Kitchen — Boitekong
4. The Corner Kota — Tlhabane Taxi Rank
5. Braai Boss — Rustenburg CBD

### Pending KYC (admin approval)

- New Kota Spot (0891234567)
- Kasi Bunny Chow (0801234568)
- Driver Sipho Dlamini (0861234568)

## Launch checklist

- [ ] Run `docker compose up -d && yarn db:migrate && yarn db:seed`
- [ ] Start API (:3000), vendor web (:3001), admin (:3002), customer + driver apps
- [ ] Admin approves pending vendors/drivers
- [ ] Onboard 5 real vendors using vendor phones above as templates
- [ ] Run 10 test orders end-to-end (customer → vendor → driver → delivered)
- [ ] Enable Ozow/Yoco production keys when ready (`PAYMENTS_SANDBOX=false`)
- [ ] Configure Firebase for push notifications (`FIREBASE_PROJECT_ID`)
- [ ] Set SMS provider for production OTP (`SMS_PROVIDER=twilio` or `africas_talking`)

## Vendor self-service

Vendors can apply at http://localhost:3001/register — admin approves in the dashboard.

## Menu management

Approved vendors manage their menu at http://localhost:3001/menu

## Commission model

- Platform fee: 15% of subtotal (via service fee)
- Delivery fee: R25 (driver earns 60% = R15)
- Vendor keeps 85% of food subtotal

## Support

Pilot hotline: configure in admin dashboard (future). For dev issues, check API health at `/api/v1/health`.
