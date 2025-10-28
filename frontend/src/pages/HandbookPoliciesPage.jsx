import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Download, CheckCircle, Clock, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const ELEGANT_GOLD = '#C9A961';

const CATEGORIES = [
  { value: 'handbook', label: 'Employee Handbook' },
  { value: 'safety', label: 'Safety Policies' },
  { value: 'hr', label: 'HR Policies' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'general', label: 'General Policies' }
];

const HandbookPoliciesPage = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    version: '1.0',
    effective_date: '',
    requires_acknowledgment: false,
    file_url: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEdit = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await api.get('/policies');
      setPolicies(response.data);
    } catch (error) {
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await api.post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData({ ...formData, file_url: response.data.stored_filename });
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (data.effective_date) {
        data.effective_date = new Date(data.effective_date).toISOString();
      }

      if (editingPolicy) {
        await api.put(`/policies/${editingPolicy.id}`, data);
        toast.success('Policy updated successfully');
      } else {
        await api.post('/policies', data);
        toast.success('Policy created successfully');
      }

      await fetchPolicies();
      handleCloseDialog();
    } catch (error) {
      toast.error('Failed to save policy');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;

    try {
      await api.delete(`/policies/${id}`);
      toast.success('Policy deleted successfully');
      await fetchPolicies();
    } catch (error) {
      toast.error('Failed to delete policy');
    }
  };

  const handleAcknowledge = async (policyId) => {
    try {
      await api.post(`/policies/${policyId}/acknowledge`);
      toast.success('Thank you for acknowledging this policy');
      await fetchPolicies();
    } catch (error) {
      toast.error('Failed to acknowledge policy');
    }
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      title: policy.title || '',
      description: policy.description || '',
      category: policy.category || 'general',
      version: policy.version || '1.0',
      effective_date: policy.effective_date ? new Date(policy.effective_date).toISOString().split('T')[0] : '',
      requires_acknowledgment: policy.requires_acknowledgment || false,
      file_url: policy.file_url || ''
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPolicy(null);
    setFormData({
      title: '',
      description: '',
      category: 'general',
      version: '1.0',
      effective_date: '',
      requires_acknowledgment: false,
      file_url: ''
    });
  };

  const handleOpenDialog = () => {
    // Pre-select category based on active tab
    if (activeTab !== 'all') {
      setFormData({
        ...formData,
        category: activeTab
      });
    }
    setDialogOpen(true);
  };

  const hasAcknowledged = (policy) => {
    return policy.acknowledgments?.some(ack => ack.user_id === user.id);
  };

  const getPoliciesByCategory = (category) => {
    return policies.filter(p => p.category === category);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div style={{ color: ELEGANT_GOLD }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>
            Employee Handbook & Policies
          </h1>
          <p className="text-gray-400 mt-1">Company policies and procedures</p>
        </div>
        {canEdit && (
          <Button
            onClick={handleOpenDialog}
            className="text-black hover:opacity-90"
            style={{ backgroundColor: ELEGANT_GOLD }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Policy
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-black border" style={{ borderColor: ELEGANT_GOLD }}>
          <TabsTrigger value="all" style={{ color: ELEGANT_GOLD }}>All Policies</TabsTrigger>
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value} style={{ color: ELEGANT_GOLD }}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {policies.length === 0 ? (
            <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
              <CardContent className="p-12 text-center text-gray-400">
                No policies available yet.
              </CardContent>
            </Card>
          ) : (
            policies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                canEdit={canEdit}
                hasAcknowledged={hasAcknowledged(policy)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAcknowledge={handleAcknowledge}
              />
            ))
          )}
        </TabsContent>

        {CATEGORIES.map(cat => (
          <TabsContent key={cat.value} value={cat.value} className="space-y-4">
            {getPoliciesByCategory(cat.value).length === 0 ? (
              <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
                <CardContent className="p-12 text-center text-gray-400">
                  No {cat.label.toLowerCase()} available yet.
                </CardContent>
              </Card>
            ) : (
              getPoliciesByCategory(cat.value).map((policy) => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  canEdit={canEdit}
                  hasAcknowledged={hasAcknowledged(policy)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAcknowledge={handleAcknowledge}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border max-w-2xl max-h-[90vh] overflow-y-auto" style={{ borderColor: ELEGANT_GOLD }}>
          <DialogHeader>
            <DialogTitle style={{ color: ELEGANT_GOLD }}>
              {editingPolicy ? 'Edit Policy' : 'Add New Policy'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-black border text-white"
                style={{ borderColor: ELEGANT_GOLD }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-black border text-white"
                style={{ borderColor: ELEGANT_GOLD }}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }}>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-gray-800">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Version</Label>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Effective Date</Label>
              <Input
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                className="bg-black border text-white"
                style={{ borderColor: ELEGANT_GOLD }}
              />
            </div>

            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Upload Document (PDF)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                className="bg-black border text-white"
                style={{ borderColor: ELEGANT_GOLD }}
              />
              {uploadingFile && <p className="text-xs text-gray-400">Uploading...</p>}
              {formData.file_url && <p className="text-xs text-green-500">✓ File uploaded</p>}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requires_ack"
                checked={formData.requires_acknowledgment}
                onChange={(e) => setFormData({ ...formData, requires_acknowledgment: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="requires_ack" style={{ color: ELEGANT_GOLD }}>
                Requires employee acknowledgment
              </Label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>
                {editingPolicy ? 'Update' : 'Create'} Policy
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Policy Card Component
const PolicyCard = ({ policy, canEdit, hasAcknowledged, onEdit, onDelete, onAcknowledge }) => {
  const getCategoryLabel = (category) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  return (
    <Card className="bg-gray-900 border w-full" style={{ borderColor: ELEGANT_GOLD }}>
      <CardContent className="p-6">
        <div className="w-full space-y-4">
          {/* Title and Badges Row */}
          <div className="flex flex-wrap items-center gap-3">
            <FileText className="h-6 w-6 flex-shrink-0" style={{ color: ELEGANT_GOLD }} />
            <h3 className="text-xl font-semibold break-words max-w-full" style={{ color: ELEGANT_GOLD }}>
              {policy.title}
            </h3>
            <Badge variant="outline" className="border flex-shrink-0" style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}>
              {getCategoryLabel(policy.category)}
            </Badge>
            {hasAcknowledged && (
              <Badge className="bg-green-600 flex-shrink-0">
                <CheckCircle className="h-3 w-3 mr-1" />
                Acknowledged
              </Badge>
            )}
          </div>

          {/* Description */}
          {policy.description && (
            <p className="text-gray-300 break-words overflow-wrap-anywhere w-full">{policy.description}</p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400 w-full">
            <span className="break-words">Version: {policy.version}</span>
            {policy.effective_date && (
              <span className="break-words">Effective: {new Date(policy.effective_date).toLocaleDateString()}</span>
            )}
            <span className="break-words">Created by: {policy.created_by}</span>
            {policy.requires_acknowledgment && (
              <span className="flex items-center gap-1" style={{ color: ELEGANT_GOLD }}>
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="whitespace-nowrap">Acknowledgment required</span>
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {policy.file_url && (
              <Button
                size="sm"
                variant="outline"
                className="border"
                style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}
                onClick={() => window.open(`${process.env.REACT_APP_BACKEND_URL}/api/uploads/${policy.file_url}`, '_blank')}
              >
                <Download className="h-4 w-4 mr-1" />
                View Document
              </Button>
            )}
            
            {policy.requires_acknowledgment && !hasAcknowledged && (
              <Button
                size="sm"
                className="text-black"
                style={{ backgroundColor: ELEGANT_GOLD }}
                onClick={() => onAcknowledge(policy.id)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Acknowledge
              </Button>
            )}

            {canEdit && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(policy)}
                  className="border hover:bg-gray-800"
                  style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(policy.id)}
                  className="border-red-500 text-red-500 hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HandbookPoliciesPage;
