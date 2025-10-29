import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import api from '../lib/api'
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react'

const VendorProfileCompletionPage = () => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    // Step 1: Password Change
    current_password: '',
    new_password: '',
    confirm_password: '',
    
    // Step 2: Company Details
    ein: '',
    business_type: 'LLC',
    address: '',
    city: '',
    state: 'OK',
    zip: '',
    
    // Step 3: Insurance
    insurance_provider: '',
    policy_number: '',
    insurance_amount: '',
    insurance_expiry: '',
    
    // Step 4: Banking
    bank_name: '',
    account_type: 'checking',
    routing_number: '',
    account_number: '',
    
    // Step 5: Documents
    w9_file: null,
    coi_file: null,
    license_file: null,
    
    // Step 6: Legal
    nda_accepted: false,
    terms_accepted: false,
    signature: ''
  })

  const steps = [
    { number: 1, title: 'Change Password', icon: <Lock className="h-5 w-5" /> },
    { number: 2, title: 'Company Details', icon: '🏢' },
    { number: 3, title: 'Insurance Info', icon: '🛡️' },
    { number: 4, title: 'Banking Info', icon: '🏦' },
    { number: 5, title: 'Upload Documents', icon: '📄' },
    { number: 6, title: 'Legal Agreements', icon: '📋' }
  ]

  const handleFileChange = (field, file) => {
    setFormData({ ...formData, [field]: file })
  }

  const handleNext = () => {
    if (currentStep < 6) {
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
      const formDataToSend = new FormData()
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key.includes('_file')) {
          if (formData[key]) {
            formDataToSend.append(key, formData[key])
          }
        } else if (typeof formData[key] === 'boolean') {
          formDataToSend.append(key, formData[key] ? 'true' : 'false')
        } else if (formData[key]) {
          formDataToSend.append(key, formData[key])
        }
      })
      
      await api.post('/vendor/complete-profile', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      alert('Profile completed successfully! Welcome to Williams Diversified LLC Vendor Portal.')
      
      // Update user in localStorage
      const updatedUser = { ...user, profile_completed: true }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      window.location.href = '/'
    } catch (error) {
      console.error('Profile completion error:', error)
      alert('Error completing profile: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header with Logo */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="text-center mb-8">
          <img 
            src="/williams-logo.png" 
            alt="Williams Diversified LLC" 
            className="h-20 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-yellow-600 mb-2">Complete Your Vendor Profile</h1>
          <p className="text-gray-400">Welcome {user.first_name} {user.last_name}! Please complete your profile to access the vendor portal.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex flex-col items-center flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2 ${
                currentStep >= step.number
                  ? 'bg-yellow-600 text-black'
                  : 'bg-gray-800 text-gray-400'
              }`}>
                {typeof step.icon === 'string' ? step.icon : step.icon}
              </div>
              <span className={`text-xs text-center ${
                currentStep >= step.number ? 'text-yellow-600' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`h-1 w-full mt-6 ${
                  currentStep > step.number ? 'bg-yellow-600' : 'bg-gray-800'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="bg-gray-900 border-yellow-600/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              Step {currentStep} of 6: {steps[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Step 1: Password Change */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4 mb-4">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-yellow-300 text-sm">
                      For security reasons, you must change your temporary password before proceeding.
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Current Password (Temporary) *</Label>
                  <Input
                    type="password"
                    required
                    value={formData.current_password}
                    onChange={(e) => setFormData({...formData, current_password: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">New Password *</Label>
                  <Input
                    type="password"
                    required
                    value={formData.new_password}
                    onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters, include letters and numbers</p>
                </div>
                <div>
                  <Label className="text-gray-300">Confirm New Password *</Label>
                  <Input
                    type="password"
                    required
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Company Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">EIN (Tax ID) *</Label>
                  <Input
                    required
                    value={formData.ein}
                    onChange={(e) => setFormData({...formData, ein: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="12-3456789"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Business Type *</Label>
                  <select
                    required
                    value={formData.business_type}
                    onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-md"
                  >
                    <option value="LLC">LLC</option>
                    <option value="Corporation">Corporation</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Sole Proprietor">Sole Proprietor</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-300">Street Address *</Label>
                  <Input
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-300">City *</Label>
                    <Input
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">State *</Label>
                    <Input
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="bg-gray-900 border-gray-700 text-white"
                      maxLength="2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">ZIP *</Label>
                    <Input
                      required
                      value={formData.zip}
                      onChange={(e) => setFormData({...formData, zip: e.target.value})}
                      className="bg-gray-900 border-gray-700 text-white"
                      maxLength="5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Insurance Info */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Insurance Provider *</Label>
                  <Input
                    required
                    value={formData.insurance_provider}
                    onChange={(e) => setFormData({...formData, insurance_provider: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Policy Number *</Label>
                  <Input
                    required
                    value={formData.policy_number}
                    onChange={(e) => setFormData({...formData, policy_number: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Coverage Amount *</Label>
                  <Input
                    type="number"
                    required
                    value={formData.insurance_amount}
                    onChange={(e) => setFormData({...formData, insurance_amount: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Expiration Date *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.insurance_expiry}
                    onChange={(e) => setFormData({...formData, insurance_expiry: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Banking Info */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4 mb-4">
                  <p className="text-blue-300 text-sm">
                    🔒 Your banking information is encrypted and secure. This information is used for payment processing only.
                  </p>
                </div>
                <div>
                  <Label className="text-gray-300">Bank Name *</Label>
                  <Input
                    required
                    value={formData.bank_name}
                    onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Account Type *</Label>
                  <select
                    required
                    value={formData.account_type}
                    onChange={(e) => setFormData({...formData, account_type: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-md"
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
                    onChange={(e) => setFormData({...formData, routing_number: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                    maxLength="9"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Account Number *</Label>
                  <Input
                    required
                    value={formData.account_number}
                    onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Upload Documents */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="bg-purple-900/20 border border-purple-500/30 rounded p-4 mb-4">
                  <p className="text-purple-300 text-sm">
                    Upload required documents. All files must be in PDF format.
                  </p>
                </div>
                <div>
                  <Label className="text-gray-300">W-9 Form *</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange('w9_file', e.target.files[0])}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  {formData.w9_file && (
                    <p className="text-xs text-green-400 mt-1">
                      ✓ File attached: {formData.w9_file.name}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-300">Certificate of Insurance (COI) *</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange('coi_file', e.target.files[0])}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  {formData.coi_file && (
                    <p className="text-xs text-green-400 mt-1">
                      ✓ File attached: {formData.coi_file.name}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-300">Business License (optional)</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange('license_file', e.target.files[0])}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  {formData.license_file && (
                    <p className="text-xs text-green-400 mt-1">
                      ✓ File attached: {formData.license_file.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Legal Agreements */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="bg-gray-800 border border-gray-700 rounded p-4 max-h-64 overflow-y-auto">
                  <h3 className="text-yellow-600 font-bold mb-2">Non-Disclosure Agreement (NDA)</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    This Agreement is entered into between Williams Diversified LLC and the Vendor...
                    [NDA content would be here in production]
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.nda_accepted}
                    onChange={(e) => setFormData({...formData, nda_accepted: e.target.checked})}
                    className="h-4 w-4"
                  />
                  <Label className="text-gray-300">I have read and agree to the NDA *</Label>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded p-4 max-h-64 overflow-y-auto">
                  <h3 className="text-yellow-600 font-bold mb-2">Terms of Service</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    By using the Williams Diversified LLC Vendor Portal, you agree to...
                    [Terms content would be here in production]
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.terms_accepted}
                    onChange={(e) => setFormData({...formData, terms_accepted: e.target.checked})}
                    className="h-4 w-4"
                  />
                  <Label className="text-gray-300">I agree to the Terms of Service *</Label>
                </div>

                <div>
                  <Label className="text-gray-300">Electronic Signature *</Label>
                  <Input
                    required
                    value={formData.signature}
                    onChange={(e) => setFormData({...formData, signature: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="Type your full name"
                  />
                  <p className="text-xs text-gray-500 mt-1">By typing your name, you agree this constitutes a legal signature</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 mt-6 border-t border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="bg-gray-800 text-white hover:bg-gray-700"
              >
                Back
              </Button>
              {currentStep < 6 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-yellow-600 hover:bg-yellow-700 text-black"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? 'Submitting...' : 'Complete Profile'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default VendorProfileCompletionPage
