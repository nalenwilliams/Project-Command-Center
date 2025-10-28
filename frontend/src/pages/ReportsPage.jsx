import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileBarChart, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FileGallery from '@/components/FileGallery';
import FileGalleryFullScreen from '@/components/FileGalleryFullScreen';

const ELEGANT_GOLD = '#C9A961';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    report_type: 'financial',
    period: '',
    description: '',
    generated_by: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canDelete = user.role === 'admin' || user.role === 'manager';
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setReports(await response.json());
    } catch (error) {
      toast.error('Failed to load reports');
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
      const url = editingReport ? `${backendUrl}/api/reports/${editingReport.id}` : `${backendUrl}/api/reports`;
      
      const response = await fetch(url, {
        method: editingReport ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.success(editingReport ? 'Report updated' : 'Report created');
        await fetchData();
        handleCloseDialog();
      }
    } catch (error) {
      toast.error('Failed to save report');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/reports/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Report deleted');
        await fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setFormData({
      title: report.title || '',
      report_type: report.report_type || 'financial',
      period: report.period || '',
      description: report.description || '',
      generated_by: report.generated_by || ''
    });
    setSelectedFiles(report.files || []);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingReport(null);
    setSelectedFiles([]);
    setFormData({ title: '', report_type: 'financial', period: '', description: '', generated_by: '' });
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div style={{ color: ELEGANT_GOLD }}>Loading...</div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>Reports</h1>
          <p className="text-gray-400 mt-1">Generate and manage business reports</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>
          <Plus className="mr-2 h-4 w-4" />New Report
        </Button>
      </div>

      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader>
          <CardTitle style={{ color: ELEGANT_GOLD }}>All Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No reports yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: '#374151' }}>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Title</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Type</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Period</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Generated By</TableHead>
                  <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow 
                    key={report.id} 
                    className="border-b hover:bg-gray-800 cursor-pointer" 
                    style={{ borderColor: '#374151' }}
                    onClick={() => {
                      setSelectedReport(report);
                      setGalleryOpen(true);
                    }}
                  >
                    <TableCell className="font-medium text-white">{report.title}</TableCell>
                    <TableCell className="text-gray-300">{report.report_type}</TableCell>
                    <TableCell className="text-gray-300">{report.period || 'N/A'}</TableCell>
                    <TableCell className="text-gray-300">{report.generated_by || 'N/A'}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(report)} className="border hover:bg-gray-800" style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button size="sm" variant="outline" onClick={() => handleDelete(report.id)} className="border-red-500 text-red-500 hover:bg-red-950">
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
        <DialogContent className="bg-gray-900 border max-w-2xl max-h-[90vh] overflow-y-auto" style={{ borderColor: ELEGANT_GOLD }}>
          <DialogHeader>
            <DialogTitle style={{ color: ELEGANT_GOLD }}>{editingReport ? 'Edit Report' : 'New Report'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Report Type *</Label>
                <Select value={formData.report_type} onValueChange={(value) => setFormData({ ...formData, report_type: value })}>
                  <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }} position="popper">
                    <SelectItem value="financial" className="text-white hover:bg-gray-800">Financial</SelectItem>
                    <SelectItem value="project" className="text-white hover:bg-gray-800">Project</SelectItem>
                    <SelectItem value="safety" className="text-white hover:bg-gray-800">Safety</SelectItem>
                    <SelectItem value="performance" className="text-white hover:bg-gray-800">Performance</SelectItem>
                    <SelectItem value="other" className="text-white hover:bg-gray-800">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Period</Label>
                <Input value={formData.period} placeholder="e.g., Q1 2025" onChange={(e) => setFormData({ ...formData, period: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Generated By</Label>
              <Input value={formData.generated_by} onChange={(e) => setFormData({ ...formData, generated_by: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} rows={4} />
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Attach Files (Report Documents, PDFs)</Label>
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
              <Button type="submit" className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>{editingReport ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* FileGalleryFullScreen for viewing report details */}
      <FileGalleryFullScreen
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        record={selectedReport}
        recordType="report"
        files={selectedReport?.files || []}
        onUpdate={fetchData}
        canDelete={canDelete}
      />
    </div>
  );
};

export default ReportsPage;
