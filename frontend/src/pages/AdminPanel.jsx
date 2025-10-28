import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Mail, Copy, Shield, Users, UserPlus, Bell } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import NotificationSettings from './NotificationSettings';

const ELEGANT_GOLD = '#C9A961';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'employee'
  });

  const [editData, setEditData] = useState({
    username: '',
    email: '',
    role: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, invitationsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/invitations')
      ]);
      setUsers(usersRes.data);
      setInvitations(invitationsRes.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/admin/invitations', inviteData);
      const inviteCode = response.data.invitation_code;
      toast.success(`Invitation sent! Code: ${inviteCode}`);
      
      // Try to copy invitation code to clipboard with fallback
      try {
        await navigator.clipboard.writeText(inviteCode);
        toast.info('Invitation code copied to clipboard!');
      } catch (clipboardError) {
        // Fallback: Create a temporary input element
        const tempInput = document.createElement('input');
        tempInput.value = inviteCode;
        tempInput.style.position = 'fixed';
        tempInput.style.opacity = '0';
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        toast.info('Invitation code copied to clipboard!');
      }
      
      fetchData();
      setInviteDialogOpen(false);
      setInviteData({ email: '', role: 'employee' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send invitation');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${editingUser.id}`, editData);
      toast.success('User updated successfully');
      fetchData();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleDeleteInvitation = async (invitationId) => {
    try {
      await api.delete(`/admin/invitations/${invitationId}`);
      toast.success('Invitation deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete invitation');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditData({
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setEditData({ username: '', email: '', role: '', is_active: true });
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: { label: 'Admin', style: { backgroundColor: 'rgba(201, 169, 97, 0.3)', color: ELEGANT_GOLD } },
      manager: { label: 'Manager', style: { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' } },
      employee: { label: 'Employee', style: { backgroundColor: 'rgba(107, 114, 128, 0.2)', color: '#9CA3AF' } },
    };
    const variant = variants[role] || variants.employee;
    return <Badge style={variant.style}>{variant.label}</Badge>;
  };

  const copyInviteCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Invitation code copied!');
    } catch (error) {
      // Fallback method for clipboard copy
      const tempInput = document.createElement('input');
      tempInput.value = code;
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      toast.success('Invitation code copied!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div style={{ color: ELEGANT_GOLD }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-panel">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>Admin Panel</h1>
        <p className="text-gray-400 mt-1">Manage users and system access</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-black border" style={{ borderColor: ELEGANT_GOLD }}>
          <TabsTrigger value="users" style={{ color: ELEGANT_GOLD }}>
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="invitations" style={{ color: ELEGANT_GOLD }}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invitations
          </TabsTrigger>
          <TabsTrigger value="notifications" style={{ color: ELEGANT_GOLD }}>
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
            <CardHeader>
              <CardTitle style={{ color: ELEGANT_GOLD }}>All Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-b" style={{ borderColor: '#374151' }}>
                    <TableHead style={{ color: ELEGANT_GOLD }}>Username</TableHead>
                    <TableHead style={{ color: ELEGANT_GOLD }}>Email</TableHead>
                    <TableHead style={{ color: ELEGANT_GOLD }}>Role</TableHead>
                    <TableHead style={{ color: ELEGANT_GOLD }}>Status</TableHead>
                    <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-b hover:bg-gray-800" style={{ borderColor: '#374151' }}>
                      <TableCell className="font-medium text-white">{user.username}</TableCell>
                      <TableCell className="text-gray-300">{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <Badge style={user.is_active ? 
                          { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80' } : 
                          { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#F87171' }
                        }>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                            className="border hover:bg-gray-800"
                            style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user.id)}
                            className="border-red-500 text-red-500 hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="text-black hover:opacity-90" style={{ backgroundColor: ELEGANT_GOLD }}>
                  <Plus className="mr-2 h-4 w-4" /> Send Invitation
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
                <DialogHeader>
                  <DialogTitle style={{ color: ELEGANT_GOLD }}>Send User Invitation</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email" style={{ color: ELEGANT_GOLD }}>Email *</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteData.email}
                      onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                      required
                      className="bg-black border text-white"
                      style={{ borderColor: ELEGANT_GOLD }}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role" style={{ color: ELEGANT_GOLD }}>Role</Label>
                    <Select value={inviteData.role} onValueChange={(value) => setInviteData({ ...inviteData, role: value })}>
                      <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
                        <SelectItem value="employee" className="text-white hover:bg-gray-800">Employee</SelectItem>
                        <SelectItem value="manager" className="text-white hover:bg-gray-800">Manager</SelectItem>
                        <SelectItem value="admin" className="text-white hover:bg-gray-800">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)} className="border text-white hover:bg-gray-800" style={{ borderColor: ELEGANT_GOLD }}>
                      Cancel
                    </Button>
                    <Button type="submit" className="text-black hover:opacity-90" style={{ backgroundColor: ELEGANT_GOLD }}>
                      Send Invitation
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
            <CardHeader>
              <CardTitle style={{ color: ELEGANT_GOLD }}>Pending Invitations ({invitations.filter(i => !i.used).length})</CardTitle>
            </CardHeader>
            <CardContent>
              {invitations.filter(i => !i.used).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No pending invitations
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b" style={{ borderColor: '#374151' }}>
                      <TableHead style={{ color: ELEGANT_GOLD }}>Email</TableHead>
                      <TableHead style={{ color: ELEGANT_GOLD }}>Role</TableHead>
                      <TableHead style={{ color: ELEGANT_GOLD }}>Invitation Code</TableHead>
                      <TableHead style={{ color: ELEGANT_GOLD }}>Expires</TableHead>
                      <TableHead className="text-right" style={{ color: ELEGANT_GOLD }}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.filter(i => !i.used).map((invitation) => (
                      <TableRow key={invitation.id} className="border-b hover:bg-gray-800" style={{ borderColor: '#374151' }}>
                        <TableCell className="text-white">{invitation.email}</TableCell>
                        <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-sm px-2 py-1 bg-black rounded" style={{ color: ELEGANT_GOLD }}>
                              {invitation.invitation_code}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyInviteCode(invitation.invitation_code)}
                            >
                              <Copy className="h-4 w-4" style={{ color: ELEGANT_GOLD }} />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteInvitation(invitation.id)}
                            className="border-red-500 text-red-500 hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
          <DialogHeader>
            <DialogTitle style={{ color: ELEGANT_GOLD }}>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Username</Label>
              <Input
                value={editData.username}
                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                className="bg-black border text-white"
                style={{ borderColor: ELEGANT_GOLD }}
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Email</Label>
              <Input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="bg-black border text-white"
                style={{ borderColor: ELEGANT_GOLD }}
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Role</Label>
              <Select value={editData.role} onValueChange={(value) => setEditData({ ...editData, role: value })}>
                <SelectTrigger className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
                  <SelectItem value="employee" className="text-white hover:bg-gray-800">Employee</SelectItem>
                  <SelectItem value="manager" className="text-white hover:bg-gray-800">Manager</SelectItem>
                  <SelectItem value="admin" className="text-white hover:bg-gray-800">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editData.is_active}
                onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <Label style={{ color: ELEGANT_GOLD }}>Active</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="border text-white hover:bg-gray-800" style={{ borderColor: ELEGANT_GOLD }}>
                Cancel
              </Button>
              <Button type="submit" className="text-black hover:opacity-90" style={{ backgroundColor: ELEGANT_GOLD }}>
                Update User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
