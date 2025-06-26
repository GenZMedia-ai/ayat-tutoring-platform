
export interface StudentNote {
  id: string;
  studentId: string;
  noteType: 'sales_booking' | 'trial_outcome' | 'session_completion' | 'status_change' | 'general';
  content: string;
  metadata?: {
    sessionId?: string;
    outcomeType?: 'completed' | 'ghosted';
    studentBehavior?: string;
    recommendedPackage?: string;
    statusFrom?: string;
    statusTo?: string;
  };
  createdBy: string;
  createdAt: string;
  status: string; // The student status when this note was created
}

export interface StudentJourneyData {
  studentId: string;
  currentStatus: string;
  notes: StudentNote[];
  statusHistory: {
    status: string;
    changedAt: string;
    changedBy: string;
    notes?: string;
  }[];
}

export interface NotesDisplayConfig {
  showForStatus: string[];
  noteTypes: string[];
  title: string;
  icon?: string;
}
