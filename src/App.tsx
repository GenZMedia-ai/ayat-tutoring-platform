import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useUser } from '@supabase/auth-helpers-react';
import Auth from '@/components/auth/Auth';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import SalesDashboard from '@/components/dashboard/SalesDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import SupervisorDashboard from '@/components/dashboard/SupervisorDashboard';
import TrialAppointments from '@/components/dashboard/admin/TrialAppointments';
import StudentManagement from '@/components/dashboard/admin/StudentManagement';
import SessionManagement from '@/components/dashboard/admin/SessionManagement';
import SettingsManagement from '@/components/dashboard/admin/SettingsManagement';
import SalesAvailability from '@/components/dashboard/sales/SalesAvailability';
import TeacherAvailability from '@/components/dashboard/teacher/TeacherAvailability';
import SupervisorOverview from '@/components/dashboard/supervisor/SupervisorOverview';
import AdminNotifications from '@/components/dashboard/admin/AdminNotifications';
import AdminNotificationsRoute from '@/components/routes/AdminNotificationsRoute';

const App: React.FC = () => {
  const user = useUser();

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
          <Route path="availability" element={<TeacherAvailability />} />
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
