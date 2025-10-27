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
import { Plus, Pencil, Trash2, Calendar, Upload, FileImage, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import FileGalleryFullScreen from '@/components/FileGalleryFullScreen';

const ELEGANT_GOLD = '#C9A961';

const WorkOrdersPage = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filesFullScreenOpen, setFilesFullScreenOpen] = useState(false);
  const [currentWorkOrder, setCurrentWorkOrder] = useState(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    status: 'todo',
    due_date: '',
    priority: 'medium',
    assigned_to: [],
    created_by: '',
    files: [],
  });

  // Get current user role
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isEmployee = currentUser.role === 'employee';
  const canFullEdit = !isEmployee; // Admin and Manager can add/delete

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workOrdersRes, projectsRes, usersRes] = await Promise.all([
        api.get('/work-orders'),
        api.get('/projects'),
        api.get('/users')
      ]);
      setWorkOrders(workOrdersRes.data);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (data.due_date) {
        data.due_date = new Date(data.due_date).toISOString();
      }
      if (!data.project_id) data.project_id = null;

      // Add current user as created_by for new work orders
      if (!editingWorkOrder) {
        data.created_by = localStorage.getItem('username') || 'Admin';
      }

      // Include uploaded file information
      data.files = selectedFiles;

      if (editingWorkOrder) {
        await api.put(`/work-orders/${editingWorkOrder.id}`, data);
        toast.success('Work order updated successfully');
      } else {
        await api.post('/work-orders', data);
        toast.success('Work order created successfully');
      }
      fetchData();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (workOrder) => {
    setEditingWorkOrder(workOrder);
    setFormData({
      title: workOrder.title || '',
      description: workOrder.description || '',
      project_id: workOrder.project_id || '',
      assigned_to: workOrder.assigned_to || [],
      status: workOrder.status || 'todo',
      due_date: workOrder.due_date ? new Date(workOrder.due_date).toISOString().split('T')[0] : '',
      priority: workOrder.priority || 'medium',
      created_by: workOrder.created_by || '',
      files: workOrder.files || [],
    });
    setSelectedFiles(workOrder.files || []);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingWorkOrder(null);
    setFormData({
      title: '',
      description: '',
      project_id: '',
      status: 'todo',
      due_date: '',
      priority: 'medium',
      assigned_to: [],
      created_by: '',
      files: [],
    });
    setSelectedFiles([]);
    setUploadedFiles([]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this work order?')) return;
    try {
      await api.delete(`/work-orders/${id}`);
      toast.success('Work order deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete work order');
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newUploadedFiles = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        newUploadedFiles.push(response.data);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setSelectedFiles(prev => [...prev, ...newUploadedFiles]);
    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
    
    if (newUploadedFiles.length > 0) {
      const successfulUploads = newUploadedFiles;
      toast.success(`${successfulUploads.length} file(s) uploaded successfully`);
    }
  };

  const handleRemoveFile = (fileIndex) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== fileIndex));
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'No Project';
  };

  const getUserNames = (userIds) => {
    if (!userIds || userIds.length === 0) return 'Unassigned';
    const names = userIds.map(userId => {
      const user = users.find(u => u.id === userId);
      return user ? user.username : 'Unknown';
    });
    return names.join(', ');
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      todo: 'bg-gray-500',
      in_progress: 'bg-blue-500',
      completed: 'bg-green-500'
    };
    return (
      <Badge className={`${statusColors[status] || 'bg-gray-500'} text-white`}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityColors = {
      urgent: 'bg-red-600',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-gray-400'
    };
    return (
      <Badge className={`${priorityColors[priority] || 'bg-gray-400'} text-white`}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold" style={{ color: ELEGANT_GOLD }}>Work Orders</h1>
            <p className="text-gray-400 mt-2">Manage work orders with priority tracking</p>
          </div>
          {canFullEdit && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="text-black hover:opacity-90"
                  style={{ backgroundColor: ELEGANT_GOLD }}
                  data-testid="add-work-order-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Work Order
                </Button>
              </DialogTrigger>
              <DialogContent 
                className="bg-black border max-w-4xl max-h-[90vh] overflow-y-auto" 
                style={{ borderColor: ELEGANT_GOLD }}
              >
                <DialogHeader>
                  <DialogTitle style={{ color: ELEGANT_GOLD }}>
                    {editingWorkOrder ? 'Edit Work Order' : 'Add New Work Order'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" style={{ color: ELEGANT_GOLD }}>Work Order Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        data-testid="work-order-title-input"
                        className="bg-black border text-white"
                        style={{ borderColor: ELEGANT_GOLD }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project_id" style={{ color: ELEGANT_GOLD }}>Project</Label>
                      <Select 
                        value={formData.project_id} 
                        onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                      >
                        <SelectTrigger 
                          className="bg-black border text-white" 
                          style={{ borderColor: ELEGANT_GOLD }}
                        >
                          <SelectValue placeholder="Select project (optional)" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                          <SelectItem value="">No Project</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" style={{ color: ELEGANT_GOLD }}>Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      data-testid="work-order-description-input"
                      className="bg-black border text-white"
                      style={{ borderColor: ELEGANT_GOLD }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="assigned_to" style={{ color: ELEGANT_GOLD }}>Assigned To</Label>
                      <Select 
                        value={formData.assigned_to.length > 0 ? formData.assigned_to.join(',') : ''} 
                        onValueChange={(value) => {
                          const users = value ? value.split(',') : [];
                          setFormData({ ...formData, assigned_to: users });
                        }}
                      >
                        <SelectTrigger 
                          className="bg-black border text-white" 
                          style={{ borderColor: ELEGANT_GOLD }}
                        >
                          <SelectValue placeholder="Select users" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" style={{ color: ELEGANT_GOLD }}>Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger 
                          className="bg-black border text-white" 
                          style={{ borderColor: ELEGANT_GOLD }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority" style={{ color: ELEGANT_GOLD }}>Priority</Label>
                      <Select 
                        value={formData.priority} 
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger 
                          className="bg-black border text-white" 
                          style={{ borderColor: ELEGANT_GOLD }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due_date" style={{ color: ELEGANT_GOLD }}>Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="bg-black border text-white"
                      style={{ borderColor: ELEGANT_GOLD }}
                    />
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-2">
                    <Label style={{ color: ELEGANT_GOLD }}>Work Order Files & Photos</Label>
                    <div className="border-2 border-dashed rounded-lg p-4" style={{ borderColor: ELEGANT_GOLD }}>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center py-4">
                          <Upload className="h-8 w-8 mb-2" style={{ color: ELEGANT_GOLD }} />
                          <p className="text-sm" style={{ color: ELEGANT_GOLD }}>Click to upload files</p>
                          <p className="text-xs text-gray-500 mt-1">Images, PDFs, Documents</p>
                        </div>
                      </label>
                    </div>
                    
                    {/* Display selected files */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm" style={{ color: ELEGANT_GOLD }}>Uploaded Files:</p>
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-black border rounded" style={{ borderColor: ELEGANT_GOLD }}>
                            <div className="flex items-center gap-2">
                              <FileImage className="h-4 w-4" style={{ color: ELEGANT_GOLD }} />
                              <span className="text-sm text-white">{file.filename}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile(index)}
                              className="text-red-500 hover:bg-red-950"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="text-black hover:opacity-90" 
                      style={{ backgroundColor: ELEGANT_GOLD }}
                    >
                      {editingWorkOrder ? 'Update' : 'Create'} Work Order
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Work Orders Table */}
        <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
          <CardHeader>
            <CardTitle style={{ color: ELEGANT_GOLD }}>Work Orders Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: ELEGANT_GOLD }}>
                  <TableHead className="text-white font-semibold">Title</TableHead>
                  <TableHead className="text-white font-semibold">Project</TableHead>
                  <TableHead className="text-white font-semibold">Status</TableHead>
                  <TableHead className="text-white font-semibold">Priority</TableHead>
                  <TableHead className="text-white font-semibold">Due Date</TableHead>
                  <TableHead className="text-white font-semibold">Assigned To</TableHead>
                  <TableHead className="text-white font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.map((workOrder) => (
                  <TableRow 
                    key={workOrder.id} 
                    data-testid={`work-order-row-${workOrder.id}`} 
                    className="border-b hover:bg-gray-800 cursor-pointer" 
                    style={{ borderColor: '#374151' }}
                    onClick={() => {
                      setCurrentWorkOrder(workOrder);
                      setFilesFullScreenOpen(true);
                    }}
                  >
                    <TableCell className="font-medium text-white">{workOrder.title}</TableCell>
                    <TableCell className="text-gray-300">{getProjectName(workOrder.project_id)}</TableCell>
                    <TableCell>{getStatusBadge(workOrder.status)}</TableCell>
                    <TableCell>{getPriorityBadge(workOrder.priority)}</TableCell>
                    <TableCell className="text-gray-300">
                      {workOrder.due_date ? (
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(workOrder.due_date).toLocaleDateString()}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-gray-300">{getUserNames(workOrder.assigned_to)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCurrentWorkOrder(workOrder);
                            setFilesFullScreenOpen(true);
                          }}
                          className="border hover:bg-gray-800"
                          style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}
                        >
                          <FileImage className="h-4 w-4 mr-1" />
                          {workOrder.title} Files ({workOrder.files?.length || 0})
                        </Button>
                        {canFullEdit && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(workOrder)}
                              className="text-gray-400 hover:text-white hover:bg-gray-700"
                              data-testid={`edit-work-order-${workOrder.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(workOrder.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-950"
                              data-testid={`delete-work-order-${workOrder.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Full Screen File Gallery */}
        <FileGalleryFullScreen
          isOpen={filesFullScreenOpen}
          onClose={() => {
            setFilesFullScreenOpen(false);
            fetchData();
          }}
          record={currentWorkOrder}
          recordType="work-order"
          files={currentWorkOrder?.files || []}
          onDelete={async (fileId) => {
            if (!currentWorkOrder) return;
            const updatedFiles = currentWorkOrder.files.filter(f => f.id !== fileId);
            await api.put(`/work-orders/${currentWorkOrder.id}`, { files: updatedFiles });
            setCurrentWorkOrder({ ...currentWorkOrder, files: updatedFiles });
            fetchData();
          }}
          canDelete={canFullEdit}
          onUpdate={fetchData}
        />
      </div>
    </div>
  );
};

export default WorkOrdersPage;