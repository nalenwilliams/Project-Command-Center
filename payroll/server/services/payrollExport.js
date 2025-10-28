import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'
import fs from 'fs'
export async function exportWH347(run, items, outPath){
  const doc = new PDFDocument({ margin: 36 })
  doc.pipe(fs.createWriteStream(outPath))
  doc.fontSize(16).text('Certified Payroll Report (WH-347 style)', { align: 'center' })
  doc.moveDown()
  doc.fontSize(10).text(`Payroll Run: ${run.id}`)
  doc.text(`Week Ending: ${run.week_ending}`)
  doc.text(`Status: ${run.status}`)
  doc.moveDown()
  items.forEach((it, i) => {
    doc.text(`${i+1}. ${it.employee_name} — ${it.classification} ${it.davis_bacon ? '(DB)' : ''}`)
    doc.text(`   Hours: Reg ${it.hours_regular} | OT ${it.hours_ot}`)
    doc.text(`   Gross: $${it.gross_pay} | Fringe: $${it.fringe_pay} | Taxes: $${it.taxes} | Deductions: $${it.deductions} | Net: $${it.net_pay}`)
    doc.moveDown(0.5)
  })
  doc.moveDown()
  doc.text('Contractor Statement: I certify the above is correct and complete.')
  doc.text('(Digital signature on file)')
  doc.end()
  return outPath
}
export async function exportPayrollSummaryXLSX(run, items, outPath){
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Payroll Summary')
  ws.addRow(['Employee','Classification','DB','Hours Reg','Hours OT','Gross','Fringe','Taxes','Deductions','Net'])
  items.forEach(it => {
    ws.addRow([it.employee_name, it.classification, it.davis_bacon ? 'Yes':'No', it.hours_regular, it.hours_ot, it.gross_pay, it.fringe_pay, it.taxes, it.deductions, it.net_pay])
  })
  await wb.xlsx.writeFile(outPath)
  return outPath
}
export function exportNACHA(run, items){
  // Minimal placeholder; validate with bank provider in production
  const lines = []
  lines.push('101 000000000 0000000002401010000A094101WDL PAYROLL        ACME BANK         ')
  lines.push('5200WDL PAYROLL                0000000000PPDPayroll         240101   1123456780000001')
  let entryCount = 0, totalCredit = 0
  items.forEach((it, idx) => {
    const routing = String(it.bank_routing || '000000000').padStart(9,'0')
    const account = String(it.bank_account || '000000000000').slice(0,17).padEnd(17,' ')
    const amountCents = Math.round((it.net_pay || 0) * 100)
    const id = String(it.ssn_last4 || '').padStart(15,' ')
    const name = String(it.employee_name || 'EMPLOYEE').slice(0,22).padEnd(22,' ')
    const trace = '112345678' + String(idx+1).padStart(7,'0')
    lines.push(`622${routing}${account}${String(amountCents).padStart(10,'0')}${id}${name}  0${trace}`)
    entryCount += 1
    totalCredit += amountCents
  })
  lines.push(`820000${String(entryCount).padStart(6,'0')}0000000000${''.padStart(12,'0')}${String(totalCredit).padStart(12,'0')}000000000000123456780000001`)
  lines.push('9000001' + '000001' + '000001' + '000000' + '0000000000' + '000000000000' + '000000000000' + '                         ')
  return lines.join('\n')
}
