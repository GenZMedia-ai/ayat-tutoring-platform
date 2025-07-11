
import React from 'react';
import ProtectedRoute from './ProtectedRoute';
import { UserRole } from '@/types';

interface RoleGuardProps {
  children: React.ReactNode;
}

export const TeacherRoute: React.FC<RoleGuardProps> = ({ children }) => (
  <ProtectedRoute allowedRoles={['teacher'] as UserRole[]}>
    {children}
  </ProtectedRoute>
);

export const SalesRoute: React.FC<RoleGuardProps> = ({ children }) => (
  <ProtectedRoute allowedRoles={['sales'] as UserRole[]}>
    {children}
  </ProtectedRoute>
);

export const AdminRoute: React.FC<RoleGuardProps> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin'] as UserRole[]}>
    {children}
  </ProtectedRoute>
);

export const SupervisorRoute: React.FC<RoleGuardProps> = ({ children }) => (
  <ProtectedRoute allowedRoles={['supervisor'] as UserRole[]}>
    {children}
  </ProtectedRoute>
);

// Multi-role guards for shared access
export const AdminSupervisorRoute: React.FC<RoleGuardProps> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin', 'supervisor'] as UserRole[]}>
    {children}
  </ProtectedRoute>
);

export const SalesAdminRoute: React.FC<RoleGuardProps> = ({ children }) => (
  <ProtectedRoute allowedRoles={['sales', 'admin'] as UserRole[]}>
    {children}
  </ProtectedRoute>
);
