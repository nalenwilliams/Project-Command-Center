import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, DollarSign } from 'lucide-react';

const InvoicesPage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdminOrManager = user.role === 'admin' || user.role === 'manager';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#C9A961' }}>
            Invoices
          </h1>
          <p className="text-gray-400 mt-2">
            Track client invoices and payments
          </p>
        </div>
        {isAdminOrManager && (
          <Button
            style={{ backgroundColor: '#C9A961', color: '#000000' }}
            className="hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        )}
      </div>

      <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#C9A961' }}>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 mb-4" style={{ color: '#C9A961' }} />
            <p className="text-gray-400">
              Invoices module coming soon. This will track client billing, payments, and financial records.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicesPage;
      setClients(clientsRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
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
      data.amount = parseFloat(data.amount);

      if (editingInvoice) {
        await api.put(`/invoices/${editingInvoice.id}`, data);
        toast.success('Invoice updated');
      } else {
        await api.post('/invoices', data);
        toast.success('Invoice created');
      }
      await fetchData();
      handleCloseDialog();
    } catch (error) {
      toast.error('Failed to save invoice');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      toast.success('Invoice deleted');
      await fetchData();
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoice_number: invoice.invoice_number || '',
      client_id: invoice.client_id || '',
      project_id: invoice.project_id || '',
      amount: invoice.amount || '',
      due_date: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '',
      status: invoice.status || 'draft',
      notes: invoice.notes || '',
      files: invoice.files || []
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingInvoice(null);
    setFormData({
      invoice_number: '',
      client_id: '',
      project_id: '',
      amount: '',
      due_date: '',
      status: 'draft',
      notes: '',
      files: []
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-600',
      sent: 'bg-blue-600',
      paid: 'bg-green-600',
      overdue: 'bg-red-600'
    };
    return <Badge className={colors[status]}>{status.toUpperCase()}</Badge>;
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div style={{ color: ELEGANT_GOLD }}>Loading...</div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>Invoices</h1>
          <p className="text-gray-400 mt-1">Client billing and invoice tracking</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>
          <Plus className="mr-2 h-4 w-4" />New Invoice
        </Button>
      </div>

      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader>
          <CardTitle style={{ color: ELEGANT_GOLD }}>All Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No invoices yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: '#374151' }}>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Invoice #</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Client</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Amount</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Due Date</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Status</TableHead>
                  <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-b hover:bg-gray-800" style={{ borderColor: '#374151' }}>
                    <TableCell className="font-medium text-white">{invoice.invoice_number}</TableCell>
                    <TableCell className="text-gray-300">
                      {clients.find(c => c.id === invoice.client_id)?.name || 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-300">${invoice.amount?.toFixed(2)}</TableCell>
                    <TableCell className="text-gray-300">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <FileGallery item={invoice} itemType="invoices" onUpdate={fetchData} canDelete={canDelete} />
                        <Button size="sm" variant="outline" onClick={() => handleEdit(invoice)} className="border hover:bg-gray-800" style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button size="sm" variant="outline" onClick={() => handleDelete(invoice.id)} className="border-red-500 text-red-500 hover:bg-red-950">
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
            <DialogTitle style={{ color: ELEGANT_GOLD }}>{editingInvoice ? 'Edit Invoice' : 'New Invoice'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Invoice Number *</Label>
                <Input value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Amount *</Label>
                <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Client</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                  <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }}>
                    {clients.map(c => <SelectItem key={c.id} value={c.id} className="text-white hover:bg-gray-800">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Project</Label>
                <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                  <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }}>
                    {projects.map(p => <SelectItem key={p.id} value={p.id} className="text-white hover:bg-gray-800">{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Due Date</Label>
                <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }}>
                    <SelectItem value="draft" className="text-white hover:bg-gray-800">Draft</SelectItem>
                    <SelectItem value="sent" className="text-white hover:bg-gray-800">Sent</SelectItem>
                    <SelectItem value="paid" className="text-white hover:bg-gray-800">Paid</SelectItem>
                    <SelectItem value="overdue" className="text-white hover:bg-gray-800">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>{editingInvoice ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesPage;