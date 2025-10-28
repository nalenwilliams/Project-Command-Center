import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import api from '../lib/api'
import { Plus, Upload, DollarSign, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const VendorPortalPage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [vendors, setVendors] = useState([])
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showVendorDialog, setShowVendorDialog] = useState(false)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [vendorForm, setVendorForm] = useState({
    company_name: '',
    email: '',
    phone: '',
    contact_first_name: '',
    contact_last_name: '',
    business_type: 'LLC',
    address: '',
    city: '',
    state: 'OK',
    zip: ''
  })
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '',
    amount: '',
    description: '',
    invoice_date: '',
    due_date: ''
  })

  const isVendor = user?.role === 'vendor'
  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch invoices
      const invoicesResponse = await api.get('/vendor/invoices')
      setInvoices(invoicesResponse.data || [])
      
      // Fetch payments
      const paymentsResponse = await api.get('/vendor/payments')
      setPayments(paymentsResponse.data || [])
      
      // Fetch vendors (admin only)
      if (isAdmin) {
        const vendorsResponse = await api.get('/vendors')
        setVendors(Array.isArray(vendorsResponse.data) ? vendorsResponse.data : [vendorsResponse.data])
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVendor = async (e) => {
    e.preventDefault()
    try {
      // Create vendor directly without invitation code
      const response = await api.post('/vendors/create-direct', vendorForm)
      setShowVendorDialog(false)
      setVendorForm({
        company_name: '',
        email: '',
        phone: '',
        contact_first_name: '',
        contact_last_name: '',
        business_type: 'LLC',
        address: '',
        city: '',
        state: 'OK',
        zip: ''
      })
      
      alert(`Vendor created successfully!\n\nLogin Credentials:\nUsername: ${response.data.username}\nEmail: ${response.data.email}\nTemporary Password: ${response.data.temp_password}\n\nPlease provide these credentials to the vendor.`)
      fetchData()
    } catch (error) {
      console.error('Error creating vendor:', error)
      alert('Error creating vendor: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleSubmitInvoice = async (e) => {
    e.preventDefault()
    try {
      await api.post('/vendor/invoices', invoiceForm)
      setShowInvoiceDialog(false)
      setInvoiceForm({
        invoice_number: '',
        amount: '',
        description: '',
        invoice_date: '',
        due_date: ''
      })
      fetchData()
    } catch (error) {
      console.error('Error submitting invoice:', error)
      alert('Error submitting invoice. Please try again.')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-600/20', text: 'text-yellow-400', label: 'Pending' },
      approved: { bg: 'bg-blue-600/20', text: 'text-blue-400', label: 'Approved' },
      paid: { bg: 'bg-green-600/20', text: 'text-green-400', label: 'Paid' },
      rejected: { bg: 'bg-red-600/20', text: 'text-red-400', label: 'Rejected' }
    }
    const badge = badges[status] || badges.pending
    return (
      <span className={`px-2 py-1 ${badge.bg} ${badge.text} rounded text-xs`}>
        {badge.label}
      </span>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isVendor ? 'Vendor Portal' : 'Vendor Management'}
          </h1>
          <p className="text-gray-400">
            {isVendor 
              ? 'Submit invoices, track payments, and manage your vendor profile' 
              : 'Williams Diversified LLC - Vendor & Invoice Management'}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
              <DialogTrigger asChild>
                <Button className="bg-yellow-600 hover:bg-yellow-700">
                  <Plus className="mr-2 h-4 w-4" /> Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-black border-yellow-500/30">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Vendor</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateVendor} className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Vendor Name *</Label>
                    <Input
                      required
                      value={vendorForm.name}
                      onChange={(e) => setVendorForm({...vendorForm, name: e.target.value})}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="Company Name"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Email *</Label>
                    <Input
                      type="email"
                      required
                      value={vendorForm.email}
                      onChange={(e) => setVendorForm({...vendorForm, email: e.target.value})}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="vendor@company.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">Invitation code will be sent to this email</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Phone Number</Label>
                    <Input
                      value={vendorForm.phone}
                      onChange={(e) => setVendorForm({...vendorForm, phone: e.target.value})}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4">
                    <p className="text-sm text-blue-300">
                      <strong>Note:</strong> The vendor will receive an email invitation to complete their profile. 
                      They will provide additional information like EIN, W-9, insurance, and other documents during onboarding.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowVendorDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700">
                      Send Invitation
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
          
          <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Upload className="mr-2 h-4 w-4" /> Submit Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-black border-yellow-500/30">
              <DialogHeader>
                <DialogTitle className="text-white">Submit New Invoice</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitInvoice} className="space-y-4">
                <div>
                  <Label className="text-gray-300">Invoice Number *</Label>
                  <Input
                    required
                    value={invoiceForm.invoice_number}
                    onChange={(e) => setInvoiceForm({...invoiceForm, invoice_number: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({...invoiceForm, amount: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Description *</Label>
                  <Textarea
                    required
                    value={invoiceForm.description}
                    onChange={(e) => setInvoiceForm({...invoiceForm, description: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Invoice Date *</Label>
                    <Input
                      type="date"
                      required
                      value={invoiceForm.invoice_date}
                      onChange={(e) => setInvoiceForm({...invoiceForm, invoice_date: e.target.value})}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Due Date *</Label>
                    <Input
                      type="date"
                      required
                      value={invoiceForm.due_date}
                      onChange={(e) => setInvoiceForm({...invoiceForm, due_date: e.target.value})}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowInvoiceDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Submit Invoice
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isAdmin && (
          <Card className="bg-black border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Vendors</p>
                  <p className="text-2xl font-bold text-white">{vendors.length}</p>
                </div>
                <FileText className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="bg-black border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Invoices</p>
                <p className="text-2xl font-bold text-white">{invoices.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-white">
                  {invoices.filter(i => i.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Paid</p>
                <p className="text-2xl font-bold text-white">
                  {invoices.filter(i => i.status === 'paid').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Card className="bg-black border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-white">
            {isVendor ? 'My Invoices' : 'Vendor Invoices'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-400 py-8">Loading invoices...</p>
          ) : invoices.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              No invoices yet. Click "Submit Invoice" to create one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 p-3">Invoice #</th>
                    <th className="text-left text-gray-400 p-3">Date</th>
                    <th className="text-left text-gray-400 p-3">Description</th>
                    <th className="text-left text-gray-400 p-3">Amount</th>
                    <th className="text-left text-gray-400 p-3">Status</th>
                    <th className="text-left text-gray-400 p-3">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                      <td className="p-3 text-white">{invoice.invoice_number}</td>
                      <td className="p-3 text-gray-300">{invoice.invoice_date}</td>
                      <td className="p-3 text-gray-300">{invoice.description}</td>
                      <td className="p-3 text-white font-semibold">${invoice.amount}</td>
                      <td className="p-3">{getStatusBadge(invoice.status)}</td>
                      <td className="p-3 text-gray-300">{invoice.due_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="bg-black border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-white">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No payment history yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 p-3">Payment Date</th>
                    <th className="text-left text-gray-400 p-3">Amount</th>
                    <th className="text-left text-gray-400 p-3">Method</th>
                    <th className="text-left text-gray-400 p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                      <td className="p-3 text-gray-300">{payment.paid_at || 'Pending'}</td>
                      <td className="p-3 text-white font-semibold">${payment.amount}</td>
                      <td className="p-3 text-gray-300">{payment.method.toUpperCase()}</td>
                      <td className="p-3">{getStatusBadge(payment.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendor List (Admin Only) */}
      {isAdmin && (
        <Card className="bg-black border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-white">Registered Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            {vendors.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                No vendors registered yet. Click "Add Vendor" to create one.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-400 p-3">Name</th>
                      <th className="text-left text-gray-400 p-3">Email</th>
                      <th className="text-left text-gray-400 p-3">EIN</th>
                      <th className="text-left text-gray-400 p-3">W-9</th>
                      <th className="text-left text-gray-400 p-3">Insurance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((vendor) => (
                      <tr key={vendor.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                        <td className="p-3 text-white">{vendor.name}</td>
                        <td className="p-3 text-gray-300">{vendor.email}</td>
                        <td className="p-3 text-gray-300">{vendor.ein}</td>
                        <td className="p-3">
                          {vendor.w9_on_file ? (
                            <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">On File</span>
                          ) : (
                            <span className="px-2 py-1 bg-orange-600/20 text-orange-400 rounded text-xs">Missing</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-300">
                          {vendor.insurance_expires || 'Not provided'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default VendorPortalPage
