import { randomUUID } from 'uuid'
const db = { vendors: new Map(), vendor_invoices: new Map(), vendor_payments: new Map() }
export function upsertVendor(v){ const id = v.id || randomUUID(); const rec = { id, name:'', ein:'', email:'', w9_on_file:false, bank_token:null, insurance_expires:null, ...v }; db.vendors.set(id, rec); return rec }
export function listVendors(){ return Array.from(db.vendors.values()) }
export function addVendorInvoice(inv){ const id = inv.id || randomUUID(); const rec = { id, status:'pending', ...inv }; db.vendor_invoices.set(id, rec); return rec }
export function listVendorInvoices(filter={}){ const all = Array.from(db.vendor_invoices.values()); return all.filter(i => (!filter.vendor_id || i.vendor_id===filter.vendor_id) && (!filter.status || i.status===filter.status)) }
export function markInvoicePaid(invoice_id){ const inv = db.vendor_invoices.get(invoice_id); if (!inv) return null; inv.status='paid'; db.vendor_invoices.set(invoice_id, inv); return inv }
export function addVendorPayment(p){ const id = p.id || randomUUID(); const rec = { id, status:'queued', paid_at:null, method:'ach', ...p }; db.vendor_payments.set(id, rec); return rec }
export function listVendorPayments(filter={}){ const all = Array.from(db.vendor_payments.values()); return all.filter(p => (!filter.vendor_id || p.vendor_id===filter.vendor_id) && (!filter.status || p.status===filter.status)) }
export const __db = db
