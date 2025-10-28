import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const CommandBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Listen for Cmd+K or Ctrl+K to open command bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setCommand('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCommand = async () => {
    if (!command.trim() || loading) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ai/command`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: command.trim() }),
      });

      const result = await response.json();

      if (result.intent === 'NAVIGATE' && result.route) {
        toast.success(`Navigating to ${result.screen_key || 'page'}...`);
        navigate(result.route);
        setIsOpen(false);
        setCommand('');
      } else {
        toast.error('Could not find that page. Try: projects, invoices, payroll');
      }
    } catch (error) {
      console.error('Command error:', error);
      toast.error('Command failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCommand();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="fixed bottom-24 right-6 h-12 w-12 rounded-full shadow-lg z-40"
        style={{ backgroundColor: '#1a1a1a', borderColor: '#C9A961', borderWidth: '2px' }}
        title="Quick Navigation (Cmd+K)"
      >
        <Command className="h-5 w-5" style={{ color: '#C9A961' }} />
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-black border-2 rounded-lg p-6 max-w-xl w-full mx-4"
        style={{ borderColor: '#C9A961' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <Search className="h-5 w-5" style={{ color: '#C9A961' }} />
          <h3 className="text-lg font-bold" style={{ color: '#C9A961' }}>
            Quick Navigation
          </h3>
        </div>

        <div className="flex gap-2">
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder='Type a command... e.g. "open payroll", "show projects"'
            disabled={loading}
            autoFocus
            className="flex-1 bg-gray-900 text-white border"
            style={{ borderColor: '#C9A961' }}
          />
          <Button
            onClick={handleCommand}
            disabled={loading || !command.trim()}
            style={{ backgroundColor: '#C9A961' }}
            className="text-black"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
          </Button>
        </div>

        <div className="mt-4 text-sm text-gray-400">
          <p className="mb-2">Examples:</p>
          <div className="flex flex-wrap gap-2">
            {['open payroll', 'show projects', 'go to timesheets', 'view invoices'].map((ex) => (
              <button
                key={ex}
                onClick={() => setCommand(ex)}
                className="px-3 py-1 rounded border text-xs hover:bg-gray-800"
                style={{ borderColor: '#C9A961', color: '#C9A961' }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Press <kbd className="px-2 py-1 bg-gray-800 rounded">Esc</kbd> to close, or{' '}
          <kbd className="px-2 py-1 bg-gray-800 rounded">Cmd+K</kbd> to open
        </p>
      </div>
    </div>
  );
};

export default CommandBar;
