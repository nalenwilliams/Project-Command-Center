import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import api from '../lib/api'
import { CheckCircle, ArrowRight, ArrowLeft, Loader, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const EmployeeOnboardingPage = () => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [aiAssisting, setAiAssisting] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    // Personal Info
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    ssn: '',
    date_of_birth: '',
    
    // Job Info
    job_title: '',
    department: '',
    start_date: '',
    classification: '',
    hourly_rate: '',
    davis_bacon_certified: false,
    
    // W-4 Tax Info
    filing_status: '',
    dependents: '',
    extra_withholding: '',
    
    // Direct Deposit
    bank_name: '',
    account_type: 'checking',
    routing_number: '',
    account_number: '',
    
    // NDA Agreement
    nda_accepted: false,
    signature: ''
  })

  const steps = [
    { number: 1, title: 'Personal Information', desc: 'Basic details' },
    { number: 2, title: 'Employment Details', desc: 'Job & compensation' },
    { number: 3, title: 'Tax Information (W-4)', desc: 'Federal withholding' },
    { number: 4, title: 'Direct Deposit', desc: 'Banking information' },
    { number: 5, title: 'Legal Documents', desc: 'NDA & agreements' },
    { number: 6, title: 'Review & Submit', desc: 'Confirm all details' }
  ]

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleAiAssist = async (section) => {
    setAiAssisting(true)
    try {
      const response = await api.post('/ai/form-assist', {
        section: section,
        current_data: formData,
        form_type: 'employee_onboarding'
      })
      
      if (response.data.suggestions) {
        setFormData({ ...formData, ...response.data.suggestions })
      }
    } catch (error) {
      console.error('AI assist error:', error)
    } finally {
      setAiAssisting(false)
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await api.post('/employee/complete-onboarding', formData)
      
      // Update user data in localStorage to mark onboarding as completed
      const updatedUser = {
        ...user,
        onboarding_completed: true,
        first_name: formData.first_name,
        last_name: formData.last_name
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      alert('Onboarding completed successfully! Welcome to Williams Diversified LLC.')
      
      // Use window.location.href for a full page reload to ensure all components re-render
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('Error completing onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Employee Onboarding</h1>
          <p className="text-gray-400">Welcome to Williams Diversified LLC</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStep > step.number 
                    ? 'bg-green-600 border-green-600' 
                    : currentStep === step.number 
                    ? 'bg-yellow-600 border-yellow-600' 
                    : 'bg-gray-800 border-gray-600'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : (
                    <span className="text-white font-semibold">{step.number}</span>
                  )}
                </div>
                <div className="text-xs mt-2 text-center">
                  <p className="text-white font-semibold">{step.title}</p>
                  <p className="text-gray-500">{step.desc}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 w-full mt-5 ${currentStep > step.number ? 'bg-green-600' : 'bg-gray-700'}`} 
                       style={{position: 'absolute', left: '50%', width: '100%', zIndex: -1}} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card className="bg-black border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>{steps[currentStep - 1].title}</span>
              {currentStep <= 4 && (
                <Button
                  size="sm"
                  onClick={() => handleAiAssist(steps[currentStep - 1].title)}
                  disabled={aiAssisting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {aiAssisting ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  AI Assist
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">First Name *</Label>
                    <Input
                      required
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Last Name *</Label>
                    <Input
                      required
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Email *</Label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Phone *</Label>
                    <Input
                      required
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Address *</Label>
                  <Input
                    required
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-300">City *</Label>
                    <Input
                      required
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">State *</Label>
                    <Input
                      required
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="OK"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">ZIP *</Label>
                    <Input
                      required
                      value={formData.zip}
                      onChange={(e) => handleInputChange('zip', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Social Security Number *</Label>
                    <Input
                      required
                      value={formData.ssn}
                      onChange={(e) => handleInputChange('ssn', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="XXX-XX-XXXX"
                      type="password"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Date of Birth *</Label>
                    <Input
                      type="date"
                      required
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Employment Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Job Title *</Label>
                    <Input
                      required
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="e.g., Carpenter, Electrician"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Department</Label>
                    <Input
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Start Date *</Label>
                    <Input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Classification *</Label>
                    <select
                      required
                      value={formData.classification}
                      onChange={(e) => handleInputChange('classification', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                    >
                      <option value="">Select classification</option>
                      <option value="carpenter">Carpenter</option>
                      <option value="electrician">Electrician</option>
                      <option value="plumber">Plumber</option>
                      <option value="laborer">Laborer</option>
                      <option value="foreman">Foreman</option>
                      <option value="admin">Administrative</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Hourly Rate *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={formData.hourly_rate}
                    onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="25.00"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="davis_bacon"
                    checked={formData.davis_bacon_certified}
                    onChange={(e) => handleInputChange('davis_bacon_certified', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="davis_bacon" className="text-gray-300">
                    I am Davis-Bacon certified
                  </Label>
                </div>
              </div>
            )}

            {/* Step 3: W-4 Tax Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4 mb-4">
                  <p className="text-blue-300 text-sm">
                    <strong>W-4 Form:</strong> This information determines how much federal income tax is withheld from your paycheck.
                  </p>
                </div>
                <div>
                  <Label className="text-gray-300">Filing Status *</Label>
                  <select
                    required
                    value={formData.filing_status}
                    onChange={(e) => handleInputChange('filing_status', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                  >
                    <option value="">Select filing status</option>
                    <option value="single">Single</option>
                    <option value="married_joint">Married Filing Jointly</option>
                    <option value="married_separate">Married Filing Separately</option>
                    <option value="head_of_household">Head of Household</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-300">Number of Dependents</Label>
                  <Input
                    type="number"
                    value={formData.dependents}
                    onChange={(e) => handleInputChange('dependents', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Extra Withholding (per paycheck)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.extra_withholding}
                    onChange={(e) => handleInputChange('extra_withholding', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: Additional amount to withhold per paycheck</p>
                </div>
              </div>
            )}

            {/* Step 4: Direct Deposit */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="bg-green-900/20 border border-green-500/30 rounded p-4 mb-4">
                  <p className="text-green-300 text-sm">
                    <strong>Direct Deposit:</strong> Your paychecks will be automatically deposited into your bank account.
                  </p>
                </div>
                <div>
                  <Label className="text-gray-300">Bank Name *</Label>
                  <Input
                    required
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="First National Bank"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Account Type *</Label>
                  <select
                    required
                    value={formData.account_type}
                    onChange={(e) => handleInputChange('account_type', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-300">Routing Number *</Label>
                  <Input
                    required
                    value={formData.routing_number}
                    onChange={(e) => handleInputChange('routing_number', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="123456789"
                    maxLength={9}
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Account Number *</Label>
                  <Input
                    required
                    value={formData.account_number}
                    onChange={(e) => handleInputChange('account_number', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    type="password"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Legal Documents */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4 mb-4">
                  <h3 className="text-yellow-300 font-semibold mb-2">Non-Disclosure Agreement (NDA)</h3>
                  <div className="text-gray-300 text-sm space-y-2 max-h-64 overflow-y-auto">
                    <p>This Non-Disclosure Agreement ("Agreement") is entered into by Williams Diversified LLC ("Company") and the undersigned employee.</p>
                    <p><strong>1. Confidential Information:</strong> Employee acknowledges that during employment, they may have access to confidential and proprietary information including but not limited to: business strategies, client lists, financial information, project details, and trade secrets.</p>
                    <p><strong>2. Obligations:</strong> Employee agrees to:</p>
                    <ul className="list-disc ml-6">
                      <li>Keep all confidential information strictly confidential</li>
                      <li>Not disclose any confidential information to third parties</li>
                      <li>Use confidential information only for authorized company business</li>
                      <li>Return all confidential materials upon termination</li>
                    </ul>
                    <p><strong>3. Duration:</strong> This obligation continues during and after employment.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="nda_accepted"
                    checked={formData.nda_accepted}
                    onChange={(e) => handleInputChange('nda_accepted', e.target.checked)}
                    className="h-4 w-4 mt-1"
                    required
                  />
                  <Label htmlFor="nda_accepted" className="text-gray-300">
                    I have read and agree to the terms of the Non-Disclosure Agreement *
                  </Label>
                </div>
                <div>
                  <Label className="text-gray-300">Electronic Signature *</Label>
                  <Input
                    required
                    value={formData.signature}
                    onChange={(e) => handleInputChange('signature', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="Type your full name"
                  />
                  <p className="text-xs text-gray-500 mt-1">By typing your name, you agree to sign this document electronically</p>
                </div>
              </div>
            )}

            {/* Step 6: Review & Submit */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="bg-green-900/20 border border-green-500/30 rounded p-4">
                  <h3 className="text-green-300 font-semibold mb-2">Ready to Submit!</h3>
                  <p className="text-gray-300 text-sm">Please review your information before submitting.</p>
                </div>
                
                {/* Summary sections */}
                <div className="space-y-4">
                  <div className="border border-gray-700 rounded p-4">
                    <h4 className="text-white font-semibold mb-2">Personal Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-400">Name:</p>
                      <p className="text-white">{formData.first_name} {formData.last_name}</p>
                      <p className="text-gray-400">Email:</p>
                      <p className="text-white">{formData.email}</p>
                      <p className="text-gray-400">Phone:</p>
                      <p className="text-white">{formData.phone}</p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-700 rounded p-4">
                    <h4 className="text-white font-semibold mb-2">Employment</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-400">Position:</p>
                      <p className="text-white">{formData.job_title}</p>
                      <p className="text-gray-400">Classification:</p>
                      <p className="text-white">{formData.classification}</p>
                      <p className="text-gray-400">Hourly Rate:</p>
                      <p className="text-white">${formData.hourly_rate}/hr</p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-700 rounded p-4">
                    <h4 className="text-white font-semibold mb-2">Direct Deposit</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-400">Bank:</p>
                      <p className="text-white">{formData.bank_name}</p>
                      <p className="text-gray-400">Account Type:</p>
                      <p className="text-white">{formData.account_type}</p>
                      <p className="text-gray-400">Routing Number:</p>
                      <p className="text-white">{formData.routing_number}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                onClick={handleBack}
                disabled={currentStep === 1}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              
              {currentStep < steps.length ? (
                <Button
                  onClick={handleNext}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.nda_accepted}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Onboarding
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default EmployeeOnboardingPage
