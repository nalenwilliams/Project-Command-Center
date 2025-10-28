import express from 'express'
import { upsertEmployee, listEmployees, addTimesheet } from '../services/payrollDB.js'
const router = express.Router()
router.post('/', (req, res) => { const rec = upsertEmployee(req.body || {}); res.json(rec) })
router.get('/', (_req, res) => res.json(listEmployees()))
router.post('/timesheet', (req, res) => { const rec = addTimesheet(req.body || {}); res.json(rec) })
export default router
