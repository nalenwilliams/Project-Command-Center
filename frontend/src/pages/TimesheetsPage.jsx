import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Clock, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import FileGallery from '@/components/FileGallery';
import FileGalleryFullScreen from '@/components/FileGalleryFullScreen';

const ELEGANT_GOLD = '#C9A961';

const TimesheetsPage = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState(null);
  const [formData, setFormData] = useState({
    employee_name: '',
    date: '',
    hours_worked: '',
    project_id: '',
    task_description: '',
    notes: '',
    files: []
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canDelete = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [timesheetsRes, projectsRes] = await Promise.all([
        api.get('/timesheets'),
        api.get('/projects')
      ]);
      setTimesheets(timesheetsRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      toast.error('Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      data.hours_worked = parseFloat(data.hours_worked);
      if (data.date) {
        data.date = new Date(data.date).toISOString();
      }

      if (editingTimesheet) {
        await api.put(`/timesheets/${editingTimesheet.id}`, data);
        toast.success('Timesheet updated');
      } else {
        await api.post('/timesheets', data);
        toast.success('Timesheet created');
      }
      await fetchData();
      handleCloseDialog();
    } catch (error) {
      toast.error('Failed to save timesheet');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timesheet?')) return;
    try {
      await api.delete(`/timesheets/${id}`);
      toast.success('Timesheet deleted');
      await fetchData();
    } catch (error) {
      toast.error('Failed to delete timesheet');
    }
  };

  const handleEdit = (timesheet) => {
    setEditingTimesheet(timesheet);
    setFormData({
      employee_name: timesheet.employee_name || '',
      date: timesheet.date ? new Date(timesheet.date).toISOString().split('T')[0] : '',
      hours_worked: timesheet.hours_worked || '',
      project_id: timesheet.project_id || '',
      task_description: timesheet.task_description || '',
      notes: timesheet.notes || '',
      files: timesheet.files || []
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTimesheet(null);
    setFormData({
      employee_name: '',
      date: '',
      hours_worked: '',
      project_id: '',
      task_description: '',
      notes: '',
      files: []
    });
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div style={{ color: ELEGANT_GOLD }}>Loading...</div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>Timesheets</h1>
          <p className="text-gray-400 mt-1">Employee time tracking</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>
          <Plus className="mr-2 h-4 w-4" />New Entry
        </Button>
      </div>

      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader>
          <CardTitle style={{ color: ELEGANT_GOLD }}>All Timesheets ({timesheets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {timesheets.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No timesheets yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: '#374151' }}>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Date</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Employee</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Hours</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Project</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Task</TableHead>
                  <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheets.map((timesheet) => (
                  <TableRow key={timesheet.id} className="border-b hover:bg-gray-800" style={{ borderColor: '#374151' }}>
                    <TableCell className="text-gray-300">
                      {timesheet.date ? new Date(timesheet.date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium text-white">{timesheet.employee_name}</TableCell>
                    <TableCell className="text-gray-300">{timesheet.hours_worked}h</TableCell>
                    <TableCell className="text-gray-300">
                      {projects.find(p => p.id === timesheet.project_id)?.name || 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-300">{timesheet.task_description || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <FileGallery item={timesheet} itemType="timesheets" onUpdate={fetchData} canDelete={canDelete} />
                        <Button size="sm" variant="outline" onClick={() => handleEdit(timesheet)} className="border hover:bg-gray-800" style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button size="sm" variant="outline" onClick={() => handleDelete(timesheet.id)} className="border-red-500 text-red-500 hover:bg-red-950">
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
            <DialogTitle style={{ color: ELEGANT_GOLD }}>{editingTimesheet ? 'Edit Timesheet' : 'New Timesheet Entry'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Employee Name *</Label>
                <Input value={formData.employee_name} onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Date *</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Hours Worked *</Label>
              <Input type="number" step="0.5" value={formData.hours_worked} onChange={(e) => setFormData({ ...formData, hours_worked: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Task Description</Label>
              <Input value={formData.task_description} onChange={(e) => setFormData({ ...formData, task_description: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" onClick={handleCloseDialog} className="text-black hover:opacity-90" style={{ backgroundColor: "#C9A961" }}>Cancel</Button>
              <Button type="submit" className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>{editingTimesheet ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimesheetsPage;