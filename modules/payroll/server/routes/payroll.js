import express from 'express'
import { createRun, updateRun, getRun, listTimesheetsByWeek, listEmployees, addRunItem, listRunItems } from '../services/payrollDB.js'
import { calcEmployeePay } from '../services/payrollCalc.js'
import { exportWH347, exportPayrollSummaryXLSX, exportNACHA } from '../services/payrollExport.js'
import fs from 'fs/promises'
import path from 'path'
const router = express.Router()
router.post('/run', (req, res) => { const { week_ending } = req.body || {}; const run = createRun(week_ending); res.json(run) })
router.post('/calc', async (req, res) => {
  const { run_id } = req.body || {}; const run = getRun(run_id); if (!run) return res.status(404).json({ error: 'Run not found' })
  const tss = listTimesheetsByWeek(run.week_ending); const employees = listEmployees(); const empIndex = Object.fromEntries(employees.map(e => [e.id, e]))
  const grouped = {}; for (const ts of tss){ grouped[ts.employee_id] = grouped[ts.employee_id] || { hours_regular: 0, hours_ot: 0, project_codes: new Set() }; grouped[ts.employee_id].hours_regular += Number(ts.hours_regular || 0); grouped[ts.employee_id].hours_ot += Number(ts.hours_ot || 0); if (ts.project_code) grouped[ts.employee_id].project_codes.add(ts.project_code) }
  const items = []; for (const [empId, ag] of Object.entries(grouped)){ const emp = empIndex[empId]; if (!emp) continue; const result = await calcEmployeePay({ base_rate: Number(emp.base_rate || 0), fringe_rate: Number(emp.fringe_rate || 0), davis_bacon: !!emp.davis_bacon, hours_regular: Number(ag.hours_regular || 0), hours_ot: Number(ag.hours_ot || 0), deductions: emp.deductions || {}, employee: emp })
    items.push(addRunItem({ run_id: run.id, employee_id: emp.id, employee_name: emp.first_name + ' ' + emp.last_name, classification: emp.classification, davis_bacon: !!emp.davis_bacon, hours_regular: ag.hours_regular, hours_ot: ag.hours_ot, gross_pay: result.gross, fringe_pay: result.fringe, taxes: result.taxes.federal + result.taxes.state + result.taxes.local + result.taxes.fica + result.taxes.medicare + (result.taxes.futa||0) + (result.taxes.suta||0), deductions: (result.posttax||0), net_pay: result.net })) }
  run.status = 'validated'; updateRun(run); res.json({ run, items }) })
router.post('/approve', (req, res) => { const { run_id, approver } = req.body || {}; const run = getRun(run_id); if (!run) return res.status(404).json({ error: 'Run not found' }); run.status = 'approved'; run.approved_by = approver || 'HR'; updateRun(run); res.json(run) })
router.post('/export', async (req, res) => { const { run_id } = req.body || {}; const run = getRun(run_id); if (!run) return res.status(404).json({ error: 'Run not found' }); const items = listRunItems(run.id); const outDir = '/mnt/data'; const wh347 = path.join(outDir, `WH347_${run.id}.pdf`); const xlsx = path.join(outDir, `PayrollSummary_${run.id}.xlsx`); await exportWH347(run, items, wh347); await exportPayrollSummaryXLSX(run, items, xlsx); const nacha = exportNACHA(run, items); const nacPath = path.join(outDir, `NACHA_${run.id}.txt`); await fs.writeFile(nacPath, nacha, 'utf8'); res.json({ wh347, xlsx, nacPath }) })
router.post('/pay', async (req, res) => { const { run_id } = req.body || {}; const run = getRun(run_id); if (!run) return res.status(404).json({ error: 'Run not found' }); if (run.status !== 'approved') return res.status(400).json({ error: 'Run must be approved before payment' }); run.status = 'paid'; updateRun(run); res.json({ ok: true, run }) })
export default router
