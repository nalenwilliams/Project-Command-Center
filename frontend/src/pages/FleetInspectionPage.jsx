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
import { Plus, Truck, Calendar, AlertCircle, CheckCircle, Wrench, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import FileGallery from '@/components/FileGallery';
import FileGalleryFullScreen from '@/components/FileGalleryFullScreen';

const ELEGANT_GOLD = '#C9A961';

const FleetInspectionPage = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingInspection, setEditingInspection] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_name: '',
    vehicle_number: '',
    inspector_name: '',
    inspection_date: '',
    mileage: '',
    location: '',
    status: 'pass',
    notes: '',
    files: []
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canDelete = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const response = await api.get('/fleet-inspections');
      setInspections(response.data);
    } catch (error) {
      toast.error('Failed to load fleet inspections');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (data.inspection_date) {
        data.inspection_date = new Date(data.inspection_date).toISOString();
      }

      if (editingInspection) {
        await api.put(`/fleet-inspections/${editingInspection.id}`, data);
        toast.success('Inspection updated successfully');
      } else {
        await api.post('/fleet-inspections', data);
        toast.success('Inspection report created successfully');
      }

      await fetchInspections();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save inspection');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inspection report?')) return;

    try {
      await api.delete(`/fleet-inspections/${id}`);
      toast.success('Inspection deleted successfully');
      await fetchInspections();
    } catch (error) {
      toast.error('Failed to delete inspection');
    }
  };

  const handleEdit = (inspection) => {
    setEditingInspection(inspection);
    setFormData({
      vehicle_name: inspection.vehicle_name || '',
      vehicle_number: inspection.vehicle_number || '',
      inspector_name: inspection.inspector_name || '',
      inspection_date: inspection.inspection_date ? new Date(inspection.inspection_date).toISOString().split('T')[0] : '',
      mileage: inspection.mileage || '',
      location: inspection.location || '',
      status: inspection.status || 'pass',
      notes: inspection.notes || '',
      files: inspection.files || []
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingInspection(null);
    setFormData({
      vehicle_name: '',
      vehicle_number: '',
      inspector_name: '',
      inspection_date: '',
      mileage: '',
      location: '',
      status: 'pass',
      notes: '',
      files: []
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pass: { label: 'Pass', icon: CheckCircle, className: 'bg-green-600' },
      fail: { label: 'Fail', icon: AlertCircle, className: 'bg-red-600' },
      needs_repair: { label: 'Needs Repair', icon: Wrench, className: 'bg-yellow-600' }
    };

    const config = statusConfig[status] || statusConfig.pass;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div style={{ color: ELEGANT_GOLD }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>
            Fleet Inspection Reports
          </h1>
          <p className="text-gray-400 mt-1">Vehicle inspection and maintenance tracking</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="text-black hover:opacity-90"
          style={{ backgroundColor: ELEGANT_GOLD }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Inspection
        </Button>
      </div>

      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader>
          <CardTitle style={{ color: ELEGANT_GOLD }}>
            All Inspections ({inspections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inspections.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No inspection reports yet. Click "New Inspection" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: '#374151' }}>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Vehicle</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Inspector</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Date</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Mileage</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Status</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Location</TableHead>
                  <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.map((inspection) => (
                  <TableRow key={inspection.id} className="border-b hover:bg-gray-800 cursor-pointer" style={{ borderColor: '#374151' }} onClick={() => { setSelectedItem(inspection); setGalleryOpen(true); }}>
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" style={{ color: ELEGANT_GOLD }} />
                        <div>
                          <div>{inspection.vehicle_name}</div>
                          {inspection.vehicle_number && (
                            <div className="text-xs text-gray-400">#{inspection.vehicle_number}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">{inspection.inspector_name}</TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(inspection.inspection_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">{inspection.mileage || '-'}</TableCell>
                    <TableCell>{getStatusBadge(inspection.status)}</TableCell>
                    <TableCell className="text-gray-300">{inspection.location || '-'}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        <FileGallery 
                          item={inspection} 
                          itemType="fleet-inspections" 
                          onUpdate={fetchInspections}
                          canDelete={canDelete}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(inspection)}
                          className="border hover:bg-gray-800"
                          style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(inspection.id)}
                            className="border-red-500 text-red-500 hover:bg-red-950"
                          >
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border max-w-2xl max-h-[90vh] overflow-y-auto" style={{ borderColor: ELEGANT_GOLD }}>
          <DialogHeader>
            <DialogTitle style={{ color: ELEGANT_GOLD }}>
              {editingInspection ? 'Edit Inspection' : 'New Fleet Inspection Report'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Vehicle Name *</Label>
                <Input
                  value={formData.vehicle_name}
                  onChange={(e) => setFormData({ ...formData, vehicle_name: e.target.value })}
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                  placeholder="e.g., Ford F-150"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Vehicle Number</Label>
                <Input
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                  placeholder="e.g., VEH-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Inspector Name *</Label>
                <Input
                  value={formData.inspector_name}
                  onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })}
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Inspection Date *</Label>
                <Input
                  type="date"
                  value={formData.inspection_date}
                  onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Mileage</Label>
                <Input
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                  placeholder="e.g., 45,000 miles"
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                  placeholder="e.g., Main Office"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Inspection Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }}>
                  <SelectItem value="pass" className="text-white hover:bg-gray-800">Pass</SelectItem>
                  <SelectItem value="fail" className="text-white hover:bg-gray-800">Fail</SelectItem>
                  <SelectItem value="needs_repair" className="text-white hover:bg-gray-800">Needs Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-black border text-white"
                style={{ borderColor: ELEGANT_GOLD }}
                rows={3}
                placeholder="Add any inspection notes or findings..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>
                {editingInspection ? 'Update' : 'Create'} Inspection
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* FileGalleryFullScreen for viewing details */}
      <FileGalleryFullScreen
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        record={selectedItem}
        recordType="fleet-inspection"
        files={selectedItem?.files || []}
        onUpdate={fetchData}
        canDelete={canDelete}
      />
    </div>
  );
};

export default FleetInspectionPage;
