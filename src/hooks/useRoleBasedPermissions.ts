import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

export interface RoleBasedPermissions {
  canViewFinancialData: boolean;
  canViewTrialOutcomes: boolean;
  canViewSalesNotes: boolean;
  canViewPaymentLinks: boolean;
  canViewFollowUpData: boolean;
  canViewTeacherNotes: boolean;
  canViewStudentBehavior: boolean;
  canViewRecommendedPackages: boolean;
  role: UserRole | null;
}

export const useRoleBasedPermissions = (): RoleBasedPermissions => {
  const { user } = useAuth();
  
  return useMemo(() => {
    if (!user) {
      return {
        canViewFinancialData: false,
        canViewTrialOutcomes: false,
        canViewSalesNotes: false,
        canViewPaymentLinks: false,
        canViewFollowUpData: false,
        canViewTeacherNotes: false,
        canViewStudentBehavior: false,
        canViewRecommendedPackages: false,
        role: null
      };
    }

    const role = user.role;

    switch (role) {
      case 'admin':
        return {
          canViewFinancialData: true,
          canViewTrialOutcomes: true,
          canViewSalesNotes: true,
          canViewPaymentLinks: true,
          canViewFollowUpData: true,
          canViewTeacherNotes: true,
          canViewStudentBehavior: true,
          canViewRecommendedPackages: true,
          role
        };

      case 'sales':
        return {
          canViewFinancialData: false, // HIDDEN: No financial amounts
          canViewTrialOutcomes: true,
          canViewSalesNotes: true,
          canViewPaymentLinks: false, // HIDDEN: No payment amounts
          canViewFollowUpData: true,
          canViewTeacherNotes: true,
          canViewStudentBehavior: true,
          canViewRecommendedPackages: true,
          role
        };

      case 'teacher':
        return {
          canViewFinancialData: false, // HIDDEN: No financial amounts
          canViewTrialOutcomes: true,
          canViewSalesNotes: true,
          canViewPaymentLinks: false, // HIDDEN: No payment amounts
          canViewFollowUpData: false, // HIDDEN: Sales follow-ups are internal
          canViewTeacherNotes: true,
          canViewStudentBehavior: true,
          canViewRecommendedPackages: true,
          role
        };

      case 'supervisor':
        return {
          canViewFinancialData: false, // HIDDEN: No financial amounts
          canViewTrialOutcomes: true,
          canViewSalesNotes: true,
          canViewPaymentLinks: false, // HIDDEN: No payment amounts
          canViewFollowUpData: true,
          canViewTeacherNotes: true,
          canViewStudentBehavior: true,
          canViewRecommendedPackages: true,
          role
        };

      default:
        return {
          canViewFinancialData: false,
          canViewTrialOutcomes: false,
          canViewSalesNotes: false,
          canViewPaymentLinks: false,
          canViewFollowUpData: false,
          canViewTeacherNotes: false,
          canViewStudentBehavior: false,
          canViewRecommendedPackages: false,
          role: null
        };
    }
  }, [user]);
};

export const useDisplayPriority = (status: string) => {
  const permissions = useRoleBasedPermissions();
  
  return useMemo(() => {
    const role = permissions.role;
    
    // Define what each role should see as priority based on status
    switch (status) {
      case 'pending':
        return {
          primary: role === 'teacher' ? ['salesNotes', 'contactInfo'] : ['salesNotes', 'contactInfo'],
          secondary: ['trialDetails']
        };
        
      case 'confirmed':
        return {
          primary: role === 'teacher' ? ['trialDetails', 'contactInfo'] : ['trialDetails', 'salesNotes'],
          secondary: ['contactInfo']
        };
        
      case 'trial-completed':
        return {
          primary: ['trialOutcome', 'teacherNotes', 'studentBehavior'],
          secondary: role === 'admin' ? ['recommendedPackage', 'paymentStatus'] : ['recommendedPackage']
        };
        
      case 'trial-ghosted':
        return {
          primary: ['trialOutcome', 'teacherNotes'],
          secondary: role === 'sales' || role === 'admin' ? ['followUpData'] : []
        };
        
      case 'follow-up':
        return {
          primary: role === 'sales' || role === 'admin' ? ['followUpData', 'trialOutcome'] : ['trialOutcome'],
          secondary: ['teacherNotes']
        };
        
      case 'awaiting-payment':
        return {
          primary: role === 'admin' ? ['paymentStatus', 'recommendedPackage'] : ['recommendedPackage'],
          secondary: ['trialOutcome']
        };
        
      default:
        return {
          primary: ['salesNotes'],
          secondary: ['contactInfo']
        };
    }
  }, [status, permissions.role]);
};