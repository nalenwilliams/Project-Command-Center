import express from 'express'
import { upsertVendor, listVendors, addVendorInvoice, listVendorInvoices, addVendorPayment, listVendorPayments, markInvoicePaid } from '../services/vendorPayDB.js'
import { export1099CSV, exportVendorPaySummaryPDF } from '../services/vendorPayExport.js'
import fs from 'fs/promises'
import path from 'path'
const router = express.Router()
router.post('/', (req, res) => { const v = upsertVendor(req.body || {}); res.json(v) })
router.get('/', (_req, res) => res.json(listVendors()))
router.post('/invoice', (req, res) => { const inv = addVendorInvoice(req.body || {}); res.json(inv) })
router.get('/invoices', (req, res) => { const q = req.query || {}; res.json(listVendorInvoices(q)) })
router.post('/queue-payment', (req, res) => { const p = addVendorPayment(req.body || {}); res.json(p) })
router.post('/mark-paid', (req, res) => { const { invoice_id } = req.body || {}; const inv = markInvoicePaid(invoice_id); if (!inv) return res.status(404).json({ error: 'Invoice not found' }); res.json(inv) })
router.post('/export/1099-csv', async (req, res) => { const { payments = [] } = req.body || {}; const out = path.join('/mnt/data', `Vendor1099_${Date.now()}.csv`); export1099CSV(payments, out); res.json({ csv: out }) })
router.post('/export/summary-pdf', async (req, res) => { const { payments = [] } = req.body || {}; const out = path.join('/mnt/data', `VendorPayments_${Date.now()}.pdf`); exportVendorPaySummaryPDF(payments, out); res.json({ pdf: out }) })
export default router
