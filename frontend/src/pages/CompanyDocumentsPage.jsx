import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import api from '../lib/api'
import { Upload, FileText, Download, Trash2, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react'

const CompanyDocumentsPage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    document_type: '',
    file: null,
    expiration_date: '',
    notes: ''
  })

  const isVendor = user?.role === 'vendor'

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/vendor/documents')
      setDocuments(response.data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    setUploadForm({ ...uploadForm, file: e.target.files[0] })
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append('document_type', uploadForm.document_type)
      formData.append('file', uploadForm.file)
      formData.append('expiration_date', uploadForm.expiration_date)
      formData.append('notes', uploadForm.notes)

      await api.post('/vendor/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setShowUploadDialog(false)
      setUploadForm({
        document_type: '',
        file: null,
        expiration_date: '',
        notes: ''
      })
      fetchDocuments()
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Error uploading document. Please try again.')
    }
  }

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return
    try {
      await api.delete(`/vendor/documents/${documentId}`)
      fetchDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Error deleting document. Please try again.')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-600/20', text: 'text-yellow-400', label: 'Pending Review', icon: Clock },
      approved: { bg: 'bg-green-600/20', text: 'text-green-400', label: 'Approved', icon: CheckCircle },
      rejected: { bg: 'bg-red-600/20', text: 'text-red-400', label: 'Rejected', icon: AlertCircle },
      expired: { bg: 'bg-orange-600/20', text: 'text-orange-400', label: 'Expired', icon: AlertCircle }
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    return (
      <span className={`px-2 py-1 ${badge.bg} ${badge.text} rounded text-xs flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    )
  }

  const documentTypes = [
    { value: 'w9', label: 'W-9 Form' },
    { value: 'coi', label: 'Certificate of Insurance (COI)' },
    { value: 'license', label: 'Business License' },
    { value: 'bond', label: 'Performance Bond' },
    { value: 'nda', label: 'Non-Disclosure Agreement' },
    { value: 'contract', label: 'Contract' },
    { value: 'other', label: 'Other' }
  ]

  if (!isVendor) {
    return (
      <div className="p-6">
        <Card className="border-yellow-500/30">
          <CardContent className="p-6">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-center text-gray-300">
              This section is only available to vendor accounts.
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
          <h1 className="text-3xl font-bold text-white mb-2">Company Documents</h1>
          <p className="text-gray-400">Manage your business documents, certifications, and insurance</p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              <Upload className="mr-2 h-4 w-4" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-black border-yellow-500/30">
            <DialogHeader>
              <DialogTitle className="text-white">Upload Company Document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label className="text-gray-300">Document Type *</Label>
                <select
                  required
                  value={uploadForm.document_type}
                  onChange={(e) => setUploadForm({...uploadForm, document_type: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                >
                  <option value="">Select document type</option>
                  {documentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-gray-300">Upload File *</Label>
                <Input
                  type="file"
                  required
                  onChange={handleFileChange}
                  className="bg-gray-900 border-gray-700 text-white"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
              </div>
              <div>
                <Label className="text-gray-300">Expiration Date (if applicable)</Label>
                <Input
                  type="date"
                  value={uploadForm.expiration_date}
                  onChange={(e) => setUploadForm({...uploadForm, expiration_date: e.target.value})}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Notes</Label>
                <Input
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="Additional information about this document"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700">
                  Upload Document
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Document Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Documents</p>
                <p className="text-2xl font-bold text-white">{documents.length}</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-white">
                  {documents.filter(d => d.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-white">
                  {documents.filter(d => d.status === 'pending').length}
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
                <p className="text-sm text-gray-400">Expiring Soon</p>
                <p className="text-2xl font-bold text-white">
                  {documents.filter(d => {
                    if (!d.expiration_date) return false
                    const daysUntilExpiry = Math.floor((new Date(d.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
                    return daysUntilExpiry > 0 && daysUntilExpiry <= 30
                  }).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card className="bg-black border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-white">My Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-400 py-8">Loading documents...</p>
          ) : documents.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              No documents uploaded yet. Click "Upload Document" to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 p-3">Document Type</th>
                    <th className="text-left text-gray-400 p-3">File Name</th>
                    <th className="text-left text-gray-400 p-3">Uploaded Date</th>
                    <th className="text-left text-gray-400 p-3">Expiration</th>
                    <th className="text-left text-gray-400 p-3">Status</th>
                    <th className="text-left text-gray-400 p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                      <td className="p-3 text-white">
                        {documentTypes.find(t => t.value === doc.document_type)?.label || doc.document_type}
                      </td>
                      <td className="p-3 text-gray-300">{doc.file_name}</td>
                      <td className="p-3 text-gray-300">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-gray-300">
                        {doc.expiration_date ? new Date(doc.expiration_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.file_url, '_blank')}
                            className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-400 border-red-400 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-3 w-3" />
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

      {/* Instructions */}
      <Card className="bg-black border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-white">Required Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">W-9 Form</p>
                <p className="text-sm">Required for all vendors for tax reporting purposes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Certificate of Insurance (COI)</p>
                <p className="text-sm">General liability insurance with minimum coverage as specified in your contract</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Business License</p>
                <p className="text-sm">Current and valid business license for your industry</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Keep Documents Current</p>
                <p className="text-sm">Please upload updated documents before they expire to avoid service interruptions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CompanyDocumentsPage
