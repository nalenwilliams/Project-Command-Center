import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, FileBarChart } from 'lucide-react';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdminOrManager = user.role === 'admin' || user.role === 'manager';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#C9A961' }}>
            Reports
          </h1>
          <p className="text-gray-400 mt-2">
            Generate and view business reports and analytics
          </p>
        </div>
        {isAdminOrManager && (
          <Button
            style={{ backgroundColor: '#C9A961', color: '#000000' }}
            className="hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        )}
      </div>

      <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#C9A961' }}>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <FileBarChart className="mx-auto h-12 w-12 mb-4" style={{ color: '#C9A961' }} />
            <p className="text-gray-400">
              Reports module coming soon. Generate business analytics, financial reports, and project insights.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;