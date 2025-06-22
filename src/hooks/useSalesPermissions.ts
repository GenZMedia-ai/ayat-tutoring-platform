
import { useMemo } from 'react';
import { StudentStatus } from '@/types';

interface SalesPermissions {
  canEdit: boolean;
  canChangeStatus: boolean;
  canCreatePaymentLink: boolean;
  canCreateFollowUp: boolean;
  canViewAll: boolean;
  statusMessage?: string;
}

export const useSalesPermissions = (status: StudentStatus): SalesPermissions => {
  return useMemo(() => {
    switch (status) {
      case 'pending':
        return {
          canEdit: true,
          canChangeStatus: false,
          canCreatePaymentLink: false,
          canCreateFollowUp: false,
          canViewAll: true,
          statusMessage: 'Waiting for teacher confirmation'
        };

      case 'confirmed':
        return {
          canEdit: false,
          canChangeStatus: false,
          canCreatePaymentLink: false,
          canCreateFollowUp: false,
          canViewAll: true,
          statusMessage: 'Confirmed by teacher - no edits allowed'
        };

      case 'trial-completed':
      case 'trial-ghosted':
        return {
          canEdit: true,
          canChangeStatus: true,
          canCreatePaymentLink: true,
          canCreateFollowUp: true,
          canViewAll: true,
          statusMessage: 'Full control - can manage payment and follow-up'
        };

      case 'awaiting-payment':
        return {
          canEdit: true,
          canChangeStatus: true,
          canCreatePaymentLink: true,
          canCreateFollowUp: true,
          canViewAll: true,
          statusMessage: 'Payment link created - managing payment process'
        };

      case 'paid':
        return {
          canEdit: true, // Limited edit
          canChangeStatus: true,
          canCreatePaymentLink: false,
          canCreateFollowUp: false,
          canViewAll: true,
          statusMessage: 'Coordinating transition to active sessions'
        };

      case 'active':
        return {
          canEdit: false,
          canChangeStatus: false,
          canCreatePaymentLink: false,
          canCreateFollowUp: false,
          canViewAll: true,
          statusMessage: 'Active sessions - teacher has control'
        };

      case 'expired':
        return {
          canEdit: true,
          canChangeStatus: true,
          canCreatePaymentLink: true,
          canCreateFollowUp: true,
          canViewAll: true,
          statusMessage: 'Can create renewal opportunities'
        };

      case 'cancelled':
      case 'dropped':
        return {
          canEdit: false,
          canChangeStatus: false,
          canCreatePaymentLink: false,
          canCreateFollowUp: false,
          canViewAll: true,
          statusMessage: 'View only - all actions locked'
        };

      default:
        return {
          canEdit: false,
          canChangeStatus: false,
          canCreatePaymentLink: false,
          canCreateFollowUp: false,
          canViewAll: true,
          statusMessage: 'Unknown status'
        };
    }
  }, [status]);
};
