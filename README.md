# Williams Diversified — Command Center (Modular Enterprise Suite)

**Option 1 (Modular)** — every system lives in `/modules/<name>`:
- `modules/ai_core` → AI Assist, Proposal, Form Fill, Comms, Templates
- `modules/company_profile` → company_profile.json (AI context)
- `modules/command_router` → natural-language navigation (/nav/resolve)
- `modules/payroll` → Davis-Bacon & non-DB payroll, exports, tax engine
- `modules/vendor_pay` → Vendors, invoices, payments, 1099 CSV/PDF

**No physical address is stored anywhere.**

## Quick Start
1) `cp .env.example .env` and set keys (OPENAI, Google OAuth, etc.)
2) `npm install`
3) `npm run dev`
4) Hit `/health` to verify.

## Notes
- Taxes: `modules/payroll/server/services/taxEngine.js` has a provider-ready stub.
- ACH: integrate Plaid→Dwolla/Stripe in your payout layer (hooks are present).
- Email sending is OFF by default (`SEND_EMAILS=false`). Enable after testing.
