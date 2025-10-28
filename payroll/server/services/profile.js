// /server/services/profile.js
import fs from "fs/promises";
import path from "path";
const CONFIG_PATH = path.join(process.cwd(), "config", "company_profile.json");
let cache = null;
export async function getCompanyProfile(){ if (cache) return cache; const raw = await fs.readFile(CONFIG_PATH, "utf8"); cache = JSON.parse(raw); return cache; }
export function buildSystemPrompt(profile){
  const p = profile || {};
  const name = p.company_name || "Williams Diversified LLC";
  const desc = p.description || "";
  return [
    `You are the AI assistant for ${name}.`,
    desc,
    "Use Williams Diversified's professional tone and 4-part proposal layout when relevant (Scope of Work; Inclusions by trade; Itemized Pricing; Total Lump Sum).",
    "Follow documented workflows for Rapid Deployment, Temporary Housing, Emergency Power, Environmental Services, Security, and Base Operations."
  ].join("\n");
}
