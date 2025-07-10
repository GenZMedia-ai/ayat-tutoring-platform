
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

      case 'follow-up':
        return {
          canEdit: true,
          canChangeStatus: true,
          canCreatePaymentLink: true,
          canCreateFollowUp: true,
          canViewAll: true,
          statusMessage: 'Follow-up scheduled - can manage payment and complete follow-up'
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
          canCreatePaymentLink: true, // ✅ Enable renewal opportunities
          canCreateFollowUp: true,
          canViewAll: true,
          statusMessage: 'Can create renewal payment links and follow-ups'
        };

      case 'cancelled':
        return {
          canEdit: true, // ✅ Allow editing for comeback opportunities
          canChangeStatus: true, // ✅ Allow status changes for re-engagement
          canCreatePaymentLink: true, // ✅ Enable comeback payment links
          canCreateFollowUp: true, // ✅ Enable follow-up for re-engagement
          canViewAll: true,
          statusMessage: 'Can create comeback opportunities and re-engagement'
        };

      case 'dropped':
        return {
          canEdit: true, // ✅ Allow editing for re-engagement
          canChangeStatus: true, // ✅ Allow status changes
          canCreatePaymentLink: true, // ✅ Enable re-engagement payment links
          canCreateFollowUp: true, // ✅ Enable follow-up for re-engagement
          canViewAll: true,
          statusMessage: 'Can create re-engagement opportunities'
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
