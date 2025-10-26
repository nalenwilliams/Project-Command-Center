import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const DealsPage = () => {
  const [deals, setDeals] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    value: '',
    stage: 'lead',
    probability: '',
    expected_close_date: '',
    notes: '',
    assigned_to: '',
  });

  const stages = [
    { value: 'lead', label: 'Lead', color: 'bg-gray-100 text-gray-800' },
    { value: 'qualified', label: 'Qualified', color: 'bg-blue-100 text-blue-800' },
    { value: 'proposal', label: 'Proposal', color: 'bg-purple-100 text-purple-800' },
    { value: 'negotiation', label: 'Negotiation', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'closed_won', label: 'Closed Won', color: 'bg-green-100 text-green-800' },
    { value: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 text-red-800' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dealsRes, clientsRes, usersRes] = await Promise.all([
        api.get('/deals'),
        api.get('/clients'),
        api.get('/users'),
      ]);
      setDeals(dealsRes.data);
      setClients(clientsRes.data);
      setUsers(usersRes.data);
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
      if (data.value) data.value = parseFloat(data.value);
      if (data.probability) data.probability = parseInt(data.probability);
      if (data.expected_close_date) {
        data.expected_close_date = new Date(data.expected_close_date).toISOString();
      }
      if (!data.client_id) data.client_id = null;
      if (!data.assigned_to) data.assigned_to = null;

      if (editingDeal) {
        await api.put(`/deals/${editingDeal.id}`, data);
        toast.success('Deal updated successfully');
      } else {
        await api.post('/deals', data);
        toast.success('Deal created successfully');
      }
      fetchData();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;
    try {
      await api.delete(`/deals/${id}`);
      toast.success('Deal deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete deal');
    }
  };

  const handleEdit = (deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title || '',
      client_id: deal.client_id || '',
      value: deal.value?.toString() || '',
      stage: deal.stage || 'lead',
      probability: deal.probability?.toString() || '',
      expected_close_date: deal.expected_close_date
        ? new Date(deal.expected_close_date).toISOString().split('T')[0]
        : '',
      notes: deal.notes || '',
      assigned_to: deal.assigned_to || '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDeal(null);
    setFormData({
      title: '',
      client_id: '',
      value: '',
      stage: 'lead',
      probability: '',
      expected_close_date: '',
      notes: '',
      assigned_to: '',
    });
  };

  const getStageBadge = (stage) => {
    const stageInfo = stages.find((s) => s.value === stage) || stages[0];
    return <Badge className={stageInfo.color}>{stageInfo.label}</Badge>;
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : 'N/A';
  };

  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.username : 'Unassigned';
  };

  const groupedDeals = stages.reduce((acc, stage) => {
    acc[stage.value] = deals.filter((deal) => deal.stage === stage.value);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="deals-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deals Pipeline</h1>
          <p className="text-gray-500 mt-1">Track your sales pipeline</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingDeal(null)} data-testid="add-deal-button" className="bg-yellow-600 text-black hover:bg-yellow-500">
              <Plus className="mr-2 h-4 w-4" /> Add Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" data-testid="deal-dialog">
            <DialogHeader>
              <DialogTitle>{editingDeal ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Deal Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    data-testid="deal-title-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                    <SelectTrigger data-testid="deal-client-select">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Deal Value ($)</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    data-testid="deal-value-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="probability">Probability (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                    data-testid="deal-probability-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage</Label>
                  <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                    <SelectTrigger data-testid="deal-stage-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_close_date">Expected Close Date</Label>
                  <Input
                    id="expected_close_date"
                    type="date"
                    value={formData.expected_close_date}
                    onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                    data-testid="deal-close-date-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign To</Label>
                <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                  <SelectTrigger data-testid="deal-assignee-select">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  data-testid="deal-notes-input"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="deal-submit-button">
                  {editingDeal ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board View */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {stages.map((stage) => (
            <Card key={stage.value} className="w-80 flex-shrink-0" data-testid={`stage-column-${stage.value}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={stage.color}>{stage.label}</Badge>
                    <span className="text-sm text-gray-500">({groupedDeals[stage.value]?.length || 0})</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedDeals[stage.value]?.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No deals</div>
                ) : (
                  groupedDeals[stage.value]?.map((deal) => (
                    <Card key={deal.id} className="p-4 hover:shadow-md transition-shadow" data-testid={`deal-card-${deal.id}`}>
                      <div className="space-y-2">
                        <div className="font-medium text-sm">{deal.title}</div>
                        <div className="text-xs text-gray-500">{getClientName(deal.client_id)}</div>
                        {deal.value && (
                          <div className="flex items-center text-sm font-semibold text-green-600">
                            <DollarSign className="h-3 w-3" />
                            {deal.value.toLocaleString()}
                          </div>
                        )}
                        {deal.probability !== null && (
                          <div className="flex items-center text-xs text-gray-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {deal.probability}% probability
                          </div>
                        )}
                        {deal.expected_close_date && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(deal.expected_close_date).toLocaleDateString()}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">Assigned: {getUserName(deal.assigned_to)}</div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEdit(deal)}
                            data-testid={`edit-deal-${deal.id}`}
                          >
                            <Pencil className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(deal.id)}
                            data-testid={`delete-deal-${deal.id}`}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DealsPage;
