
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Dashboard Components
import TeacherDashboard from "./components/dashboard/TeacherDashboard";
import SalesDashboard from "./components/dashboard/SalesDashboard";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import SupervisorDashboard from "./components/dashboard/SupervisorDashboard";

// Teacher Tab Components
import TeacherHomepage from "./components/dashboard/teacher/TeacherHomepage";
import TeacherAvailability from "./components/dashboard/teacher/TeacherAvailability";
import TeacherTrials from "./components/dashboard/teacher/TeacherTrials";
import TeacherStudents from "./components/dashboard/teacher/TeacherStudents";
import TeacherSessions from "./components/dashboard/teacher/TeacherSessions";
import TeacherRevenue from "./components/dashboard/teacher/TeacherRevenue";
import TeacherPaidRegistration from "./components/dashboard/teacher/TeacherPaidRegistration";
import TeacherSessionManagement from "./components/dashboard/teacher/TeacherSessionManagement";

// Sales Tab Components - FIXED IMPORTS
import SalesHomepage from "./components/dashboard/sales/SalesHomepage";
import SalesTrialAppointments from "./components/dashboard/sales/SalesTrialAppointments";
import SalesPaymentLinks from "./components/dashboard/sales/SalesPaymentLinks";
import SalesFollowup from "./components/dashboard/sales/SalesFollowup";
import SalesStudents from "./components/dashboard/sales/SalesStudents";
import SalesAnalytics from "./components/dashboard/sales/SalesAnalytics";

// Admin Tab Components
import AdminHomepage from "./components/dashboard/admin/AdminHomepage";
import AdminTrials from "./components/dashboard/admin/AdminTrials";
import AdminStudents from "./components/dashboard/admin/AdminStudents";
import AdminSessions from "./components/dashboard/admin/AdminSessions";
import AdminSettings from "./components/dashboard/admin/AdminSettings";
import AdminPackages from "./components/dashboard/admin/AdminPackages";
import AdminCurrencies from "./components/dashboard/admin/AdminCurrencies";
import AdminUserManagement from "./components/dashboard/admin/AdminUserManagement";
import BusinessIntelligenceDashboard from "./components/dashboard/admin/analytics/BusinessIntelligenceDashboard";
import SystemConfigurationPanel from "./components/dashboard/admin/configuration/SystemConfigurationPanel";
import NotificationCenter from "./components/notifications/NotificationCenter";

// Supervisor Tab Components
import SupervisorHomepage from "./components/dashboard/supervisor/SupervisorHomepage";
import SupervisorAlerts from "./components/dashboard/supervisor/SupervisorAlerts";
import SupervisorTeam from "./components/dashboard/supervisor/SupervisorTeam";
import SupervisorQuality from "./components/dashboard/supervisor/SupervisorQuality";
import SupervisorReassignment from "./components/dashboard/supervisor/SupervisorReassignment";
import SupervisorStudents from "./components/dashboard/supervisor/SupervisorStudents";
import SupervisorSessions from "./components/dashboard/supervisor/SupervisorSessions";
import SupervisorAnalysis from "./components/dashboard/supervisor/SupervisorAnalysis";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Teacher Routes */}
            <Route path="/teacher" element={<Navigate to="/teacher/homepage" replace />} />
            <Route path="/teacher/*" element={<TeacherDashboard />}>
              <Route path="homepage" element={<TeacherHomepage />} />
              <Route path="availability" element={<TeacherAvailability />} />
              <Route path="trials" element={<TeacherTrials />} />
              <Route path="students" element={<TeacherStudents />} />
              <Route path="revenue" element={<TeacherRevenue />} />
              <Route path="paid-registration" element={<TeacherPaidRegistration />} />
              <Route path="session-management" element={<TeacherSessionManagement />} />
              <Route index element={<Navigate to="homepage" replace />} />
            </Route>

            {/* Sales Routes - FIXED */}
            <Route path="/sales" element={<Navigate to="/sales/homepage" replace />} />
            <Route path="/sales/*" element={<SalesDashboard />}>
              <Route path="homepage" element={<SalesHomepage />} />
              <Route path="trials" element={<SalesTrialAppointments />} />
              <Route path="payment-links" element={<SalesPaymentLinks />} />
              <Route path="followup" element={<SalesFollowup />} />
              <Route path="students" element={<SalesStudents />} />
              <Route path="analytics" element={<SalesAnalytics />} />
              <Route index element={<Navigate to="homepage" replace />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/homepage" replace />} />
            <Route path="/admin/*" element={<AdminDashboard />}>
              <Route path="homepage" element={<AdminHomepage />} />
              <Route path="user-management" element={<AdminUserManagement />} />
              <Route path="analytics" element={<BusinessIntelligenceDashboard />} />
              <Route path="configuration" element={<SystemConfigurationPanel />} />
              <Route path="trials" element={<AdminTrials />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="sessions" element={<AdminSessions />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="settings/packages" element={<AdminPackages />} />
              <Route path="settings/currencies" element={<AdminCurrencies />} />
              <Route path="notifications" element={<NotificationCenter />} />
              <Route index element={<Navigate to="homepage" replace />} />
            </Route>

            {/* Supervisor Routes */}
            <Route path="/supervisor" element={<Navigate to="/supervisor/homepage" replace />} />
            <Route path="/supervisor/*" element={<SupervisorDashboard />}>
              <Route path="homepage" element={<SupervisorHomepage />} />
              <Route path="alerts" element={<SupervisorAlerts />} />
              <Route path="team" element={<SupervisorTeam />} />
              <Route path="quality" element={<SupervisorQuality />} />
              <Route path="reassignment" element={<SupervisorReassignment />} />
              <Route path="students" element={<SupervisorStudents />} />
              <Route path="sessions" element={<SupervisorSessions />} />
              <Route path="analysis" element={<SupervisorAnalysis />} />
              <Route index element={<Navigate to="homepage" replace />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
