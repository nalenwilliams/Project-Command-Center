import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

// Routers from modules
import aiRouter from '../modules/ai_core/server/routes/ai.js'
import composeRouter from '../modules/ai_core/server/routes/compose.js'
import printRouter from '../modules/ai_core/server/routes/print.js'
import commsRouter from '../modules/ai_core/server/routes/comms.js'
import navRouter from '../modules/command_router/server/routes/nav.js'
import employeesRouter from '../modules/payroll/server/routes/employees.js'
import payrollRouter from '../modules/payroll/server/routes/payroll.js'
import vendorsRouter from '../modules/vendor_pay/server/routes/vendors.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(bodyParser.json({ limit: '10mb' }))
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')))
app.get('/health', (req, res) => res.json({ ok: true, status: 'running' }))

// Mount modular routes
app.use('/ai', aiRouter)
app.use('/compose', composeRouter)
app.use('/print', printRouter)
app.use('/comms', commsRouter)
app.use('/nav', navRouter)
app.use('/employees', employeesRouter)
app.use('/payroll', payrollRouter)
app.use('/vendors', vendorsRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`
===========================================
✅  WDL Command Center — Modular Enterprise Suite
===========================================
🌐  Base URL: ${process.env.APP_BASE_URL}
⚙️   Port: ${PORT}
🏢  Company: ${process.env.COMPANY_NAME || 'Williams Diversified LLC'}
-------------------------------------------
🧠  AI, Proposal, Form Fill, Comms, Nav, Payroll, Vendor Pay
-------------------------------------------
✅  System initialized successfully.
===========================================
`)
})
