
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import SupervisorDashboard from '@/components/dashboard/SupervisorDashboard';
import SalesDashboard from '@/components/dashboard/SalesDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="brand-gradient w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">AW</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication forms if user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        {authMode === 'login' ? (
          <LoginForm onSwitchToRegister={() => setAuthMode('register')} />
        ) : (
          <RegisterForm onBackToLogin={() => setAuthMode('login')} />
        )}
      </div>
    );
  }

  // Show pending approval message if user is not approved
  if (user.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="brand-gradient w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">AW</span>
              </div>
              <CardTitle>Registration Pending</CardTitle>
              <CardDescription>
                Your account is pending admin approval. You'll receive an email once your account is approved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Name:</strong> {user.fullName}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                {user.teacherType && <p><strong>Teacher Type:</strong> {user.teacherType}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show rejection message if user is rejected
  if (user.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-red-600">Registration Rejected</CardTitle>
              <CardDescription>
                Your registration has been rejected. Please contact the administrator for more information.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // Render role-specific dashboard for approved users
  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'supervisor':
        return <SupervisorDashboard />;
      case 'sales':
        return <SalesDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      default:
        return (
          <div className="p-6">
            <p>Unknown role: {user.role}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="p-6">
        {renderDashboard()}
      </main>
    </div>
  );
};

export default Index;
