import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Shield,
  BookOpen,
  Truck,
} from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/employees', label: 'Employees', icon: TrendingUp },
    { path: '/handbook', label: 'Handbook/Policies', icon: BookOpen },
    { path: '/fleet', label: 'Fleet Inspections', icon: Truck },
  ];

  // Add Admin link if user is admin
  const isAdmin = user.role === 'admin';
  if (isAdmin) {
    navItems.push({ path: '/admin', label: 'Admin Panel', icon: Shield });
  }

  return (
    <div className="flex h-screen bg-black" data-testid="main-layout">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-black border-r transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ borderColor: '#C9A961' }}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          <div className="flex flex-col items-center p-6 border-b" style={{ borderColor: '#C9A961' }}>
            <img 
              src="/williams-logo.png" 
              alt="Williams Diversified LLC" 
              className="w-32 h-auto mb-3"
            />
            <div className="text-center">
              <h1 className="text-lg font-bold" style={{ color: '#C9A961' }}>Williams Diversified LLC</h1>
              <p className="text-xs" style={{ color: '#C9A961', opacity: 0.8 }}>Project Command Center</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden absolute top-4 right-4 hover:bg-gray-900"
              onClick={() => setSidebarOpen(false)}
              style={{ color: '#C9A961' }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-gray-900"
                    style={isActive ? { backgroundColor: '#C9A961', color: '#000000' } : { color: '#C9A961' }}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t" style={{ borderColor: '#C9A961' }}>
            <div className="flex items-center mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: '#C9A961' }}>{user.username}</p>
                <p className="text-xs" style={{ color: '#C9A961', opacity: 0.7 }}>{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-gray-900"
              style={{ borderColor: '#C9A961', color: '#C9A961' }}
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-black">
        <div className="lg:hidden p-4 bg-gray-900 border-b" style={{ borderColor: '#C9A961' }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            data-testid="menu-button"
            style={{ color: '#C9A961' }}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
