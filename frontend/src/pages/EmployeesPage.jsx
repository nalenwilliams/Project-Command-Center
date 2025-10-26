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
          <p className="text-gray-400 mt-1">Manage employee information, handbooks and policies</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingEmployee(null)} data-testid="add-employee-button" className="text-black hover:opacity-90" style={{ backgroundColor: ELEGANT_GOLD }}>
              <Plus className="mr-2 h-4 w-4" /> Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }} data-testid="task-dialog">
            <DialogHeader>
              <DialogTitle style={{ color: ELEGANT_GOLD }}>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" style={{ color: ELEGANT_GOLD }}>Task Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  data-testid="task-title-input"
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" style={{ color: ELEGANT_GOLD }}>Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  data-testid="task-description-input"
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project" style={{ color: ELEGANT_GOLD }}>Project</Label>
                  <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                    <SelectTrigger data-testid="task-project-select" className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id} className="text-white hover:bg-gray-800">
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_to" style={{ color: ELEGANT_GOLD }}>Assign To</Label>
                  <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                    <SelectTrigger data-testid="task-assignee-select" className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id} className="text-white hover:bg-gray-800">
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" style={{ color: ELEGANT_GOLD }}>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger data-testid="task-status-select" className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
                      <SelectItem value="todo" className="text-white hover:bg-gray-800">To Do</SelectItem>
                      <SelectItem value="in_progress" className="text-white hover:bg-gray-800">In Progress</SelectItem>
                      <SelectItem value="completed" className="text-white hover:bg-gray-800">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority" style={{ color: ELEGANT_GOLD }}>Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger data-testid="task-priority-select" className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
                      <SelectItem value="low" className="text-white hover:bg-gray-800">Low</SelectItem>
                      <SelectItem value="medium" className="text-white hover:bg-gray-800">Medium</SelectItem>
                      <SelectItem value="high" className="text-white hover:bg-gray-800">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date" style={{ color: ELEGANT_GOLD }}>Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    data-testid="task-due-date-input"
                    className="bg-black border text-white"
                    style={{ borderColor: ELEGANT_GOLD }}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="border text-white hover:bg-gray-800" style={{ borderColor: ELEGANT_GOLD }}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="task-submit-button" className="text-black hover:opacity-90" style={{ backgroundColor: ELEGANT_GOLD }}>
                  {editingTask ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader>
          <CardTitle style={{ color: ELEGANT_GOLD }}>All Tasks ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No tasks yet. Click "Add Task" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: '#374151' }}>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Task</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Project</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Assigned To</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Status</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Priority</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Due Date</TableHead>
                  <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} data-testid={`task-row-${task.id}`} className="border-b hover:bg-gray-800" style={{ borderColor: '#374151' }}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-white">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-400 max-w-xs truncate">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">{getProjectName(task.project_id)}</TableCell>
                    <TableCell className="text-gray-300">{getUserName(task.assigned_to)}</TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                    <TableCell className="text-gray-300">
                      {task.due_date ? (
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(task)}
                          data-testid={`edit-task-${task.id}`}
                          className="border hover:bg-gray-800"
                          style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(task.id)}
                          data-testid={`delete-task-${task.id}`}
                          className="border-red-500 text-red-500 hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

export default TasksPage;
