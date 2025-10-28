import express from 'express'
import fetch from 'node-fetch'
const router = express.Router()

// Using Emergent LLM Key with Gemini 2.5 Pro
const EMERGENT_LLM_KEY = process.env.EMERGENT_LLM_KEY
const GEMINI_URL = 'https://api.openai.com/v1/chat/completions'  // Emergent LLM key works with OpenAI endpoint
const MODEL = 'gemini-2.5-pro'

async function callGemini(messages, jsonMode = false) {
  const requestBody = {
    model: MODEL,
    messages,
    temperature: 0.2
  }
  
  if (jsonMode) {
    requestBody.response_format = { type: 'json_object' }
  }
  
  const r = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${EMERGENT_LLM_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
  
  if (!r.ok) {
    const errorText = await r.text()
    throw new Error(`Gemini API Error: ${errorText}`)
  }
  
  return r.json()
}

// Chat endpoint - general AI assistant
router.post('/chat', async (req, res) => {
  try {
    const { context, message } = req.body
    const sys = `You are the Williams Diversified LLC assistant. Timezone: ${process.env.TIMEZONE || 'America/Chicago'}.`
    
    const data = await callGemini([
      { role: 'system', content: sys },
      { role: 'user', content: `Context: ${JSON.stringify(context || {})}` },
      { role: 'user', content: message || '' }
    ])
    
    res.json({ reply: data.choices?.[0]?.message?.content ?? '' })
  } catch (e) {
    console.error('Chat error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// Proposal generation endpoint
router.post('/proposal', async (req, res) => {
  try {
    const { project, notes, taxRate = 0, overheads = [], margins = [] } = req.body
    const sys = `You are a construction proposal expert for Williams Diversified LLC. Generate a detailed proposal with the following structure in JSON format:
{
  "scopeOfWork": "Detailed description of work to be performed",
  "inclusions": [{"trade": "Trade Name", "items": ["item1", "item2"]}],
  "itemizedPricing": [{"description": "Item description", "cost": 0.00}],
  "totalLumpSum": 0.00,
  "notes": "Any additional notes or terms"
}`
    
    const data = await callGemini(
      [
        { role: 'system', content: sys },
        { role: 'user', content: JSON.stringify({ project, notes, taxRate, overheads, margins }) }
      ],
      true // JSON mode
    )
    
    res.json(JSON.parse(data.choices[0].message.content))
  } catch (e) {
    console.error('Proposal error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// Form fill endpoint - extract structured data from notes
router.post('/form-fill', async (req, res) => {
  try {
    const { schema, notes, defaults = {} } = req.body
    const sys = `You are a data extraction expert. Convert the provided notes into JSON matching the schema: ${schema}. 
Include two extra fields:
- "_confidence": A score from 0-1 indicating how confident you are about the extracted data
- "_missing": An array of field names that couldn't be extracted from the notes

Use the defaults provided for any missing required fields.`
    
    const data = await callGemini(
      [
        { role: 'system', content: sys },
        { role: 'user', content: JSON.stringify({ notes, defaults, schema }) }
      ],
      true // JSON mode
    )
    
    res.json(JSON.parse(data.choices[0].message.content))
  } catch (e) {
    console.error('Form fill error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

export default router
