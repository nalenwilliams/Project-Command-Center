import express from 'express'
import { renderProposalHTML, htmlToPDF } from '../services/render.js'
const router = express.Router()
router.post('/render-proposal', async (req, res) => {
  try {
    const { form, proposal, as = 'html' } = req.body
    const data = {
      projectName: proposal?.project?.name || form?.projectName || '',
      projectLocation: form?.siteAddress || '',
      clientName: form?.clientName || '',
      startDate: form?.startDate || '',
      endDate: form?.endDate || '',
      scopeOfWork: proposal?.layout?.scopeOfWork,
      inclusionsByTrade: proposal?.layout?.inclusionsByTrade,
      itemizedPricing: proposal?.layout?.itemizedPricing,
      totalLumpSum: proposal?.layout?.totalLumpSum,
      notes: form?.scopeSummary || ''
    }
    const html = await renderProposalHTML(data)
    if (as === 'pdf') {
      const out = `/mnt/data/proposal_${Date.now()}.pdf`
      await htmlToPDF(html, out)
      return res.json({ pdf: out })
    }
    res.type('html').send(html)
  } catch (e) { res.status(500).json({ error: e.message }) }
})
export default router
