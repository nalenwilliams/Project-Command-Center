import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, ClipboardCheck, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FileGallery from '@/components/FileGallery';

const ELEGANT_GOLD = '#C9A961';

const CompliancePage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    compliance_type: 'regulatory',
    requirement: '',
    status: 'pending',
    due_date: '',
    responsible_party: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canDelete = user.role === 'admin' || user.role === 'manager';
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/compliance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDocuments(await response.json());
    } catch (error) {
      toast.error('Failed to load compliance documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const token = localStorage.getItem('token');
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch(`${backendUrl}/api/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        return await response.json();
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
        return null;
      }
    });
    const uploadedFiles = await Promise.all(uploadPromises);
    const successfulUploads = uploadedFiles.filter(f => f !== null);
    setSelectedFiles([...selectedFiles, ...successfulUploads]);
    toast.success(`${successfulUploads.length} file(s) uploaded`);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = { ...formData, files: selectedFiles };
      const url = editingDoc ? `${backendUrl}/api/compliance/${editingDoc.id}` : `${backendUrl}/api/compliance`;
      
      const response = await fetch(url, {
        method: editingDoc ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.success(editingDoc ? 'Document updated' : 'Document created');
        await fetchData();
        handleCloseDialog();
      }
    } catch (error) {
      toast.error('Failed to save document');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this compliance document?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/compliance/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Document deleted');
        await fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title || '',
      compliance_type: doc.compliance_type || 'regulatory',
      requirement: doc.requirement || '',
      status: doc.status || 'pending',
      due_date: doc.due_date ? new Date(doc.due_date).toISOString().split('T')[0] : '',
      responsible_party: doc.responsible_party || ''
    });
    setSelectedFiles(doc.files || []);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDoc(null);
    setSelectedFiles([]);
    setFormData({ title: '', compliance_type: 'regulatory', requirement: '', status: 'pending', due_date: '', responsible_party: '' });
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-600',
      in_progress: 'bg-blue-600',
      compliant: 'bg-green-600',
      non_compliant: 'bg-red-600'
    };
    return <Badge className={colors[status]}>{status?.replace('_', ' ').toUpperCase()}</Badge>;
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div style={{ color: ELEGANT_GOLD }}>Loading...</div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>Compliance</h1>
          <p className="text-gray-400 mt-1">Track regulatory compliance and documentation</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>
          <Plus className="mr-2 h-4 w-4" />New Document
        </Button>
      </div>

      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader>
          <CardTitle style={{ color: ELEGANT_GOLD }}>All Compliance Documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No compliance documents yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: '#374151' }}>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Title</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Type</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Status</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Due Date</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Responsible</TableHead>
                  <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id} className="border-b hover:bg-gray-800" style={{ borderColor: '#374151' }}>
                    <TableCell className="font-medium text-white">{doc.title}</TableCell>
                    <TableCell className="text-gray-300">{doc.compliance_type}</TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell className="text-gray-300">
                      {doc.due_date ? new Date(doc.due_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-300">{doc.responsible_party || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <FileGallery item={doc} itemType="compliance" onUpdate={fetchData} canDelete={canDelete} />
                        <Button size="sm" variant="outline" onClick={() => handleEdit(doc)} className="border hover:bg-gray-800" style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button size="sm" variant="outline" onClick={() => handleDelete(doc.id)} className="border-red-500 text-red-500 hover:bg-red-950">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border max-w-2xl" style={{ borderColor: ELEGANT_GOLD }}>
          <DialogHeader>
            <DialogTitle style={{ color: ELEGANT_GOLD }}>{editingDoc ? 'Edit Compliance Document' : 'New Compliance Document'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Compliance Type *</Label>
                <Select value={formData.compliance_type} onValueChange={(value) => setFormData({ ...formData, compliance_type: value })}>
                  <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }} position="popper">
                    <SelectItem value="regulatory" className="text-white hover:bg-gray-800">Regulatory</SelectItem>
                    <SelectItem value="safety" className="text-white hover:bg-gray-800">Safety</SelectItem>
                    <SelectItem value="environmental" className="text-white hover:bg-gray-800">Environmental</SelectItem>
                    <SelectItem value="quality" className="text-white hover:bg-gray-800">Quality</SelectItem>
                    <SelectItem value="other" className="text-white hover:bg-gray-800">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Status *</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }} position="popper">
                    <SelectItem value="pending" className="text-white hover:bg-gray-800">Pending</SelectItem>
                    <SelectItem value="in_progress" className="text-white hover:bg-gray-800">In Progress</SelectItem>
                    <SelectItem value="compliant" className="text-white hover:bg-gray-800">Compliant</SelectItem>
                    <SelectItem value="non_compliant" className="text-white hover:bg-gray-800">Non-Compliant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Due Date</Label>
                <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Responsible Party</Label>
                <Input value={formData.responsible_party} onChange={(e) => setFormData({ ...formData, responsible_party: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Requirement/Description</Label>
              <Textarea value={formData.requirement} onChange={(e) => setFormData({ ...formData, requirement: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} rows={4} />
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Attach Files (Compliance Documents, Certificates)</Label>
              <Input type="file" multiple onChange={handleFileChange} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded text-xs">
                      <span className="text-gray-300">{file.filename}</span>
                      <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-400">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="border hover:bg-gray-800" style={{ borderColor: "#C9A961", color: "#C9A961" }}>Cancel</Button>
              <Button type="submit" className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>{editingDoc ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompliancePage;
