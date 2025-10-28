// /modules/payroll/server/services/payrollCalc.js
import { calculateWithholding } from './taxEngine.js'
export async function calcEmployeePay({ base_rate, fringe_rate=0, davis_bacon=false, hours_regular=0, hours_ot=0, deductions = {}, employee={}, work={}, ytd={} }){
  const ot_rate = base_rate * 1.5
  const gross_regular = hours_regular * base_rate
  const gross_ot = hours_ot * ot_rate
  const gross = +(gross_regular + gross_ot).toFixed(2)
  const pretax = +(Number(deductions?.pretaxMedical||0) + Number(deductions?.hsa||0) + (gross * Number(deductions?._401kPct||0))).toFixed(2)
  const taxable = Math.max(0, +(gross - pretax).toFixed(2))
  let taxes = await calculateWithholding({ taxableWages: taxable, ytd, employee, work })
  if (!taxes || typeof taxes !== 'object') {
    const fica = +(taxable * 0.062).toFixed(2)
    const medicare = +(taxable * 0.0145).toFixed(2)
    const federal = +(taxable * 0.10).toFixed(2)
    taxes = { federal, state: 0, local: 0, fica, medicare, futa: 0, suta: 0 }
  }
  const posttax = +(Number(deductions?.garnishment||0) + Number(deductions?.misc||0)).toFixed(2)
  const fringe = davis_bacon ? +((hours_regular + hours_ot) * fringe_rate).toFixed(2) : 0
  const totalTaxes = +(Number(taxes.federal||0) + Number(taxes.state||0) + Number(taxes.local||0) + Number(taxes.fica||0) + Number(taxes.medicare||0) + Number(taxes.futa||0) + Number(taxes.suta||0)).toFixed(2)
  const net = +(gross + fringe - totalTaxes - posttax).toFixed(2)
  return { gross, fringe, taxes, pretax, posttax, net, breakdown: { gross_regular, gross_ot, ot_rate } }
}
