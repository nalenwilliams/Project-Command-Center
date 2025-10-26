import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, ClipboardCheck } from 'lucide-react';

const CompliancePage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdminOrManager = user.role === 'admin' || user.role === 'manager';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#C9A961' }}>
            Compliance
          </h1>
          <p className="text-gray-400 mt-2">
            Track regulatory compliance and documentation
          </p>
        </div>
        {isAdminOrManager && (
          <Button
            style={{ backgroundColor: '#C9A961', color: '#000000' }}
            className="hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        )}
      </div>

      <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#C9A961' }}>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <ClipboardCheck className="mx-auto h-12 w-12 mb-4" style={{ color: '#C9A961' }} />
            <p className="text-gray-400">
              Compliance module coming soon. Manage regulatory requirements, audits, and compliance documentation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompliancePage;