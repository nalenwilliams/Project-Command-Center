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
import { Plus, FileText, Lock, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import FileGallery from '@/components/FileGallery';
import FileGalleryFullScreen from '@/components/FileGalleryFullScreen';

const ELEGANT_GOLD = '#C9A961';

const ContractsPage = () => {
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    contract_number: '',
    value: '',
    start_date: '',
    end_date: '',
    status: 'active',
    notes: '',
    files: []
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdminOrManager = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    if (isAdminOrManager) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchData = async () => {
    try {
      const [contractsRes, clientsRes] = await Promise.all([
        api.get('/contracts'),
        api.get('/clients')
      ]);
      setContracts(contractsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (data.value) data.value = parseFloat(data.value);
      if (data.start_date) data.start_date = new Date(data.start_date).toISOString();
      if (data.end_date) data.end_date = new Date(data.end_date).toISOString();

      if (editingContract) {
        await api.put(`/contracts/${editingContract.id}`, data);
        toast.success('Contract updated');
      } else {
        await api.post('/contracts', data);
        toast.success('Contract created');
      }
      await fetchData();
      handleCloseDialog();
    } catch (error) {
      toast.error('Failed to save contract');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contract?')) return;
    try {
      await api.delete(`/contracts/${id}`);
      toast.success('Contract deleted');
      await fetchData();
    } catch (error) {
      toast.error('Failed to delete contract');
    }
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setFormData({
      title: contract.title || '',
      client_id: contract.client_id || '',
      contract_number: contract.contract_number || '',
      value: contract.value || '',
      start_date: contract.start_date ? new Date(contract.start_date).toISOString().split('T')[0] : '',
      end_date: contract.end_date ? new Date(contract.end_date).toISOString().split('T')[0] : '',
      status: contract.status || 'active',
      notes: contract.notes || '',
      files: contract.files || []
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingContract(null);
    setFormData({
      title: '',
      client_id: '',
      contract_number: '',
      value: '',
      start_date: '',
      end_date: '',
      status: 'active',
      notes: '',
      files: []
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-600',
      completed: 'bg-blue-600',
      terminated: 'bg-red-600'
    };
    return <Badge className={colors[status]}>{status.toUpperCase()}</Badge>;
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div style={{ color: ELEGANT_GOLD }}>Loading...</div></div>;

  if (!isAdminOrManager) {
    return (
      <div className="p-6">
        <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
          <CardContent className="p-12 text-center">
            <Lock className="h-16 w-16 mx-auto mb-4" style={{ color: ELEGANT_GOLD }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: ELEGANT_GOLD }}>Access Restricted</h2>
            <p className="text-gray-400">Only Admins and Managers can view contracts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>Contracts</h1>
          <p className="text-gray-400 mt-1">Client contracts and agreements (Admin/Manager only)</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>
          <Plus className="mr-2 h-4 w-4" />New Contract
        </Button>
      </div>

      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader>
          <CardTitle style={{ color: ELEGANT_GOLD }}>All Contracts ({contracts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No contracts yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: '#374151' }}>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Title</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Contract #</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Client</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Value</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Status</TableHead>
                  <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id} className="border-b hover:bg-gray-800" style={{ borderColor: '#374151' }}>
                    <TableCell className="font-medium text-white">{contract.title}</TableCell>
                    <TableCell className="text-gray-300">{contract.contract_number || 'N/A'}</TableCell>
                    <TableCell className="text-gray-300">
                      {clients.find(c => c.id === contract.client_id)?.name || 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {contract.value ? `$${contract.value.toFixed(2)}` : 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <FileGallery item={contract} itemType="contracts" onUpdate={fetchData} canDelete={true} />
                        <Button size="sm" variant="outline" onClick={() => handleEdit(contract)} className="border hover:bg-gray-800" style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(contract.id)} className="border-red-500 text-red-500 hover:bg-red-950">
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border max-w-2xl" style={{ borderColor: ELEGANT_GOLD }}>
          <DialogHeader>
            <DialogTitle style={{ color: ELEGANT_GOLD }}>{editingContract ? 'Edit Contract' : 'New Contract'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Contract Number</Label>
                <Input value={formData.contract_number} onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Value</Label>
                <Input type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Client</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }}>
                  {clients.map(c => <SelectItem key={c.id} value={c.id} className="text-white hover:bg-gray-800">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Start Date</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>End Date</Label>
                <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}><SelectValue /></SelectTrigger>
                <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }}>
                  <SelectItem value="active" className="text-white hover:bg-gray-800">Active</SelectItem>
                  <SelectItem value="completed" className="text-white hover:bg-gray-800">Completed</SelectItem>
                  <SelectItem value="terminated" className="text-white hover:bg-gray-800">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" onClick={handleCloseDialog} className="text-black hover:opacity-90" style={{ backgroundColor: "#C9A961" }}>Cancel</Button>
              <Button type="submit" className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>{editingContract ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractsPage;