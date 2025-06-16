
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import SalesDashboard from '@/components/dashboard/SalesDashboard';
import SupervisorDashboard from '@/components/dashboard/SupervisorDashboard';

const Index = () => {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="brand-gradient w-16 h-16 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-2xl">AW</span>
          </div>
          <p className="text-muted-foreground">Loading Ayat w Bian...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <div className="w-full max-w-md">
          {authMode === 'login' ? (
            <div className="space-y-4">
              <LoginForm />
              <div className="text-center">
                <button
                  onClick={() => setAuthMode('register')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Don't have an account? Register with invitation code
                </button>
              </div>
            </div>
          ) : (
            <RegisterForm onBackToLogin={() => setAuthMode('login')} />
          )}
        </div>
      </div>
    );
  }

  if (user.status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="brand-gradient w-16 h-16 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-2xl">AW</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-primary">Account Pending Approval</h1>
            <p className="text-muted-foreground">
              Your account is currently under review. You'll receive a notification once it's approved by an administrator.
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h3 className="font-medium">Registration Details:</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Name:</span> {user.fullName}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Role:</span> {user.role}</p>
              {user.teacherType && (
                <p><span className="font-medium">Teacher Type:</span> {user.teacherType}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'sales':
        return <SalesDashboard />;
      case 'supervisor':
        return <SupervisorDashboard />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="p-6">
        {renderDashboard()}
      </main>
    </div>
  );
};

export default Index;
