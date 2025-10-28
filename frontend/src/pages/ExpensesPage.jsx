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
import FileGallery from '@/components/FileGallery';
import FileGalleryFullScreen from '@/components/FileGalleryFullScreen';

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
    notes: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canDelete = user.role === 'admin' || user.role === 'manager';
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const categories = ['materials', 'labor', 'equipment', 'transportation', 'utilities', 'office_supplies', 'professional_services', 'insurance', 'maintenance', 'other'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [expensesRes, projectsRes] = await Promise.all([
        fetch(`${backendUrl}/api/expenses`, { headers }),
        fetch(`${backendUrl}/api/projects`, { headers })
      ]);
      
      setExpenses(await expensesRes.json());
      setProjects(await projectsRes.json());
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const token = localStorage.getItem('token');
    
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch(`${backendUrl}/api/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        return await response.json();
      } catch (error) {
        console.error('File upload failed:', error);
        toast.error(`Failed to upload ${file.name}`);
        return null;
      }
    });
    
    const uploadedFiles = await Promise.all(uploadPromises);
    const successfulUploads = uploadedFiles.filter(f => f !== null);
    
    setSelectedFiles([...selectedFiles, ...successfulUploads]);
    toast.success(`${successfulUploads.length} file(s) uploaded`);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = { 
        ...formData, 
        amount: parseFloat(formData.amount),
        files: selectedFiles
      };
      const url = editingExpense 
        ? `${backendUrl}/api/expenses/${editingExpense.id}`
        : `${backendUrl}/api/expenses`;
      
      const response = await fetch(url, {
        method: editingExpense ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.success(editingExpense ? 'Expense updated' : 'Expense created');
        await fetchData();
        handleCloseDialog();
      }
    } catch (error) {
      toast.error('Failed to save expense');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Expense deleted');
        await fetchData();
      }
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
      notes: expense.notes || ''
    });
    setSelectedFiles(expense.files || []);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingExpense(null);
    setSelectedFiles([]);
    setFormData({
      description: '',
      amount: '',
      category: 'materials',
      project_id: '',
      expense_date: '',
      receipt_number: '',
      notes: ''
    });
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div style={{ color: ELEGANT_GOLD }}>Loading...</div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>Expenses</h1>
          <p className="text-gray-400 mt-1">Track and manage business expenses</p>
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
                  <TableHead style={{ color: ELEGANT_GOLD }}>Description</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Category</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Amount</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Date</TableHead>
                  <TableHead style={{ color: ELEGANT_GOLD }}>Project</TableHead>
                  <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id} className="border-b hover:bg-gray-800" style={{ borderColor: '#374151' }}>
                    <TableCell className="font-medium text-white">{expense.description}</TableCell>
                    <TableCell className="text-gray-300">
                      <Badge className="bg-blue-600">{expense.category?.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">${expense.amount?.toFixed(2)}</TableCell>
                    <TableCell className="text-gray-300">
                      {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {projects.find(p => p.id === expense.project_id)?.name || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <FileGallery item={expense} itemType="expense" onUpdate={fetchData} canDelete={canDelete} />
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
                <Label style={{ color: ELEGANT_GOLD }}>Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }} position="popper">
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-white hover:bg-gray-800">
                        {cat.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
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
                <SelectContent className="bg-gray-900 border z-[9999]" style={{ borderColor: ELEGANT_GOLD }} position="popper">
                  {projects.map(p => <SelectItem key={p.id} value={p.id} className="text-white hover:bg-gray-800">{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} rows={3} />
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Attach Files (Receipts, PDFs, Notes)</Label>
              <Input type="file" multiple onChange={handleFileChange} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded text-xs">
                      <span className="text-gray-300">{file.filename}</span>
                      <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-400">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" onClick={handleCloseDialog} className="text-black hover:opacity-90" style={{ backgroundColor: "#C9A961" }}>Cancel</Button>
              <Button type="submit" className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>{editingExpense ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;