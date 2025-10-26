import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar as CalendarIcon, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FileGallery from '@/components/FileGallery';

const localizer = momentLocalizer(moment);
const ELEGANT_GOLD = '#C9A961';

const SchedulesPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    employee_name: '',
    start_time: '',
    end_time: '',
    location: '',
    description: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canDelete = user.role === 'admin' || user.role === 'manager';
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/schedules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSchedules(data);
      
      // Convert to calendar events
      const calendarEvents = data.map(schedule => ({
        id: schedule.id,
        title: schedule.title + (schedule.employee_name ? ` - ${schedule.employee_name}` : ''),
        start: new Date(schedule.start_time),
        end: new Date(schedule.end_time),
        resource: schedule
      }));
      setEvents(calendarEvents);
    } catch (error) {
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = useCallback((slotInfo) => {
    setSelectedSlot(slotInfo);
    setFormData({
      title: '',
      employee_name: '',
      start_time: moment(slotInfo.start).format('YYYY-MM-DDTHH:mm'),
      end_time: moment(slotInfo.end).format('YYYY-MM-DDTHH:mm'),
      location: '',
      description: ''
    });
    setDialogOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    const schedule = event.resource;
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title || '',
      employee_name: schedule.employee_name || '',
      start_time: moment(schedule.start_time).format('YYYY-MM-DDTHH:mm'),
      end_time: moment(schedule.end_time).format('YYYY-MM-DDTHH:mm'),
      location: schedule.location || '',
      description: schedule.description || ''
    });
    setDialogOpen(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingSchedule ? `${backendUrl}/api/schedules/${editingSchedule.id}` : `${backendUrl}/api/schedules`;
      
      const response = await fetch(url, {
        method: editingSchedule ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingSchedule ? 'Schedule updated' : 'Schedule created');
        await fetchData();
        handleCloseDialog();
      }
    } catch (error) {
      toast.error('Failed to save schedule');
    }
  };

  const handleDelete = async () => {
    if (!editingSchedule) return;
    if (!window.confirm('Delete this schedule?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/schedules/${editingSchedule.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Schedule deleted');
        await fetchData();
        handleCloseDialog();
      }
    } catch (error) {
      toast.error('Failed to delete schedule');
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSchedule(null);
    setSelectedSlot(null);
    setFormData({ title: '', employee_name: '', start_time: '', end_time: '', location: '', description: '' });
  };

  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: ELEGANT_GOLD,
        color: '#000000',
        borderRadius: '5px',
        border: 'none',
        display: 'block'
      }
    };
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div style={{ color: ELEGANT_GOLD }}>Loading...</div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: ELEGANT_GOLD }}>Schedules</h1>
          <p className="text-gray-400 mt-1">Manage work schedules and shift assignments</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>
          <Plus className="mr-2 h-4 w-4" />New Schedule
        </Button>
      </div>

      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader>
          <CardTitle style={{ color: ELEGANT_GOLD }}>Calendar View</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day', 'agenda']}
              defaultView="week"
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border max-w-2xl" style={{ borderColor: ELEGANT_GOLD }}>
          <DialogHeader>
            <DialogTitle style={{ color: ELEGANT_GOLD }}>
              {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Employee Name</Label>
              <Input value={formData.employee_name} onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Start Time *</Label>
                <Input type="datetime-local" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
              </div>
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>End Time *</Label>
                <Input type="datetime-local" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Location</Label>
              <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} />
            </div>
            <div className="space-y-2">
              <Label style={{ color: ELEGANT_GOLD }}>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-black border text-white" style={{ borderColor: ELEGANT_GOLD }} rows={3} />
            </div>
            {editingSchedule && (
              <div className="space-y-2">
                <Label style={{ color: ELEGANT_GOLD }}>Attachments</Label>
                <FileGallery item={editingSchedule} itemType="schedule" onUpdate={fetchData} canDelete={canDelete} />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              {editingSchedule && canDelete && (
                <Button type="button" variant="outline" onClick={handleDelete} className="border-red-500 text-red-500 hover:bg-red-950">
                  <Trash2 className="mr-2 h-4 w-4" />Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>
                {editingSchedule ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulesPage;
