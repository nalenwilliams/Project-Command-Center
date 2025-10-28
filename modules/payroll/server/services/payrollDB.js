import { v4 as randomUUID } from 'uuid'
const db = { employees: new Map(), time_sheets: [], payroll_runs: new Map(), payroll_run_items: [] }
export function upsertEmployee(emp){ const id = emp.id || randomUUID(); const rec = { id, ...emp }; db.employees.set(id, rec); return rec }
export function listEmployees(){ return Array.from(db.employees.values()) }
export function addTimesheet(ts){ const rec = { id: ts.id || randomUUID(), ...ts }; db.time_sheets.push(rec); return rec }
export function listTimesheetsByWeek(week_ending){ return db.time_sheets.filter(t => t.week_ending === week_ending) }
export function createRun(week_ending){ const run = { id: randomUUID(), week_ending, status: 'draft' }; db.payroll_runs.set(run.id, run); return run }
export function updateRun(run){ db.payroll_runs.set(run.id, run); return run }
export function getRun(run_id){ return db.payroll_runs.get(run_id) }
export function addRunItem(item){ const rec = { id: randomUUID(), ...item }; db.payroll_run_items.push(rec); return rec }
export function listRunItems(run_id){ return db.payroll_run_items.filter(r => r.run_id === run_id) }
export const __db = db
