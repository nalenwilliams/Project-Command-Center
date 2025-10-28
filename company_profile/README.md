# Williams Diversified — Company Profile AI Context

This package adds a **Company Intelligence Layer** so the AI in your Command Center
always knows who Williams Diversified is and how to speak/act.

## Files
- `config/company_profile.json` — your company knowledge (edit anytime, no redeploy).
- `server/services/profile.js` — loader + system prompt builder.

## How to wire it into your AI routes
In `/server/routes/ai.js` (or equivalent), add:

```js
import { getCompanyProfile, buildSystemPrompt } from "../services/profile.js";

// inside your /ai/chat, /ai/proposal, /ai/form-fill handlers:
const profile = await getCompanyProfile();
const sys = buildSystemPrompt(profile); // pass 'sys' as the system prompt to your model
```
