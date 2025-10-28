import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Award, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FileGallery from '@/components/FileGallery';
import FileGalleryFullScreen from '@/components/FileGalleryFullScreen';

const ELEGANT_GOLD = '#C9A961';

const CertificationsPage = () => {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    employee_name: '',
    certification_number: '',
    issue_date: '',
    expiry_date: '',
    issuing_authority: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canDelete = user.role === 'admin' || user.role === 'manager';
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/certifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCertifications(await response.json());
    } catch (error) {
      toast.error('Failed to load certifications');
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
      const url = editingCert 
        ? `${backendUrl}/api/certifications/${editingCert.id}`
        : `${backendUrl}/api/certifications`;
      
      const response = await fetch(url, {
        method: editingCert ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.success(editingCert ? 'Certification updated' : 'Certification created');
        await fetchData();
        handleCloseDialog();
      }
    } catch (error) {
      toast.error('Failed to save certification');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this certification?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/certifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Certification deleted');
        await fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete certification');
    }
  };

  const handleEdit = (cert) => {
    setEditingCert(cert);
    setFormData({
      name: cert.name || '',
      employee_name: cert.employee_name || '',
      certification_number: cert.certification_number || '',
      issue_date: cert.issue_date ? new Date(cert.issue_date).toISOString().split('T')[0] : '',
      expiry_date: cert.expiry_date ? new Date(cert.expiry_date).toISOString().split('T')[0] : '',
      issuing_authority: cert.issuing_authority || ''
    });
    setSelectedFiles(cert.files || []);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCert(null);
    setSelectedFiles([]);
    setFormData({
      name: '',
      employee_name: '',
      certification_number: '',
      issue_date: '',
      expiry_date: '',
      issuing_authority: ''
    });
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow;
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div style={{ color: ELEGANT_GOLD }}>Loading...</div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>Certifications</h1>
          <p className="text-gray-400 mt-1">Manage employee certifications and licenses</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>
          <Plus className="mr-2 h-4 w-4" />New Certification
        </Button>
      </div>

      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader>
          <CardTitle style={{ color: ELEGANT_GOLD }}>All Certifications ({certifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {certifications.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No certifications yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: '#374151' }}>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Name</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Employee</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Cert Number</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Expiry Date</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Status</TableHead>
                  <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certifications.map((cert) => (
                  <TableRow key={cert.id} className="border-b hover:bg-gray-800" style={{ borderColor: '#374151' }}>
                    <TableCell className="font-medium text-white">{cert.name}</TableCell>
                    <TableCell className="text-gray-300">{cert.employee_name || 'N/A'}</TableCell>
                    <TableCell className="text-gray-300">{cert.certification_number || 'N/A'}</TableCell>
                    <TableCell className="text-gray-300">
                      {cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {isExpiringSoon(cert.expiry_date) ? (
                        <Badge className="bg-orange-600">EXPIRING SOON</Badge>
                      ) : (
                        <Badge className="bg-green-600">ACTIVE</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <FileGallery item={cert} itemType="certification" onUpdate={fetchData} canDelete={canDelete} />
                        <Button size="sm" variant="outline" onClick={() => handleEdit(cert)} className="border hover:bg-gray-800" style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button size="sm" variant="outline" onClick={() => handleDelete(cert.id)} className="border-red-500 text-red-500 hover:bg-red-950">
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
            <DialogTitle style={{ color: ELEGANT_GOLD }}>{editingCert ? 'Edit Certification' : 'New Certification'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Certification Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Employee Name</Label>
                <Input value={formData.employee_name} onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Certification Number</Label>
                <Input value={formData.certification_number} onChange={(e) => setFormData({ ...formData, certification_number: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Issue Date</Label>
                <Input type="date" value={formData.issue_date} onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Expiry Date</Label>
                <Input type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Issuing Authority</Label>
              <Input value={formData.issuing_authority} onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Attach Files (Certificate, Documents)</Label>
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
              <Button type="button" onClick={handleCloseDialog} className="text-black hover:opacity-90" style={{ backgroundColor: "#C9A961" }}>Cancel</Button>
              <Button type="submit" className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>{editingCert ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CertificationsPage;
