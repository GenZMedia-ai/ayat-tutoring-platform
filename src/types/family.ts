
export interface FamilyGroup {
  id: string;
  unique_id: string;
  parent_name: string;
  phone: string;
  country: string;
  platform: 'zoom' | 'google-meet';
  notes?: string;
  status: 'pending' | 'confirmed' | 'trial-completed' | 'trial-ghosted' | 'awaiting-payment' | 'paid' | 'active' | 'expired' | 'cancelled' | 'dropped';
  assigned_teacher_id?: string;
  assigned_sales_agent_id: string;
  assigned_supervisor_id?: string;
  trial_date?: string;
  trial_time?: string;
  teacher_type: 'kids' | 'adult' | 'mixed' | 'expert';
  student_count: number;
  created_at: string;
  updated_at: string;
}

export interface FamilyStudent {
  id: string;
  unique_id: string;
  name: string;
  age: number;
  family_group_id: string;
  // Other student properties are inherited from family group
}

export interface FamilyBookingResponse {
  success: boolean;
  teacher_name: string;
  teacher_id: string;
  session_id: string;
  family_group_id: string;
  family_unique_id: string;
  student_names: string;
  student_count: number;
  booked_time_slot: string;
  notifications_sent?: boolean;
}
