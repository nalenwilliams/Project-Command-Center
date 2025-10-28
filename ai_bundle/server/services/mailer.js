import { google } from 'googleapis'
import { Buffer } from 'buffer'
import mime from 'mime-types'
const SEND_EMAILS = String(process.env.SEND_EMAILS || 'false').toLowerCase() === 'true'
async function gmailClientFor(user) {
  const auth = new google.auth.OAuth2()
  return google.gmail({ version: 'v1', auth })
}
async function buildMime({ from, to, cc = [], bcc = [], subject, html, text, attachments = [] }) {
  const boundary = 'mixed-' + Date.now()
  const altBoundary = 'alt-' + Date.now()
  const lines = []
  lines.push(`From: ${from}`)
  lines.push(`To: ${Array.isArray(to) ? to.join(', ') : to}`)
  if (cc.length) lines.push(`Cc: ${cc.join(', ')}`)
  if (bcc.length) lines.push(`Bcc: ${bcc.join(', ')}`)
  lines.push(`Subject: ${subject}`)
  lines.push('MIME-Version: 1.0')
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"\n`)
  lines.push(`--${boundary}`)
  lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"\n`)
  lines.push(`--${altBoundary}`)
  lines.push('Content-Type: text/plain; charset="UTF-8"\n')
  lines.push(text || '')
  lines.push(`--${altBoundary}`)
  lines.push('Content-Type: text/html; charset="UTF-8"\n')
  lines.push(html || '')
  lines.push(`--${altBoundary}--`)
  for (const a of attachments) {
    const b64 = a.contentBase64 || ''
    const ctype = mime.lookup(a.filename) || 'application/octet-stream'
    lines.push(`--${boundary}`)
    lines.push(`Content-Type: ${ctype}; name="${a.filename}"`)
    lines.push('Content-Transfer-Encoding: base64')
    lines.push(`Content-Disposition: attachment; filename="${a.filename}"\n`)
    lines.push(b64)
  }
  lines.push(`--${boundary}--`)
  return Buffer.from(lines.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
export async function sendForUser(user, { to, cc = [], bcc = [], subject, html, text, attachments = [] }) {
  if (!SEND_EMAILS) return { simulated: true, messageId: 'simulated', threadId: 'simulated' }
  const gmail = await gmailClientFor(user)
  const raw = await buildMime({ from: user.google_email || 'me', to, cc, bcc, subject, html, text, attachments })
  const resp = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } })
  return { messageId: resp.data.id, threadId: resp.data.threadId, simulated: false }
}
export async function getUserSignatureHtml(user) { return user.signature_html || '' }
