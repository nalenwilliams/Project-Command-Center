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
import { Plus, Wrench, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import FileGallery from '@/components/FileGallery';
import FileGalleryFullScreen from '@/components/FileGalleryFullScreen';

const ELEGANT_GOLD = '#C9A961';

const EquipmentPage = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    equipment_type: 'tool',
    serial_number: '',
    location: '',
    assigned_to: '',
    purchase_date: '',
    status: 'available',
    notes: '',
    files: []
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canDelete = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await api.get('/equipment');
      setEquipment(response.data);
    } catch (error) {
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (data.purchase_date) {
        data.purchase_date = new Date(data.purchase_date).toISOString();
      }

      if (editingEquipment) {
        await api.put(`/equipment/${editingEquipment.id}`, data);
        toast.success('Equipment updated');
      } else {
        await api.post('/equipment', data);
        toast.success('Equipment added');
      }
      await fetchEquipment();
      handleCloseDialog();
    } catch (error) {
      toast.error('Failed to save equipment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this equipment?')) return;
    try {
      await api.delete(`/equipment/${id}`);
      toast.success('Equipment deleted');
      await fetchEquipment();
    } catch (error) {
      toast.error('Failed to delete equipment');
    }
  };

  const handleEdit = (item) => {
    setEditingEquipment(item);
    setFormData({
      name: item.name || '',
      equipment_type: item.equipment_type || 'tool',
      serial_number: item.serial_number || '',
      location: item.location || '',
      assigned_to: item.assigned_to || '',
      purchase_date: item.purchase_date ? new Date(item.purchase_date).toISOString().split('T')[0] : '',
      status: item.status || 'available',
      notes: item.notes || '',
      files: item.files || []
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEquipment(null);
    setFormData({
      name: '',
      equipment_type: 'tool',
      serial_number: '',
      location: '',
      assigned_to: '',
      purchase_date: '',
      status: 'available',
      notes: '',
      files: []
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      available: 'bg-green-600',
      in_use: 'bg-blue-600',
      maintenance: 'bg-yellow-600',
      retired: 'bg-gray-600'
    };
    return <Badge className={colors[status]}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div style={{ color: ELEGANT_GOLD }}>Loading...</div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>Equipment & Assets</h1>
          <p className="text-gray-400 mt-1">Track tools, vehicles, and machinery</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>
          <Plus className="mr-2 h-4 w-4" />Add Equipment
        </Button>
      </div>

      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader>
          <CardTitle style={{ color: ELEGANT_GOLD }}>All Equipment ({equipment.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {equipment.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No equipment yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: '#374151' }}>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Name</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Type</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Serial #</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Location</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Status</TableHead>
                  <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className="border-b hover:bg-gray-800 cursor-pointer" 
                    style={{ borderColor: '#374151' }}
                    onClick={() => {
                      setSelectedEquipment(item);
                      setGalleryOpen(true);
                    }}
                  >
                    <TableCell className="font-medium text-white">{item.name}</TableCell>
                    <TableCell className="text-gray-300">{item.equipment_type}</TableCell>
                    <TableCell className="text-gray-300">{item.serial_number || 'N/A'}</TableCell>
                    <TableCell className="text-gray-300">{item.location || 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(item)} className="border hover:bg-gray-800" style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}>
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
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border max-w-2xl max-h-[90vh] overflow-y-auto" style={{ borderColor: ELEGANT_GOLD }}>
          <DialogHeader>
            <DialogTitle style={{ color: ELEGANT_GOLD }}>{editingEquipment ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Type</Label>
                <Select value={formData.equipment_type} onValueChange={(value) => setFormData({ ...formData, equipment_type: value })}>
                  <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }}>
                    <SelectItem value="vehicle" className="text-white hover:bg-gray-800">Vehicle</SelectItem>
                    <SelectItem value="tool" className="text-white hover:bg-gray-800">Tool</SelectItem>
                    <SelectItem value="machinery" className="text-white hover:bg-gray-800">Machinery</SelectItem>
                    <SelectItem value="other" className="text-white hover:bg-gray-800">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Serial Number</Label>
                <Input value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Location</Label>
                <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Assigned To</Label>
                <Input value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Purchase Date</Label>
                <Input type="date" value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }}>
                    <SelectItem value="available" className="text-white hover:bg-gray-800">Available</SelectItem>
                    <SelectItem value="in_use" className="text-white hover:bg-gray-800">In Use</SelectItem>
                    <SelectItem value="maintenance" className="text-white hover:bg-gray-800">Maintenance</SelectItem>
                    <SelectItem value="retired" className="text-white hover:bg-gray-800">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" onClick={handleCloseDialog} className="text-black hover:opacity-90" style={{ backgroundColor: "#C9A961" }}>Cancel</Button>
              <Button type="submit" className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>{editingEquipment ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquipmentPage;