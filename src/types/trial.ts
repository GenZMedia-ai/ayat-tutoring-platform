
export interface TrialOutcome {
  id: string;
  studentId: string;
  sessionId?: string;
  outcome: 'completed' | 'ghosted' | 'rescheduled';
  teacherNotes?: string;
  studentBehavior?: string;
  recommendedPackage?: string;
  submittedBy: string;
  submittedAt: string;
  createdAt: string;
}

export interface WhatsAppContact {
  id: string;
  studentId: string;
  contactedBy: string;
  contactedAt: string;
  attemptNumber: number;
  contactType: 'trial_confirmation' | 'follow_up' | 'reminder';
  success: boolean;
  notes?: string;
  createdAt: string;
}

export interface PaymentLink {
  id: string;
  studentIds: string[];
  packageId?: string;
  currency: string;
  amount: number;
  stripeSessionId?: string;
  createdBy: string;
  expiresAt: string;
  clickedAt?: string;
  paidAt?: string;
  status: 'pending' | 'clicked' | 'expired' | 'paid';
  createdAt: string;
  updatedAt: string;
}

export interface SalesFollowUp {
  id: string;
  studentId: string;
  salesAgentId: string;
  scheduledDate: string;
  reason: string;
  completed: boolean;
  completedAt?: string;
  outcome?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrialSessionFlowStudent extends Student {
  lastWhatsAppContact?: WhatsAppContact;
  pendingFollowUp?: SalesFollowUp;
  trialOutcome?: TrialOutcome;
  paymentLink?: PaymentLink;
}
