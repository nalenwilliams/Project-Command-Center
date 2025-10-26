import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Mail, Phone, Building } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import FileGallery from '@/components/FileGallery';

const ELEGANT_GOLD = '#C9A961';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  });

  // Get current user role
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isEmployee = currentUser.role === 'employee';
  const canEdit = !isEmployee;

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, formData);
        toast.success('Client updated successfully');
      } else {
        await api.post('/clients', formData);
        toast.success('Client created successfully');
      }
      fetchClients();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Client deleted successfully');
      fetchClients();
    } catch (error) {
      toast.error('Failed to delete client');
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      notes: client.notes || '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClient(null);
    setFormData({ name: '', email: '', phone: '', company: '', notes: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="clients-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>Clients</h1>
          <p className="text-gray-400 mt-1">Manage your client relationships{isEmployee ? ' (View Only)' : ''}</p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingClient(null)} data-testid="add-client-button" className="text-black hover:opacity-90" style={{ backgroundColor: ELEGANT_GOLD }}>
                <Plus className="mr-2 h-4 w-4" /> Add Client
              </Button>
            </DialogTrigger>
          <DialogContent data-testid="client-dialog" className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
            <DialogHeader>
              <DialogTitle style={{ color: ELEGANT_GOLD }}>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" style={{ color: ELEGANT_GOLD }}>Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="client-name-input"
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: ELEGANT_GOLD }}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="client-email-input"
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
                  data-testid="client-phone-input"
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" style={{ color: ELEGANT_GOLD }}>Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  data-testid="client-company-input"
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" style={{ color: ELEGANT_GOLD }}>Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  data-testid="client-notes-input"
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="border text-white hover:bg-gray-800" style={{ borderColor: ELEGANT_GOLD }}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="client-submit-button" className="text-black hover:opacity-90" style={{ backgroundColor: ELEGANT_GOLD }}>
                  {editingClient ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader>
          <CardTitle style={{ color: ELEGANT_GOLD }}>All Clients ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No clients yet. Click "Add Client" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: '#374151' }}>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Name</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Contact Info</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Company</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Notes</TableHead>
                  <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} data-testid={`client-row-${client.id}`} className="border-b hover:bg-gray-800" style={{ borderColor: '#374151' }}>
                    <TableCell className="font-medium text-white">{client.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {client.email && (
                          <div className="flex items-center text-gray-300">
                            <Mail className="h-3 w-3 mr-1" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center text-gray-300">
                            <Phone className="h-3 w-3 mr-1" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.company && (
                        <div className="flex items-center text-gray-300">
                          <Building className="h-3 w-3 mr-1" />
                          {client.company}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-300 max-w-xs truncate">
                        {client.notes || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <FileGallery 
                          item={client} 
                          itemType="clients" 
                          onUpdate={fetchClients}
                          canDelete={canEdit}
                        />
                        {canEdit ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(client)}
                              data-testid={`edit-client-${client.id}`}
                              className="border hover:bg-gray-800"
                              style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(client.id)}
                              data-testid={`delete-client-${client.id}`}
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

export default ClientsPage;
