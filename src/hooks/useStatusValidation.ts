
import { useState } from 'react';
import { toast } from 'sonner';

type StudentStatus = 'pending' | 'confirmed' | 'trial-completed' | 'trial-ghosted' | 'awaiting-payment' | 'paid' | 'active' | 'expired' | 'cancelled' | 'dropped';

interface StatusTransition {
  from: StudentStatus;
  to: StudentStatus;
  allowedRoles: string[];
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

const statusTransitions: StatusTransition[] = [
  // Teacher transitions
  { from: 'pending', to: 'confirmed', allowedRoles: ['teacher', 'admin'] },
  { from: 'confirmed', to: 'trial-completed', allowedRoles: ['teacher', 'admin'], requiresConfirmation: true, confirmationMessage: 'Mark this trial as completed?' },
  { from: 'confirmed', to: 'trial-ghosted', allowedRoles: ['teacher', 'admin'], requiresConfirmation: true, confirmationMessage: 'Mark this trial as ghosted?' },
  
  // Sales transitions (post-trial)
  { from: 'trial-completed', to: 'awaiting-payment', allowedRoles: ['sales', 'admin'] },
  { from: 'trial-completed', to: 'dropped', allowedRoles: ['sales', 'admin'] },
  { from: 'trial-ghosted', to: 'awaiting-payment', allowedRoles: ['sales', 'admin'] },
  { from: 'trial-ghosted', to: 'dropped', allowedRoles: ['sales', 'admin'] },
  { from: 'awaiting-payment', to: 'paid', allowedRoles: ['sales', 'admin'] },
  { from: 'awaiting-payment', to: 'dropped', allowedRoles: ['sales', 'admin'] },
  { from: 'awaiting-payment', to: 'trial-completed', allowedRoles: ['sales', 'admin'] },
  { from: 'paid', to: 'active', allowedRoles: ['sales', 'admin'] },
  
  // Admin can do additional transitions
  { from: 'pending', to: 'cancelled', allowedRoles: ['admin'] },
  { from: 'confirmed', to: 'cancelled', allowedRoles: ['admin'] },
  { from: 'active', to: 'expired', allowedRoles: ['admin'] },
  { from: 'active', to: 'cancelled', allowedRoles: ['admin'] },
  { from: 'expired', to: 'awaiting-payment', allowedRoles: ['sales', 'admin'] },
];

export const useStatusValidation = (userRole: string) => {
  const [loading, setLoading] = useState(false);

  const validateTransition = (from: StudentStatus, to: StudentStatus): boolean => {
    const transition = statusTransitions.find(t => t.from === from && t.to === to);
    
    if (!transition) {
      toast.error(`Invalid status transition from ${from} to ${to}`);
      return false;
    }

    if (!transition.allowedRoles.includes(userRole)) {
      toast.error(`You don't have permission to change status from ${from} to ${to}`);
      return false;
    }

    return true;
  };

  const getAvailableTransitions = (currentStatus: StudentStatus): Array<{status: StudentStatus, label: string}> => {
    const available = statusTransitions
      .filter(t => t.from === currentStatus && t.allowedRoles.includes(userRole))
      .map(t => ({
        status: t.to,
        label: getStatusLabel(t.to)
      }));

    return available;
  };

  const getStatusLabel = (status: StudentStatus): string => {
    const labels: Record<StudentStatus, string> = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'trial-completed': 'Trial Completed',
      'trial-ghosted': 'Trial Ghosted',
      'awaiting-payment': 'Awaiting Payment',
      'paid': 'Paid',
      'active': 'Active',
      'expired': 'Expired',
      'cancelled': 'Cancelled',
      'dropped': 'Dropped'
    };

    return labels[status] || status;
  };

  const requiresConfirmation = (from: StudentStatus, to: StudentStatus): { required: boolean, message?: string } => {
    const transition = statusTransitions.find(t => t.from === from && t.to === to);
    return {
      required: transition?.requiresConfirmation || false,
      message: transition?.confirmationMessage
    };
  };

  const isValidStatus = (status: string): status is StudentStatus => {
    const validStatuses: StudentStatus[] = [
      'pending', 'confirmed', 'trial-completed', 'trial-ghosted', 
      'awaiting-payment', 'paid', 'active', 'expired', 'cancelled', 'dropped'
    ];
    return validStatuses.includes(status as StudentStatus);
  };

  return {
    loading,
    validateTransition,
    getAvailableTransitions,
    getStatusLabel,
    requiresConfirmation,
    isValidStatus
  };
};
