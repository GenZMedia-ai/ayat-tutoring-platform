
import { toast } from 'sonner';

export const validateTeacherTodayRestriction = (
  userRole: string | undefined,
  date: Date,
  operation: string = 'modify'
): boolean => {
  // Only apply restrictions to teachers
  if (userRole !== 'teacher') {
    console.log('✅ Non-teacher user - no restrictions applied for:', operation);
    return true;
  }

  // Check if the date is today in Egypt timezone
  const today = new Date();
  const egyptToday = new Date(today.toLocaleString("en-US", {timeZone: "Africa/Cairo"}));
  const isToday = date.toDateString() === egyptToday.toDateString();

  if (isToday) {
    console.log(`❌ Teacher attempting to ${operation} today's availability - blocked`);
    toast.error(`Cannot ${operation} today's availability. Today's schedule is locked to prevent disruption of confirmed bookings.`);
    return false;
  }

  console.log(`✅ Teacher operation allowed - not today's date for: ${operation}`);
  return true;
};

export const isAdminOrSupervisor = (userRole: string | undefined): boolean => {
  return userRole === 'admin' || userRole === 'supervisor';
};

export const canModifyTodayAvailability = (userRole: string | undefined): boolean => {
  // Admins and supervisors can always modify today's availability
  // Teachers cannot modify today's availability
  return isAdminOrSupervisor(userRole);
};
