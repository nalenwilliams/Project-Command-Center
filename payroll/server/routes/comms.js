import express from 'express'
import { sendForUser, getUserSignatureHtml } from '../services/mailer.js'
import { renderTpl, mdToHtml } from '../services/templates.js'
const router = express.Router()
function defaultBodyMd() {
  return [
    'Hi {{project.client.name}},',
    '',
    'Here is an update for **{{project.name}}** at **{{project.address}}**.',
    '',
    '**Summary**',
    '- Scope: {{scope.short}}',
    '- Total: ${{project.total}}',
    '- Dates: {{project.schedule.start}} → {{project.schedule.end}}',
    '',
    'Thanks,',
    '{{user.name}}'
  ].join('\n')
}
router.post('/send', async (req, res) => {
  try {
    const user = req.user || { name:'Nalen Williams', google_email: process.env.DEV_GOOGLE_EMAIL || 'me@example.com', id: 'user_123' }
    const { project = {}, to = [], cc = [], bcc = [], subjectTpl, bodyTpl } = req.body
    const merge = { user, project, scope: { short: project.scopeSummary || '' }, date: { today: new Date().toISOString().slice(0,10) } }
    const subject = renderTpl(subjectTpl || "[[#{{project.code}}]] Update: {{project.name}}", merge)
    const bodyMd  = renderTpl(bodyTpl || defaultBodyMd(), merge)
    const bodyHtml = mdToHtml(bodyMd)
    const signature = await getUserSignatureHtml(user).catch(() => '')
    const htmlWithSig = signature ? bodyHtml + '<br><br>' + signature : bodyHtml
    const result = await sendForUser(user, { to: to.length ? to : [project.default_client_email].filter(Boolean), cc, bcc, subject, html: htmlWithSig, text: bodyMd, attachments: [] })
    res.json({ ok: true, threadId: result.threadId, messageId: result.messageId, simulated: result.simulated || false })
  } catch (e) { res.status(500).json({ error: e.message }) }
})
export default router
