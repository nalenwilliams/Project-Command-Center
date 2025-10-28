import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/ClientsPage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import EmployeesPage from './pages/EmployeesPage';
import HandbookPoliciesPage from './pages/HandbookPoliciesPage';
import FleetInspectionPage from './pages/FleetInspectionPage';
import InvoicesPage from './pages/InvoicesPage';
import ExpensesPage from './pages/ExpensesPage';
import ContractsPage from './pages/ContractsPage';
import EquipmentPage from './pages/EquipmentPage';
import TimesheetsPage from './pages/TimesheetsPage';
import SafetyReportsPage from './pages/SafetyReportsPage';
import CertificationsPage from './pages/CertificationsPage';
import InventoryPage from './pages/InventoryPage';
import SchedulesPage from './pages/SchedulesPage';
import ReportsPage from './pages/ReportsPage';
import CompliancePage from './pages/CompliancePage';
import PayrollPage from './pages/PayrollPage';
import VendorPortalPage from './pages/VendorPortalPage';
import CompanyDocumentsPage from './pages/CompanyDocumentsPage';
import MyPayrollDocumentsPage from './pages/MyPayrollDocumentsPage';
import EmployeeOnboardingPage from './pages/EmployeeOnboardingPage';
import VendorOnboardingPage from './pages/VendorOnboardingPage';
import AdminPanel from './pages/AdminPanel';
import ColorPicker from './pages/ColorPicker';
import Layout from './components/Layout';
import '@/App.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  // Allow access if either token exists OR user data exists (from OAuth session)
  if (!token && !userStr) {
    return <Navigate to="/auth" replace />;
  }
  
  // Check if user needs onboarding
  if (userStr) {
    const user = JSON.parse(userStr);
    const currentPath = window.location.pathname;
    
    // If onboarding not completed and not already on onboarding page
    if (user.onboarding_completed === false) {
      if (user.role === 'employee' || user.role === 'manager' || user.role === 'admin') {
        if (currentPath !== '/employee-onboarding') {
          return <Navigate to="/employee-onboarding" replace />;
        }
      } else if (user.role === 'vendor') {
        if (currentPath !== '/vendor-onboarding') {
          return <Navigate to="/vendor-onboarding" replace />;
        }
      }
    }
  }
  
  return children;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/colors" element={<ColorPicker />} />
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Onboarding routes - standalone without Layout */}
          <Route 
            path="/employee-onboarding" 
            element={
              <ProtectedRoute>
                <EmployeeOnboardingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vendor-onboarding" 
            element={
              <ProtectedRoute>
                <VendorOnboardingPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Main app routes with Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="work-orders" element={<WorkOrdersPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="handbook" element={<HandbookPoliciesPage />} />
            <Route path="fleet" element={<FleetInspectionPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="equipment" element={<EquipmentPage />} />
            <Route path="timesheets" element={<TimesheetsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="safety-reports" element={<SafetyReportsPage />} />
            <Route path="certifications" element={<CertificationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="compliance" element={<CompliancePage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="vendors" element={<VendorPortalPage />} />
            <Route path="company-documents" element={<CompanyDocumentsPage />} />
            <Route path="my-payroll-documents" element={<MyPayrollDocumentsPage />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
