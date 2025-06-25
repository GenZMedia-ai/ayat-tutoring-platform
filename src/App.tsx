
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Auth from '@/components/auth/Auth';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import SalesDashboard from '@/components/dashboard/SalesDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import SupervisorDashboard from '@/components/dashboard/SupervisorDashboard';
import AdminNotificationsRoute from '@/components/routes/AdminNotificationsRoute';

// Create simple placeholder components for missing routes
const TrialAppointments = () => <div className="p-6">Trial Appointments - Coming Soon</div>;
const StudentManagement = () => <div className="p-6">Student Management - Coming Soon</div>;
const SessionManagement = () => <div className="p-6">Session Management - Coming Soon</div>;
const SettingsManagement = () => <div className="p-6">Settings Management - Coming Soon</div>;
const SalesAvailability = () => <div className="p-6">Sales Availability - Coming Soon</div>;
const SupervisorOverview = () => <div className="p-6">Supervisor Overview - Coming Soon</div>;

const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public route for authentication */}
        <Route path="/auth" element={<Auth />} />

        {/* Admin Routes */}
        <Route path="/admin" element={user ? <AdminDashboard /> : <Navigate to="/auth" />}>
          <Route path="homepage" element={<Navigate to="/admin/trials" />} />
          <Route path="trials" element={<TrialAppointments />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="sessions" element={<SessionManagement />} />
          <Route path="notifications" element={<AdminNotificationsRoute />} />
          <Route path="settings" element={<SettingsManagement />} />
        </Route>

        {/* Sales Routes */}
        <Route path="/sales" element={user ? <SalesDashboard /> : <Navigate to="/auth" />}>
          <Route path="availability" element={<SalesAvailability />} />
          <Route path="*" element={<Navigate to="/sales/availability" />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={user ? <TeacherDashboard /> : <Navigate to="/auth" />}>
          <Route path="availability" element={<div className="p-6">Teacher Availability - Coming Soon</div>} />
          <Route path="*" element={<Navigate to="/teacher/availability" />} />
        </Route>

        {/* Supervisor Routes */}
         <Route path="/supervisor" element={user ? <SupervisorDashboard /> : <Navigate to="/auth" />}>
          <Route path="overview" element={<SupervisorOverview />} />
          <Route path="*" element={<Navigate to="/supervisor/overview" />} />
        </Route>

        {/* Default route - redirects to auth if not authenticated, otherwise to sales */}
        <Route
          path="/"
          element={user ? <Navigate to="/sales/availability" /> : <Navigate to="/auth" />}
        />
      </Routes>
    </Router>
  );
};

export default App;
