export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  teacherType?: TeacherType;
  language: 'en' | 'ar';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  telegramChatId?: string;
  telegramUserId?: string;
  telegramUsername?: string;
  telegramVerified?: boolean;
  telegramLinkedAt?: string;
}

export type UserRole = 'admin' | 'sales' | 'teacher' | 'supervisor';

export type TeacherType = 'kids' | 'adult' | 'mixed' | 'expert';

export interface InvitationCode {
  id: string;
  code: string;
  role: UserRole;
  createdBy: string;
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number; // Currency-neutral base price
  sessionCount: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  isEnabled: boolean;
}

export interface Student {
  id: string;
  uniqueId: string; // AYB_2025_001234 format
  name: string;
  age: number;
  phone: string; // WhatsApp number
  country: string;
  platform: 'zoom' | 'google-meet';
  notes?: string;
  status: StudentStatus;
  parentName?: string; // For multi-student bookings
  assignedTeacher?: string;
  assignedSalesAgent: string;
  assignedSupervisor?: string;
  trialDate?: string;
  trialTime?: string;
  teacherType: TeacherType;
  createdAt: string;
  updatedAt: string;
  paymentData?: PaymentData;
  sessions?: Session[];
  familyGroupId?: string; // New field for family grouping
}

// New interface for Family Groups
export interface FamilyGroup {
  id: string;
  uniqueId: string; // AYB_2025_FAM_001234 format
  parentName: string;
  phone: string; // WhatsApp number with country code
  country: string;
  platform: 'zoom' | 'google-meet';
  notes?: string;
  status: StudentStatus;
  assignedTeacher?: string;
  assignedSalesAgent: string;
  assignedSupervisor?: string;
  trialDate?: string;
  trialTime?: string;
  teacherType: TeacherType;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
  students?: Student[]; // Associated students
}

export type StudentStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'trial-completed' 
  | 'trial-ghosted'
  | 'awaiting-payment'
  | 'paid' 
  | 'active' 
  | 'expired'
  | 'cancelled'
  | 'dropped';

export interface PaymentData {
  stripeSessionId: string;
  amount: number;
  currency: string;
  packageId: string;
  sessionCount: number;
  paymentDate: string;
}

export interface Session {
  id: string;
  studentId: string;
  sessionNumber: number;
  scheduledDate: string;
  scheduledTime: string;
  actualMinutes?: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  completedAt?: string;
  rescheduleCount: number;
}

export interface TeacherAvailability {
  teacherId: string;
  date: string;
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  startTime: string; // HH:mm format
  endTime: string;
  isAvailable: boolean;
  isBooked: boolean;
  studentId?: string;
}

export interface QuickAvailabilitySearch {
  date: string;
  timezone: string;
  teacherType: TeacherType;
  startHour: number;
  endHour: number;
}

export interface AvailableSlot {
  timeSlot: string;
  availableTeachers: number;
  teacherIds: string[];
}
