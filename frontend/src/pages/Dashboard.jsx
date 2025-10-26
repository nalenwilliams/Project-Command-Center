import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FolderKanban, CheckSquare, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Clients',
      value: stats?.total_clients || 0,
      icon: Users,
      color: '#C9A961',
      bgColor: 'rgba(201, 169, 97, 0.1)',
    },
    {
      title: 'Total Projects',
      value: stats?.total_projects || 0,
      icon: FolderKanban,
      color: '#C9A961',
      bgColor: 'rgba(201, 169, 97, 0.15)',
    },
    {
      title: 'Total Tasks',
      value: stats?.total_tasks || 0,
      icon: CheckSquare,
      color: '#C9A961',
      bgColor: 'rgba(201, 169, 97, 0.1)',
    },
    {
      title: 'Total Employees',
      value: stats?.total_employees || 0,
      icon: TrendingUp,
      color: '#C9A961',
      bgColor: 'rgba(201, 169, 97, 0.15)',
    },
    {
      title: 'Active Projects',
      value: stats?.active_projects || 0,
      icon: Clock,
      color: '#C9A961',
      bgColor: 'rgba(201, 169, 97, 0.1)',
    },
    {
      title: 'Completed Tasks',
      value: stats?.completed_tasks || 0,
      icon: CheckCircle2,
      color: '#C9A961',
      bgColor: 'rgba(201, 169, 97, 0.15)',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#C9A961' }}>Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome to Williams Diversified LLC - Here's your overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`} className="bg-gray-900 border" style={{ borderColor: '#C9A961' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: '#C9A961' }}>
                  {stat.title}
                </CardTitle>
                <div className="p-2 rounded-lg" style={{ backgroundColor: stat.bgColor }}>
                  <Icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: '#C9A961' }}>{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
