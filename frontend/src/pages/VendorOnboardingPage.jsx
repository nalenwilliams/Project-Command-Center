import React, { useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import api from '../lib/api'
import { CheckCircle, ArrowRight, ArrowLeft, Loader, Sparkles, Upload } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const VendorOnboardingPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const invitationCode = searchParams.get('code')
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [aiAssisting, setAiAssisting] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    // Company Info
    company_name: '',
    business_type: '',
    ein: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    
    // Contact Person
    contact_first_name: '',
    contact_last_name: '',
    contact_title: '',
    contact_email: '',
    contact_phone: '',
    
    // Insurance
    insurance_provider: '',
    policy_number: '',
    insurance_amount: '',
    insurance_expiry: '',
    
    // Banking
    bank_name: '',
    account_type: 'checking',
    routing_number: '',
    account_number: '',
    
    // Documents
    w9_file: null,
    coi_file: null,
    license_file: null,
    
    // Legal
    nda_accepted: false,
    terms_accepted: false,
    signature: ''
  })

  const steps = [
    { number: 1, title: 'Company Information', desc: 'Business details' },
    { number: 2, title: 'Contact Person', desc: 'Primary contact' },
    { number: 3, title: 'Insurance & Licensing', desc: 'COI & documents' },
    { number: 4, title: 'Banking Information', desc: 'Payment details' },
    { number: 5, title: 'Upload Documents', desc: 'W-9, COI, License' },
    { number: 6, title: 'Legal Agreements', desc: 'NDA & terms' },
    { number: 7, title: 'Review & Submit', desc: 'Confirm all details' }
  ]

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleFileChange = (field, file) => {
    setFormData({ ...formData, [field]: file })
  }

  const handleAiAssist = async (section) => {
    setAiAssisting(true)
    try {
      const response = await api.post('/ai/form-assist', {
        section: section,
        current_data: formData,
        form_type: 'vendor_onboarding'
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
      const formDataToSend = new FormData()
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key])
        }
      })
      formDataToSend.append('invitation_code', invitationCode)
      
      await api.post('/vendor/complete-onboarding', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      alert('Vendor onboarding completed successfully! Welcome to Williams Diversified LLC Vendor Portal.')
      navigate('/vendors')
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
          <h1 className="text-3xl font-bold text-white mb-2">Vendor Onboarding</h1>
          <p className="text-gray-400">Join the Williams Diversified LLC Vendor Network</p>
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
            {/* Step 1: Company Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Company Name *</Label>
                  <Input
                    required
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="ACME Construction LLC"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Business Type *</Label>
                    <select
                      required
                      value={formData.business_type}
                      onChange={(e) => handleInputChange('business_type', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                    >
                      <option value="">Select type</option>
                      <option value="llc">LLC</option>
                      <option value="corporation">Corporation</option>
                      <option value="partnership">Partnership</option>
                      <option value="sole_proprietor">Sole Proprietor</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-gray-300">EIN *</Label>
                    <Input
                      required
                      value={formData.ein}
                      onChange={(e) => handleInputChange('ein', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="XX-XXXXXXX"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div>
                  <Label className="text-gray-300">Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="https://www.yourcompany.com"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Business Address *</Label>
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
              </div>
            )}

            {/* Step 2: Contact Person */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4 mb-4">
                  <p className="text-blue-300 text-sm">
                    Primary contact person for vendor communications and invoicing.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">First Name *</Label>
                    <Input
                      required
                      value={formData.contact_first_name}
                      onChange={(e) => handleInputChange('contact_first_name', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Last Name *</Label>
                    <Input
                      required
                      value={formData.contact_last_name}
                      onChange={(e) => handleInputChange('contact_last_name', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Title/Position *</Label>
                  <Input
                    required
                    value={formData.contact_title}
                    onChange={(e) => handleInputChange('contact_title', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="e.g., Owner, Manager, Accounts Receivable"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Email *</Label>
                    <Input
                      type="email"
                      required
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Phone *</Label>
                    <Input
                      required
                      value={formData.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Insurance & Licensing */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4 mb-4">
                  <p className="text-yellow-300 text-sm">
                    <strong>Required:</strong> General liability insurance with minimum $1,000,000 coverage.
                  </p>
                </div>
                <div>
                  <Label className="text-gray-300">Insurance Provider *</Label>
                  <Input
                    required
                    value={formData.insurance_provider}
                    onChange={(e) => handleInputChange('insurance_provider', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="State Farm, Progressive, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Policy Number *</Label>
                    <Input
                      required
                      value={formData.policy_number}
                      onChange={(e) => handleInputChange('policy_number', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Coverage Amount *</Label>
                    <Input
                      required
                      value={formData.insurance_amount}
                      onChange={(e) => handleInputChange('insurance_amount', e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="$1,000,000"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Insurance Expiration Date *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.insurance_expiry}
                    onChange={(e) => handleInputChange('insurance_expiry', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Banking Information */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="bg-green-900/20 border border-green-500/30 rounded p-4 mb-4">
                  <p className="text-green-300 text-sm">
                    <strong>ACH Payments:</strong> Your payments will be directly deposited into this account.
                  </p>
                </div>
                <div>
                  <Label className="text-gray-300">Bank Name *</Label>
                  <Input
                    required
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
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
                    <option value="checking">Business Checking</option>
                    <option value="savings">Business Savings</option>
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
                  <p className="text-xs text-gray-500 mt-1">
                    <a href="https://www.irs.gov/pub/irs-pdf/fw9.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      Download blank W-9 form
                    </a>
                  </p>
                </div>
                <div>
                  <Label className="text-gray-300">Certificate of Insurance (COI) *</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange('coi_file', e.target.files[0])}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Business License (if applicable)</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange('license_file', e.target.files[0])}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>
            )}

            {/* Step 6: Legal Agreements */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4 mb-4">
                  <h3 className="text-yellow-300 font-semibold mb-2">Non-Disclosure Agreement (NDA)</h3>
                  <div className="text-gray-300 text-sm space-y-2 max-h-64 overflow-y-auto">
                    <p>This Non-Disclosure Agreement protects confidential business information shared during our vendor relationship.</p>
                    <p><strong>Vendor agrees to:</strong></p>
                    <ul className="list-disc ml-6">
                      <li>Keep all project details and business information confidential</li>
                      <li>Not disclose Williams Diversified LLC proprietary information</li>
                      <li>Use confidential information only for authorized work</li>
                      <li>Maintain security of all shared materials</li>
                    </ul>
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
                    I agree to the Non-Disclosure Agreement *
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms_accepted"
                    checked={formData.terms_accepted}
                    onChange={(e) => handleInputChange('terms_accepted', e.target.checked)}
                    className="h-4 w-4 mt-1"
                    required
                  />
                  <Label htmlFor="terms_accepted" className="text-gray-300">
                    I agree to vendor terms and payment conditions *
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
                  <p className="text-xs text-gray-500 mt-1">By typing your name, you agree to sign all documents electronically</p>
                </div>
              </div>
            )}

            {/* Step 7: Review & Submit */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="bg-green-900/20 border border-green-500/30 rounded p-4">
                  <h3 className="text-green-300 font-semibold mb-2">Ready to Submit!</h3>
                  <p className="text-gray-300 text-sm">Your vendor profile will be reviewed by our team.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="border border-gray-700 rounded p-4">
                    <h4 className="text-white font-semibold mb-2">Company Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-400">Company:</p>
                      <p className="text-white">{formData.company_name}</p>
                      <p className="text-gray-400">EIN:</p>
                      <p className="text-white">{formData.ein}</p>
                      <p className="text-gray-400">Type:</p>
                      <p className="text-white">{formData.business_type}</p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-700 rounded p-4">
                    <h4 className="text-white font-semibold mb-2">Contact</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-400">Name:</p>
                      <p className="text-white">{formData.contact_first_name} {formData.contact_last_name}</p>
                      <p className="text-gray-400">Email:</p>
                      <p className="text-white">{formData.contact_email}</p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-700 rounded p-4">
                    <h4 className="text-white font-semibold mb-2">Insurance</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-400">Provider:</p>
                      <p className="text-white">{formData.insurance_provider}</p>
                      <p className="text-gray-400">Coverage:</p>
                      <p className="text-white">{formData.insurance_amount}</p>
                      <p className="text-gray-400">Expires:</p>
                      <p className="text-white">{formData.insurance_expiry}</p>
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
                  disabled={loading || !formData.nda_accepted || !formData.terms_accepted}
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

export default VendorOnboardingPage
