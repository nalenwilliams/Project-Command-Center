import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import api from '../lib/api'
import { FileText, Download, Search, Calendar, DollarSign, TrendingUp, Eye } from 'lucide-react'

const MyPayrollDocumentsPage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [paystubs, setPaystubs] = useState([])
  const [taxDocuments, setTaxDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [ytdSummary, setYtdSummary] = useState({
    gross: 0,
    net: 0,
    taxes: 0,
    deductions: 0
  })

  const isEmployee = user?.role === 'employee' || user?.role === 'manager' || user?.role === 'admin'

  useEffect(() => {
    if (isEmployee) {
      fetchPayrollDocuments()
    }
  }, [selectedYear])

  const fetchPayrollDocuments = async () => {
    try {
      setLoading(true)
      // Fetch paystubs
      const paystubsResponse = await api.get('/employee/paystubs', {
        params: { year: selectedYear }
      })
      setPaystubs(paystubsResponse.data || [])
      
      // Fetch tax documents
      const taxDocsResponse = await api.get('/employee/tax-documents')
      setTaxDocuments(taxDocsResponse.data || [])
      
      // Fetch YTD summary
      const ytdResponse = await api.get('/employee/ytd-summary', {
        params: { year: selectedYear }
      })
      setYtdSummary(ytdResponse.data || ytdSummary)
    } catch (error) {
      console.error('Error fetching payroll documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPaystubs = paystubs.filter(stub => 
    stub.pay_period.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stub.pay_date.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const availableYears = Array.from(
    new Set(paystubs.map(stub => new Date(stub.pay_date).getFullYear()))
  ).sort((a, b) => b - a)

  if (!isEmployee) {
    return (
      <div className="p-6">
        <Card className="border-yellow-500/30">
          <CardContent className="p-6">
            <p className="text-center text-gray-300">
              This section is only available to employees.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Payroll Documents</h1>
          <p className="text-gray-400">View paystubs, tax documents, and earnings summary</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
          >
            {availableYears.length > 0 ? (
              availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))
            ) : (
              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            )}
          </select>
        </div>
      </div>

      {/* YTD Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">YTD Gross Pay</p>
                <p className="text-2xl font-bold text-white">${ytdSummary.gross.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">YTD Net Pay</p>
                <p className="text-2xl font-bold text-white">${ytdSummary.net.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">YTD Taxes</p>
                <p className="text-2xl font-bold text-white">${ytdSummary.taxes.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Paystubs</p>
                <p className="text-2xl font-bold text-white">{paystubs.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="bg-black border-yellow-500/30">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by pay period or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Paystubs List */}
      <Card className="bg-black border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-white">Paystubs - {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-400 py-8">Loading paystubs...</p>
          ) : filteredPaystubs.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              {searchTerm ? 'No paystubs match your search.' : 'No paystubs available for this year.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 p-3">Pay Period</th>
                    <th className="text-left text-gray-400 p-3">Pay Date</th>
                    <th className="text-left text-gray-400 p-3">Gross Pay</th>
                    <th className="text-left text-gray-400 p-3">Deductions</th>
                    <th className="text-left text-gray-400 p-3">Net Pay</th>
                    <th className="text-left text-gray-400 p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPaystubs.map((stub) => (
                    <tr key={stub.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                      <td className="p-3 text-white">{stub.pay_period}</td>
                      <td className="p-3 text-gray-300">{new Date(stub.pay_date).toLocaleDateString()}</td>
                      <td className="p-3 text-gray-300">${stub.gross_pay.toLocaleString()}</td>
                      <td className="p-3 text-gray-300">${stub.deductions.toLocaleString()}</td>
                      <td className="p-3 text-white font-semibold">${stub.net_pay.toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(stub.file_url, '_blank')}
                            className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                          >
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = stub.file_url
                              link.download = `paystub_${stub.pay_period.replace(/\//g, '-')}.pdf`
                              link.click()
                            }}
                            className="text-green-400 border-green-400 hover:bg-green-400/10"
                          >
                            <Download className="h-3 w-3 mr-1" /> Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Documents */}
      <Card className="bg-black border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-white">Tax Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {taxDocuments.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No tax documents available yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taxDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 border border-gray-700 rounded-lg hover:border-yellow-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-semibold">{doc.document_type}</p>
                      <p className="text-sm text-gray-400">{doc.tax_year}</p>
                    </div>
                    <FileText className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(doc.file_url, '_blank')}
                      className="flex-1 text-blue-400 border-blue-400 hover:bg-blue-400/10"
                    >
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = doc.file_url
                        link.download = `${doc.document_type}_${doc.tax_year}.pdf`
                        link.click()
                      }}
                      className="flex-1 text-green-400 border-green-400 hover:bg-green-400/10"
                    >
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Direct Deposit Info */}
      <Card className="bg-black border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-white">Direct Deposit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-900 rounded">
              <span className="text-gray-400">Account Type:</span>
              <span className="text-white font-semibold">Checking</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-900 rounded">
              <span className="text-gray-400">Account Ending In:</span>
              <span className="text-white font-semibold">****4567</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-900 rounded">
              <span className="text-gray-400">Bank:</span>
              <span className="text-white font-semibold">First National Bank</span>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              To update your direct deposit information, please contact HR.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MyPayrollDocumentsPage
