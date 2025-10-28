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
import { Plus, Package, DollarSign, Box, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import FileGalleryFullScreen from '@/components/FileGalleryFullScreen';

const ELEGANT_GOLD = '#C9A961';

const InventoryPage = () => {
  const [projectInventory, setProjectInventory] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    item_name: '',
    category: 'materials',
    quantity: '',
    unit: 'pieces',
    project_id: '',
    location: '',
    unit_cost: '',
    supplier: '',
    notes: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canDelete = user.role === 'admin' || user.role === 'manager';
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [inventoryRes, projectsRes] = await Promise.all([
        fetch(`${backendUrl}/api/inventory/by-project`, { headers }),
        fetch(`${backendUrl}/api/projects`, { headers })
      ]);
      
      setProjectInventory(await inventoryRes.json());
      setProjects(await projectsRes.json());
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = { 
        ...formData,
        quantity: parseFloat(formData.quantity),
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : 0
      };
      
      const url = editingItem ? `${backendUrl}/api/inventory/${editingItem.id}` : `${backendUrl}/api/inventory`;
      
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.success(editingItem ? 'Item updated' : 'Item added');
        fetchData();
        handleCloseDialog();
      } else {
        throw new Error('Failed to save item');
      }
    } catch (error) {
      toast.error('Failed to save inventory item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      project_id: item.project_id,
      location: item.location || '',
      unit_cost: item.unit_cost || '',
      supplier: item.supplier || '',
      notes: item.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inventory item?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Item deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData({
      item_name: '',
      category: 'materials',
      quantity: '',
      unit: 'pieces',
      project_id: '',
      location: '',
      unit_cost: '',
      supplier: '',
      notes: ''
    });
  };

  const handleViewProjectDetails = (projectData) => {
    setSelectedProject(projectData);
    setDetailDialogOpen(true);
  };

  if (loading) return <div className="text-white p-8">Loading...</div>;

  return (
    <div className="p-8 bg-black min-h-screen">
      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader className="border-b" style={{ borderColor: ELEGANT_GOLD }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8" style={{ color: ELEGANT_GOLD }} />
              <CardTitle className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>
                Inventory by Project
              </CardTitle>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {projectInventory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No inventory items found. Add items to projects to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: ELEGANT_GOLD }}>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Project Name</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Status</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Total Items</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Total Value</TableHead>
                  <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectInventory.map((proj) => (
                  <TableRow 
                    key={proj.project_id} 
                    className="border-b hover:bg-gray-800 cursor-pointer" 
                    style={{ borderColor: '#374151' }}
                    onClick={() => handleViewProjectDetails(proj)}
                  >
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4" style={{ color: ELEGANT_GOLD }} />
                        {proj.project_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={proj.project_status === 'active' ? 'bg-green-600' : 'bg-gray-600'}>
                        {proj.project_status?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">{proj.total_items} items</TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" style={{ color: ELEGANT_GOLD }} />
                        {proj.total_value.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProjectDetails(proj);
                        }}
                        className="border hover:bg-gray-800" 
                        style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}
                      >
                        <ChevronRight className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border max-w-2xl max-h-[90vh] overflow-y-auto" style={{ borderColor: ELEGANT_GOLD }}>
          <DialogHeader>
            <DialogTitle style={{ color: ELEGANT_GOLD }}>{editingItem ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Item Name *</Label>
                <Input value={formData.item_name} onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="parts">Parts</SelectItem>
                    <SelectItem value="tools">Tools</SelectItem>
                    <SelectItem value="consumables">Consumables</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Quantity *</Label>
                <Input type="number" step="0.01" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Unit *</Label>
                <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="pieces, boxes, etc" className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Unit Cost</Label>
                <Input type="number" step="0.01" value={formData.unit_cost} onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })} placeholder="0.00" className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
            </div>

            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Project *</Label>
              <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })} required>
                <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Location</Label>
                <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Warehouse, Site, etc" className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Supplier</Label>
                <Input value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
            </div>

            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} rows={3} />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="border" style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}>
                Cancel
              </Button>
              <Button type="submit" className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Project Inventory Details Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-gray-900 border max-w-4xl max-h-[90vh] overflow-y-auto" style={{ borderColor: ELEGANT_GOLD }}>
          <DialogHeader>
            <DialogTitle style={{ color: ELEGANT_GOLD }}>
              {selectedProject?.project_name} - Inventory Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedProject && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" style={{ color: ELEGANT_GOLD }} />
                  <span className="text-gray-400">Total Items:</span>
                  <span className="text-white font-semibold">{selectedProject.total_items}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" style={{ color: ELEGANT_GOLD }} />
                  <span className="text-gray-400">Total Value:</span>
                  <span className="text-white font-semibold">${selectedProject.total_value.toFixed(2)}</span>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-b" style={{ borderColor: ELEGANT_GOLD }}>
                    <TableHead style={{ color: ELEGANT_GOLD }}>Item</TableHead>
                    <TableHead style={{ color: ELEGANT_GOLD }}>Category</TableHead>
                    <TableHead style={{ color: ELEGANT_GOLD }}>Quantity</TableHead>
                    <TableHead style={{ color: ELEGANT_GOLD }}>Location</TableHead>
                    <TableHead style={{ color: ELEGANT_GOLD }}>Value</TableHead>
                    <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProject.items.map((item) => (
                    <TableRow key={item.id} className="border-b" style={{ borderColor: '#374151' }}>
                      <TableCell className="font-medium text-white">{item.item_name}</TableCell>
                      <TableCell className="text-gray-300">{item.category}</TableCell>
                      <TableCell className="text-gray-300">{item.quantity} {item.unit}</TableCell>
                      <TableCell className="text-gray-300">{item.location || 'N/A'}</TableCell>
                      <TableCell className="text-gray-300">
                        ${((item.unit_cost || 0) * item.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => { setDetailDialogOpen(false); handleEdit(item); }} className="border hover:bg-gray-800" style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)} className="border-red-500 text-red-500 hover:bg-red-950">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
