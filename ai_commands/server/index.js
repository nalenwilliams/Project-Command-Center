import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import navRouter from './routes/nav.js'

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use('/nav', navRouter)
app.get('/health', (req, res) => res.json({ok:true, status:'command router active'}))

const PORT = process.env.PORT || 3003
app.listen(PORT, ()=>console.log(`✅ WDL Command Router running on port ${PORT}`))
