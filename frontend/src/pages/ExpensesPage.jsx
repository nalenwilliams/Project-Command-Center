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
import { Plus, Receipt, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import FileGallery from '@/components/FileGallery';

const ELEGANT_GOLD = '#C9A961';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'materials',
    project_id: '',
    expense_date: '',
    receipt_number: '',
    notes: '',
    files: []
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canDelete = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesRes, projectsRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/projects')
      ]);
      setExpenses(expensesRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      data.amount = parseFloat(data.amount);
      if (data.expense_date) {
        data.expense_date = new Date(data.expense_date).toISOString();
      }

      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, data);
        toast.success('Expense updated');
      } else {
        await api.post('/expenses', data);
        toast.success('Expense created');
      }
      await fetchData();
      handleCloseDialog();
    } catch (error) {
      toast.error('Failed to save expense');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted');
      await fetchData();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description || '',
      amount: expense.amount || '',
      category: expense.category || 'materials',
      project_id: expense.project_id || '',
      expense_date: expense.expense_date ? new Date(expense.expense_date).toISOString().split('T')[0] : '',
      receipt_number: expense.receipt_number || '',
      notes: expense.notes || '',
      files: expense.files || []
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingExpense(null);
    setFormData({
      description: '',
      amount: '',
      category: 'materials',
      project_id: '',
      expense_date: '',
      receipt_number: '',
      notes: '',
      files: []
    });
  };

  const getCategoryBadge = (category) => {
    const colors = {
      materials: 'bg-blue-600',
      labor: 'bg-green-600',
      equipment: 'bg-purple-600',
      travel: 'bg-yellow-600',
      other: 'bg-gray-600'
    };
    return <Badge className={colors[category]}>{category.toUpperCase()}</Badge>;
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div style={{ color: ELEGANT_GOLD }}>Loading...</div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>Expenses</h1>
          <p className="text-gray-400 mt-1">Project costs and expense tracking</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>
          <Plus className="mr-2 h-4 w-4" />New Expense
        </Button>
      </div>

      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader>
          <CardTitle style={{ color: ELEGANT_GOLD }}>All Expenses ({expenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No expenses yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: '#374151' }}>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Date</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Description</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Category</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Project</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Amount</TableHead>
                  <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id} className="border-b hover:bg-gray-800" style={{ borderColor: '#374151' }}>
                    <TableCell className="text-gray-300">
                      {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium text-white">{expense.description}</TableCell>
                    <TableCell>{getCategoryBadge(expense.category)}</TableCell>
                    <TableCell className="text-gray-300">
                      {projects.find(p => p.id === expense.project_id)?.name || 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-300">${expense.amount?.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <FileGallery item={expense} itemType="expenses" onUpdate={fetchData} canDelete={canDelete} />
                        <Button size="sm" variant="outline" onClick={() => handleEdit(expense)} className="border hover:bg-gray-800" style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button size="sm" variant="outline" onClick={() => handleDelete(expense.id)} className="border-red-500 text-red-500 hover:bg-red-950">
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
            <DialogTitle style={{ color: ELEGANT_GOLD }}>{editingExpense ? 'Edit Expense' : 'New Expense'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Description *</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Amount *</Label>
                <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }}>
                    <SelectItem value="materials" className="text-white hover:bg-gray-800">Materials</SelectItem>
                    <SelectItem value="labor" className="text-white hover:bg-gray-800">Labor</SelectItem>
                    <SelectItem value="equipment" className="text-white hover:bg-gray-800">Equipment</SelectItem>
                    <SelectItem value="travel" className="text-white hover:bg-gray-800">Travel</SelectItem>
                    <SelectItem value="other" className="text-white hover:bg-gray-800">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Expense Date</Label>
                <Input type="date" value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Receipt Number</Label>
                <Input value={formData.receipt_number} onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              </div>
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
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>{editingExpense ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;