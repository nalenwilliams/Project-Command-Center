import express from "express";
import fetch from "node-fetch";
const router = express.Router();
const SCREEN_REGISTRY = [
  { key: "dashboard",   path: "/dashboard",   aliases: ["home","command center","main"] },
  { key: "ai",          path: "/ai",          aliases: ["chat","assistant","ask ai"] },
  { key: "proposals",   path: "/proposals",   aliases: ["estimates","bids","auto proposal"] },
  { key: "payroll",     path: "/payroll",     aliases: ["certified payroll","wh-347","pay run"] },
  { key: "onboarding",  path: "/onboarding",  aliases: ["new hire","hire packet","w4","i9","direct deposit"] },
  { key: "plaid",       path: "/banking",     aliases: ["bank","ach","payments","dwolla","stripe"] },
  { key: "truck-logs",  path: "/truck-logs",  aliases: ["fleet logs","vehicle logs"] },
  { key: "time-sheets", path: "/timesheets",  aliases: ["timecards","hours","clock"] },
  { key: "sign-offs",   path: "/sign-offs",   aliases: ["work sign offs","field signoff","approvals"] },
  { key: "projects",    path: "/projects",    aliases: ["jobs","sites"] },
  { key: "clients",     path: "/clients",     aliases: ["customers","contacts"] },
  { key: "invoices",    path: "/invoices",    aliases: ["billing","accounts receivable"] },
  { key: "reports",     path: "/reports",     aliases: ["analytics","metrics"] },
  { key: "settings",    path: "/settings",    aliases: ["admin","preferences","configuration"] }
];
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-5-turbo";
async function llmRoute(command) {
  const desc = SCREEN_REGISTRY.map(s => ({ key: s.key, path: s.path, aliases: s.aliases }));
  const sys = `You map natural-language commands to app screens.
Return strict JSON: {"intent":"NAVIGATE"|"UNKNOWN","route":"/path"|"","screen_key":"", "confidence":0..1, "reason":"" }.
Use the provided registry only.`;
  const user = JSON.stringify({ command, registry: desc });
  const r = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, temperature: 0, response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: user }] })
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  return JSON.parse(data.choices[0].message.content);
}
router.post("/resolve", async (req, res) => {
  try {
    const { command = "" } = req.body || {};
    if (!command.trim()) return res.status(400).json({ error: "Missing command" });
    let out = await llmRoute(command);
    if (out.intent !== "NAVIGATE" || !out.route) {
      const q = command.toLowerCase();
      const found = SCREEN_REGISTRY.find(s =>
        s.key.includes(q) || s.path.includes(q) || s.aliases.some(a => q.includes(a))
      );
      if (found) out = { intent: "NAVIGATE", route: found.path, screen_key: found.key, confidence: 0.51, reason: "fallback" };
    }
    if (out.intent !== "NAVIGATE" || !out.route) return res.json({ intent: "UNKNOWN", suggestions: SCREEN_REGISTRY.map(s => s.path) });
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }) }
});
export default router;
