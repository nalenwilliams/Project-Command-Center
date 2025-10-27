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
import AdminPanel from './pages/AdminPanel';
import ColorPicker from './pages/ColorPicker';
import Layout from './components/Layout';
import '@/App.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/auth" replace />;
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
            <Route path="admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
