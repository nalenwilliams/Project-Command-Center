import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import aiRouter from './routes/ai_gemini.js'  // Using Gemini 2.5 Pro
import composeRouter from './routes/compose.js'
import printRouter from './routes/print.js'
import commsRouter from './routes/comms.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(bodyParser.json({ limit: '10mb' }))

app.use('/assets', express.static(path.join(__dirname, '..', 'assets')))

app.get('/health', (req, res) => res.json({ ok: true, status: 'running', model: 'gemini-2.5-pro' }))

app.use('/ai', aiRouter)
app.use('/compose', composeRouter)
app.use('/print', printRouter)
app.use('/comms', commsRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`
===========================================
✅  Williams Diversified AI Core (Gemini 2.5 Pro)
===========================================
🌐  Base URL: ${process.env.APP_BASE_URL}
⚙️   Port: ${PORT}
🏢  Company: ${process.env.COMPANY_NAME || 'Williams Diversified LLC'}
📧  Contact: ${process.env.DEV_GOOGLE_EMAIL || 'nalenwilliams@williamsdiverse.com'}
-------------------------------------------
🧠  AI Assist, Form Fill, Proposal & Gmail Ready
🚀  Powered by Gemini 2.5 Pro via Emergent LLM Key
-------------------------------------------
✅  System initialized successfully.
===========================================
`)
})
