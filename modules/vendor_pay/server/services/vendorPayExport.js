import PDFDocument from 'pdfkit'
import fs from 'fs'
export function export1099CSV(payments, outPath){
  const lines = []
  lines.push(['Vendor Name','EIN/SSN','Total Nonemployee Comp ($)','Year'].join(','))
  const totals = new Map()
  payments.forEach(p => {
    const key = (p.vendor_ein || p.vendor_ssn || p.vendor_name)
    const prev = totals.get(key) || { name: p.vendor_name, tin: (p.vendor_ein||p.vendor_ssn||''), total: 0 }
    prev.total += Number(p.amount || 0)
    totals.set(key, prev)
  })
  for (const { name, tin, total } of totals.values()){
    lines.push([JSON.stringify(name), JSON.stringify(tin), total.toFixed(2), new Date().getFullYear()].join(','))
  }
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
  return outPath
}
export function exportVendorPaySummaryPDF(payments, outPath){
  const doc = new PDFDocument({ margin: 36 })
  doc.pipe(fs.createWriteStream(outPath))
  doc.fontSize(16).text('Vendor Payments Summary', { align: 'center' })
  doc.moveDown()
  let idx = 1
  payments.forEach(p => {
    doc.fontSize(10).text(`${idx}. ${p.vendor_name} (${p.vendor_ein||p.vendor_ssn||'TIN N/A'}) — Invoice ${p.invoice_no} — $${Number(p.amount||0).toFixed(2)} — ${p.status}`)
    idx++
  })
  doc.end()
  return outPath
}
