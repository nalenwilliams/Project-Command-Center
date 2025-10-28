import express from 'express'
import fetch from 'node-fetch'
import { getCompanyProfile, buildSystemPrompt } from '../services/profile.js'
const router = express.Router()
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-5-turbo'
async function openai(messages, response_format) {
  const r = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.2, ...(response_format ? { response_format } : {}) })
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}
router.post('/chat', async (req, res) => {
  try {
    const { context, message, role } = req.body
    const profile = await getCompanyProfile()
    const sys = buildSystemPrompt(profile) + (role ? `\nDepartment: ${role}` : '')
    const messages = [
      { role: 'system', content: sys },
      { role: 'user', content: `Context: ${JSON.stringify(context || {})}` },
      { role: 'user', content: message || '' }
    ]
    const data = await openai(messages)
    res.json({ reply: data.choices?.[0]?.message?.content ?? '' })
  } catch (e) { res.status(500).json({ error: e.message }) }
})
router.post('/proposal', async (req, res) => {
  try {
    const { project, notes, taxRate = 0, overheads = [], margins = [] } = req.body
    const profile = await getCompanyProfile()
    const sys = buildSystemPrompt(profile) + "\nOutput pure JSON following the company's 4-part layout."
    const data = await openai(
      [{ role:'system', content: sys }, { role:'user', content: JSON.stringify({ project, notes, taxRate, overheads, margins }) }],
      { type: 'json_object' }
    )
    res.json(JSON.parse(data.choices[0].message.content))
  } catch (e) { res.status(500).json({ error: e.message }) }
})
router.post('/form-fill', async (req, res) => {
  try {
    const { schema, notes, defaults = {} } = req.body
    const profile = await getCompanyProfile()
    const sys = buildSystemPrompt(profile) + "\nReturn JSON matching the schema. Include _confidence and _missing."
    const data = await openai(
      [{ role:'system', content: sys }, { role:'user', content: JSON.stringify({ notes, defaults }) }],
      { type: 'json_object' }
    )
    res.json(JSON.parse(data.choices[0].message.content))
  } catch (e) { res.status(500).json({ error: e.message }) }
})
export default router
