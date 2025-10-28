import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import api from '../lib/api'
import { Plus, DollarSign, Users, FileText, CheckCircle, AlertCircle } from 'lucide-react'

const PayrollPage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [employees, setEmployees] = useState([])
  const [payrollRuns, setPayrollRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRunDialog, setShowRunDialog] = useState(false)
  const [runForm, setRunForm] = useState({
    week_ending: ''
  })

  // Check if user has payroll access
  const hasPayrollAccess = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    if (hasPayrollAccess) {
      fetchEmployees()
    }
  }, [hasPayrollAccess])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await api.get('/payroll/employees')
      setEmployees(response.data || [])
    } catch (error) {
      console.error('Error fetching payroll employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePayrollRun = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('/payroll/run', runForm)
      setShowRunDialog(false)
      setRunForm({ week_ending: '' })
      alert(`Payroll run created successfully! Run ID: ${response.data.id}`)
    } catch (error) {
      console.error('Error creating payroll run:', error)
      alert('Error creating payroll run. Please try again.')
    }
  }

  if (!hasPayrollAccess) {
    return (
      <div className="p-6">
        <Card className="border-yellow-500/30">
          <CardContent className="p-6">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-center text-gray-300">
              You do not have access to the Payroll system. This area is restricted to HR and Admin users.
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
          <h1 className="text-3xl font-bold text-white mb-2">Payroll Management</h1>
          <p className="text-gray-400">Williams Diversified LLC - Certified Payroll & Payment Processing</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <DollarSign className="mr-2 h-4 w-4" /> New Payroll Run
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black border-yellow-500/30">
              <DialogHeader>
                <DialogTitle className="text-white">Create Payroll Run</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePayrollRun} className="space-y-4">
                <div>
                  <Label className="text-gray-300">Week Ending Date *</Label>
                  <Input
                    type="date"
                    required
                    value={runForm.week_ending}
                    onChange={(e) => setRunForm({...runForm, week_ending: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowRunDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Create Run
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Employees</p>
                <p className="text-2xl font-bold text-white">{employees.length}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Runs</p>
                <p className="text-2xl font-bold text-white">{payrollRuns.length}</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Davis-Bacon</p>
                <p className="text-2xl font-bold text-white">{employees.filter(e => e.davis_bacon).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending Approval</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees List */}
      <Card className="bg-black border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-white">Payroll Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-400 py-8">Loading employees...</p>
          ) : employees.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              No payroll employees yet. Employees will appear here after completing self-onboarding.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 p-3">Name</th>
                    <th className="text-left text-gray-400 p-3">Classification</th>
                    <th className="text-left text-gray-400 p-3">Base Rate</th>
                    <th className="text-left text-gray-400 p-3">Fringe</th>
                    <th className="text-left text-gray-400 p-3">DB Certified</th>
                    <th className="text-left text-gray-400 p-3">Direct Deposit</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                      <td className="p-3 text-white">
                        {emp.first_name} {emp.last_name}
                      </td>
                      <td className="p-3 text-gray-300">{emp.classification}</td>
                      <td className="p-3 text-gray-300">${emp.base_rate}/hr</td>
                      <td className="p-3 text-gray-300">${emp.fringe_rate || '0.00'}/hr</td>
                      <td className="p-3">
                        {emp.davis_bacon ? (
                          <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">Yes</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs">No</span>
                        )}
                      </td>
                      <td className="p-3">
                        {emp.routing_number ? (
                          <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Setup</span>
                        ) : (
                          <span className="px-2 py-1 bg-orange-600/20 text-orange-400 rounded text-xs">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coming Soon Features */}
      <Card className="bg-black border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-white">Payroll Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-700 rounded-lg">
              <FileText className="h-8 w-8 text-yellow-500 mb-2" />
              <h3 className="text-white font-semibold mb-1">WH-347 Forms</h3>
              <p className="text-sm text-gray-400">Generate certified payroll forms with AI assistance</p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="text-white font-semibold mb-1">Paystubs</h3>
              <p className="text-sm text-gray-400">Automated paystub generation with company branding</p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg">
              <CheckCircle className="h-8 w-8 text-blue-500 mb-2" />
              <h3 className="text-white font-semibold mb-1">Direct Deposit</h3>
              <p className="text-sm text-gray-400">Plaid integration for secure banking (Sandbox)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PayrollPage
