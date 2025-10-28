# Williams Diversified — Command Center (All-in-One Upload)

**Includes**
- AI Core: /ai, /compose, /print, /comms
- Command Router (NL → screen): /nav
- Company Profile context (config/company_profile.json) — no physical address stored
- Payroll System (Davis-Bacon & non-DB): /employees, /payroll
- DB schema: db/schema.sql
- Assets: logo & signature (optional)

**Quick Start**
1) `cp .env.example .env` and set keys (OPENAI, Google OAuth)
2) `npm install`
3) `npm run dev`

**Safety**
- EMAIL send is off by default (`SEND_EMAILS=false`).
- NACHA generator is sample; validate with your bank/ACH provider.
- Taxes are placeholders; plug in your tax service for production.
