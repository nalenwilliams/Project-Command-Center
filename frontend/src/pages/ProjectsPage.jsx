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
import { Plus, Pencil, Trash2, Calendar, Upload, FileImage, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const ELEGANT_GOLD = '#C9A961';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_id: '',
    status: 'not_started',
    deadline: '',
    assigned_to: '',
    files: [],
  });

  // Get current user role
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isEmployee = currentUser.role === 'employee';
  const canEdit = !isEmployee; // Admin and Manager can edit

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, clientsRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/clients'),
        api.get('/users'),
      ]);
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Set default empty arrays on error
      setProjects([]);
      setClients([]);
      setUsers([]);
      if (error.response?.status === 403) {
        toast.error('Authentication error. Please log out and log back in.');
      } else {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    
    // Upload each file to the server
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } catch (error) {
        console.error('File upload failed:', error);
        toast.error(`Failed to upload ${file.name}`);
        return null;
      }
    });
    
    const uploadedFiles = await Promise.all(uploadPromises);
    const successfulUploads = uploadedFiles.filter(f => f !== null);
    
    setSelectedFiles([...selectedFiles, ...successfulUploads]);
    toast.success(`${successfulUploads.length} file(s) uploaded successfully`);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (data.deadline) {
        data.deadline = new Date(data.deadline).toISOString();
      }
      if (!data.client_id) data.client_id = null;
      if (!data.assigned_to) data.assigned_to = null;
      
      // Include uploaded file information
      data.files = selectedFiles;

      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, data);
        toast.success('Project updated successfully');
      } else {
        await api.post('/projects', data);
        toast.success('Project created successfully');
      }
      fetchData();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      client_id: project.client_id || '',
      status: project.status || 'not_started',
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
      description: project.description || '',
      assigned_to: project.assigned_to || '',
      files: project.files || [],
    });
    setSelectedFiles([]);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProject(null);
    setSelectedFiles([]);
    setFormData({
      name: '',
      client_id: '',
      status: 'not_started',
      deadline: '',
      description: '',
      assigned_to: '',
      files: [],
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      not_started: { label: 'Not Started', style: { backgroundColor: 'rgba(107, 114, 128, 0.2)', color: '#9CA3AF' } },
      in_progress: { label: 'In Progress', style: { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' } },
      completed: { label: 'Completed', style: { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80' } },
      on_hold: { label: 'On Hold', style: { backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#FACC15' } },
    };
    const variant = variants[status] || variants.not_started;
    return <Badge style={variant.style}>{variant.label}</Badge>;
  };

  const getClientName = (clientId) => {
    if (!Array.isArray(clients) || !clientId) return 'N/A';
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : 'N/A';
  };

  const getUserName = (userId) => {
    if (!Array.isArray(users) || !userId) return 'Unassigned';
    const user = users.find((u) => u.id === userId);
    return user ? user.username : 'Unassigned';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div style={{ color: ELEGANT_GOLD }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="projects-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>Projects</h1>
          <p className="text-gray-400 mt-1">Manage and track your projects{isEmployee ? ' (View Only)' : ''}</p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProject(null)} data-testid="add-project-button" className="text-black hover:opacity-90" style={{ backgroundColor: ELEGANT_GOLD }}>
                <Plus className="mr-2 h-4 w-4" /> Add Project
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }} data-testid="project-dialog">
            <DialogHeader>
              <DialogTitle style={{ color: ELEGANT_GOLD }}>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" style={{ color: ELEGANT_GOLD }}>Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="project-name-input"
                    className="bg-black border text-white"
                    style={{ borderColor: ELEGANT_GOLD }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client" style={{ color: ELEGANT_GOLD }}>Client</Label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                    <SelectTrigger data-testid="project-client-select" className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }} position="popper" sideOffset={5}>
                      {!Array.isArray(clients) || clients.length === 0 ? (
                        <div className="p-2 text-gray-400 text-sm">No clients available. Create a client first.</div>
                      ) : (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id} className="text-white hover:bg-gray-800">
                            {client.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" style={{ color: ELEGANT_GOLD }}>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger data-testid="project-status-select" className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }} position="popper" sideOffset={5}>
                      <SelectItem value="not_started" className="text-white hover:bg-gray-800">Not Started</SelectItem>
                      <SelectItem value="in_progress" className="text-white hover:bg-gray-800">In Progress</SelectItem>
                      <SelectItem value="completed" className="text-white hover:bg-gray-800">Completed</SelectItem>
                      <SelectItem value="on_hold" className="text-white hover:bg-gray-800">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline" style={{ color: ELEGANT_GOLD }}>Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    data-testid="project-deadline-input"
                    className="bg-black border text-white"
                    style={{ borderColor: ELEGANT_GOLD }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to" style={{ color: ELEGANT_GOLD }}>Assign To</Label>
                <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                  <SelectTrigger data-testid="project-assignee-select" className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }} position="popper" sideOffset={5}>
                    {Array.isArray(users) && users.length > 0 ? (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id} className="text-white hover:bg-gray-800">
                          {user.username}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-gray-400 text-sm">No users available.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" style={{ color: ELEGANT_GOLD }}>Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  data-testid="project-description-input"
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                />
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Project Files & Photos</Label>
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
                          {file.content_type?.startsWith('image/') ? (
                            <img 
                              src={`${process.env.REACT_APP_BACKEND_URL}/api/uploads/${file.stored_filename}`} 
                              alt={file.filename} 
                              className="w-12 h-12 object-cover rounded" 
                            />
                          ) : (
                            <FileImage className="h-8 w-8" style={{ color: ELEGANT_GOLD }} />
                          )}
                          <div>
                            <p className="text-sm" style={{ color: ELEGANT_GOLD }}>{file.filename}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                            <p className="text-xs text-gray-400">Uploaded by: {file.uploaded_by}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="border text-white hover:bg-gray-800" style={{ borderColor: ELEGANT_GOLD }}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="project-submit-button" className="text-black hover:opacity-90" style={{ backgroundColor: ELEGANT_GOLD }}>
                  {editingProject ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader>
          <CardTitle style={{ color: ELEGANT_GOLD }}>All Projects ({projects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No projects yet. Click "Add Project" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: '#374151' }}>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Project Name</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Client</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Status</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Deadline</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Assigned To</TableHead>
                  <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id} data-testid={`project-row-${project.id}`} className="border-b hover:bg-gray-800" style={{ borderColor: '#374151' }}>
                    <TableCell className="font-medium text-white">{project.name}</TableCell>
                    <TableCell className="text-gray-300">{getClientName(project.client_id)}</TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell className="text-gray-300">
                      {project.deadline ? (
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(project.deadline).toLocaleDateString()}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-gray-300">{getUserName(project.assigned_to)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {canEdit ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(project)}
                              data-testid={`edit-project-${project.id}`}
                              className="border hover:bg-gray-800"
                              style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(project.id)}
                              data-testid={`delete-project-${project.id}`}
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

export default ProjectsPage;
