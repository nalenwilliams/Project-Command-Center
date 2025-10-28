import express from 'express'
import fetch from 'node-fetch'
const router = express.Router()
const AI_BASE = process.env.APP_BASE_URL ? process.env.APP_BASE_URL + '/ai' : 'http://localhost:3001/ai'
router.post('/compose-proposal', async (req, res) => {
  try {
    const { schema, notes, trades, inclusions = [], exclusions = [], overheads = [], margins = [] } = req.body
    const ff = await fetch(`${AI_BASE}/form-fill`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ schema, notes }) }).then(r => r.json())
    const project = {
      name: ff.clientName || ff.projectName || 'Untitled Project',
      location: ff.siteAddress || '',
      trades: trades?.length ? trades : (ff.trades || []),
      inclusions: ff.inclusions || inclusions,
      exclusions: ff.exclusions || exclusions
    }
    const payload = { project, notes: ff.scopeSummary || '', taxRate: 0.0, overheads: ff.overheads || overheads, margins: ff.margins || (margins.length ? margins : [{ label:'Markup', percent: 10 }]) }
    const proposal = await fetch(`${AI_BASE}/proposal`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(r => r.json())
    res.json({ form: ff, proposal })
  } catch (e) { res.status(500).json({ error: e.message }) }
})
export default router
