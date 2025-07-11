
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireTelegramVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [],
  requireTelegramVerification = true 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
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

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user status is approved
  if (user.status !== 'approved') {
    return <Navigate to="/" replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user's actual role
    const redirectPath = getUserDashboardPath(user.role);
    return <Navigate to={redirectPath} replace />;
  }

  // Check Telegram verification if required
  if (requireTelegramVerification && !user.telegramVerified) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Helper function to get dashboard path based on user role
const getUserDashboardPath = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'supervisor':
      return '/supervisor';
    case 'sales':
      return '/sales';
    case 'teacher':
      return '/teacher';
    default:
      return '/';
  }
};

export default ProtectedRoute;
