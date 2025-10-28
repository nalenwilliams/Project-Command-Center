import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Calendar, Mail, Phone, Briefcase, Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const ELEGANT_GOLD = '#C9A961';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [handbookFiles, setHandbookFiles] = useState([]);
  const [policyFiles, setPolicyFiles] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    hire_date: '',
    status: 'active',
    notes: '',
  });

  // Get current user role
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isEmployee = currentUser.role === 'employee';
  const canEdit = !isEmployee;

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleHandbookChange = (e) => {
    const files = Array.from(e.target.files);
    const fileNames = files.map(f => f.name);
    setHandbookFiles([...handbookFiles, ...fileNames]);
  };

  const handlePolicyChange = (e) => {
    const files = Array.from(e.target.files);
    const fileNames = files.map(f => f.name);
    setPolicyFiles([...policyFiles, ...fileNames]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (data.hire_date) {
        data.hire_date = new Date(data.hire_date).toISOString();
      }
      data.handbooks = handbookFiles;
      data.policies = policyFiles;

      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, data);
        toast.success('Employee updated successfully');
      } else {
        await api.post('/employees', data);
        toast.success('Employee created successfully');
      }
      fetchEmployees();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name || '',
      employee_id: employee.employee_id || '',
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
      hire_date: employee.hire_date ? new Date(employee.hire_date).toISOString().split('T')[0] : '',
      status: employee.status || 'active',
      notes: employee.notes || '',
    });
    setHandbookFiles(employee.handbooks || []);
    setPolicyFiles(employee.policies || []);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEmployee(null);
    setHandbookFiles([]);
    setPolicyFiles([]);
    setFormData({
      name: '',
      employee_id: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      hire_date: '',
      status: 'active',
      notes: '',
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: { label: 'Active', style: { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80' } },
      on_leave: { label: 'On Leave', style: { backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#FACC15' } },
      terminated: { label: 'Terminated', style: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#F87171' } },
    };
    const variant = variants[status] || variants.active;
    return <Badge style={variant.style}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div style={{ color: ELEGANT_GOLD }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="employees-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>Employee Profiles</h1>
          <p className="text-gray-400 mt-1">Manage employee information, handbooks and policies{isEmployee ? ' (View Only)' : ''}</p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEmployee(null)} data-testid="add-employee-button" className="text-black hover:opacity-90" style={{ backgroundColor: ELEGANT_GOLD }}>
                <Plus className="mr-2 h-4 w-4" /> Add Employee
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }} data-testid="employee-dialog">
            <DialogHeader>
              <DialogTitle style={{ color: ELEGANT_GOLD }}>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" style={{ color: ELEGANT_GOLD }}>Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-black border text-white"
                    style={{ borderColor: ELEGANT_GOLD }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee_id" style={{ color: ELEGANT_GOLD }}>Employee ID *</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    required
                    className="bg-black border text-white"
                    style={{ borderColor: ELEGANT_GOLD }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" style={{ color: ELEGANT_GOLD }}>Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-black border text-white"
                    style={{ borderColor: ELEGANT_GOLD }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" style={{ color: ELEGANT_GOLD }}>Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-black border text-white"
                    style={{ borderColor: ELEGANT_GOLD }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department" style={{ color: ELEGANT_GOLD }}>Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="bg-black border text-white"
                    style={{ borderColor: ELEGANT_GOLD }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position" style={{ color: ELEGANT_GOLD }}>Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="bg-black border text-white"
                    style={{ borderColor: ELEGANT_GOLD }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hire_date" style={{ color: ELEGANT_GOLD }}>Hire Date</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="bg-black border text-white"
                    style={{ borderColor: ELEGANT_GOLD }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" style={{ color: ELEGANT_GOLD }}>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
                      <SelectItem value="active" className="text-white hover:bg-gray-800">Active</SelectItem>
                      <SelectItem value="on_leave" className="text-white hover:bg-gray-800">On Leave</SelectItem>
                      <SelectItem value="terminated" className="text-white hover:bg-gray-800">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" style={{ color: ELEGANT_GOLD }}>Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="border text-white hover:bg-gray-800" style={{ borderColor: ELEGANT_GOLD }}>
                  Cancel
                </Button>
                <Button type="submit" className="text-black hover:opacity-90" style={{ backgroundColor: ELEGANT_GOLD }}>
                  {editingEmployee ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader>
          <CardTitle style={{ color: ELEGANT_GOLD }}>All Employees ({employees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No employees yet. Click Add Employee to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: '#374151' }}>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Name</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Employee ID</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Email</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Phone</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Position</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Status</TableHead>
                  <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id} className="border-b hover:bg-gray-800 cursor-pointer" style={{ borderColor: \'#374151\' }} onClick={() => { setSelectedItem(employee.id); setGalleryOpen(true); }}>
                    <TableCell className="font-medium text-white">{employee.name}</TableCell>
                    <TableCell className="text-gray-300">{employee.employee_id}</TableCell>
                    <TableCell className="text-gray-300">{employee.email}</TableCell>
                    <TableCell className="text-gray-300">{employee.phone || '-'}</TableCell>
                    <TableCell className="text-gray-300">{employee.position || '-'}</TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        {canEdit ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(employee)}
                              className="border hover:bg-gray-800"
                              style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(employee.id)}
                              className="border-red-500 text-red-500 hover:bg-red-950"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">View Only</span>
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
    </div>
  );
};

export default EmployeesPage;
