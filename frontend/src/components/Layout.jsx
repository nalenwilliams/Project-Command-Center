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
    { path: '/deals', label: 'Deals', icon: TrendingUp },
  ];

  return (
    <div className="flex h-screen bg-gray-50" data-testid="main-layout">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-black border-r border-yellow-600 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          <div className="flex flex-col items-center p-6 border-b border-yellow-600">
            <img 
              src="/williams-logo.png" 
              alt="Williams Diversified LLC" 
              className="w-32 h-auto mb-3"
            />
            <div className="text-center">
              <h1 className="text-lg font-bold text-yellow-500">Williams Diversified LLC</h1>
              <p className="text-xs text-yellow-600">CRM & Project Management</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden absolute top-4 right-4 text-yellow-500 hover:text-yellow-400 hover:bg-gray-900"
              onClick={() => setSidebarOpen(false)}
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
                    className={`w-full justify-start ${
                      isActive 
                        ? 'bg-yellow-600 text-black hover:bg-yellow-500 hover:text-black' 
                        : 'text-yellow-500 hover:bg-gray-900 hover:text-yellow-400'
                    }`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-yellow-600">
            <div className="flex items-center mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-500">{user.username}</p>
                <p className="text-xs text-yellow-600">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start border-yellow-600 text-yellow-500 hover:bg-gray-900 hover:text-yellow-400"
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
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden p-4 bg-white border-b border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            data-testid="menu-button"
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
