import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import aiRouter from './routes/ai.js'
import composeRouter from './routes/compose.js'
import printRouter from './routes/print.js'
import commsRouter from './routes/comms.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(bodyParser.json({ limit: '10mb' }))

app.use('/assets', express.static(path.join(__dirname, '..', 'assets')))

app.get('/health', (req, res) => res.json({ ok: true, status: 'running' }))

app.use('/ai', aiRouter)
app.use('/compose', composeRouter)
app.use('/print', printRouter)
app.use('/comms', commsRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`
===========================================
✅  Williams Diversified AI Core
===========================================
🌐  Base URL: ${process.env.APP_BASE_URL}
⚙️   Port: ${PORT}
🏢  Company: ${process.env.COMPANY_NAME || 'Williams Diversified LLC'}
📧  Contact: ${process.env.DEV_GOOGLE_EMAIL || 'nalenwilliams@williamsdiverse.com'}
-------------------------------------------
🧠  AI Assist, Form Fill, Proposal & Gmail Ready
-------------------------------------------
✅  System initialized successfully.
===========================================
`)
})
