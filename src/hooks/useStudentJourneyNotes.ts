
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StudentNote, StudentJourneyData } from '@/types/studentNotes';
import { toast } from 'sonner';

export const useStudentJourneyNotes = (studentId?: string) => {
  const [journeyData, setJourneyData] = useState<StudentJourneyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentJourney = async (id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching student journey for ID:', id);
      
      // Get student basic info
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (studentError) {
        console.error('❌ Student fetch error:', studentError);
        throw new Error(`Failed to fetch student: ${studentError.message}`);
      }

      if (!student) {
        throw new Error('Student not found');
      }

      console.log('✅ Student found:', student.name);

      // Get all notes from different sources
      const notes: StudentNote[] = [];

      // 1. Sales booking notes (from student record)
      if (student.notes) {
        notes.push({
          id: `sales-${id}`,
          studentId: id,
          noteType: 'sales_booking',
          content: student.notes,
          createdBy: student.assigned_sales_agent_id,
          createdAt: student.created_at,
          status: 'pending'
        });
      }

      // 2. Trial outcome notes (with error handling)
      try {
        const { data: trialOutcomes, error: trialError } = await supabase
          .from('trial_outcomes')
          .select(`
            *,
            profiles!trial_outcomes_submitted_by_fkey(full_name)
          `)
          .eq('student_id', id);

        if (trialError) {
          console.warn('⚠️ Trial outcomes fetch error:', trialError.message);
        } else if (trialOutcomes) {
          trialOutcomes.forEach(outcome => {
            const outcomeType = outcome.outcome as 'completed' | 'ghosted';
            notes.push({
              id: outcome.id,
              studentId: id,
              noteType: 'trial_outcome',
              content: outcome.teacher_notes || 'Trial outcome recorded',
              metadata: {
                sessionId: outcome.session_id,
                outcomeType: outcomeType,
                studentBehavior: outcome.student_behavior,
                recommendedPackage: outcome.recommended_package
              },
              createdBy: outcome.submitted_by,
              createdAt: outcome.created_at,
              status: outcomeType === 'completed' ? 'trial-completed' : 'trial-ghosted'
            });
          });
        }
      } catch (trialError) {
        console.warn('⚠️ Error fetching trial outcomes:', trialError);
      }

      // 3. Session completion notes (with error handling)
      try {
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select(`
            *,
            session_students!inner(student_id)
          `)
          .eq('session_students.student_id', id)
          .eq('status', 'completed')
          .not('notes', 'is', null);

        if (sessionsError) {
          console.warn('⚠️ Sessions fetch error:', sessionsError.message);
        } else if (sessions) {
          sessions.forEach(session => {
            if (session.notes) {
              notes.push({
                id: `session-${session.id}`,
                studentId: id,
                noteType: 'session_completion',
                content: session.notes,
                metadata: {
                  sessionId: session.id
                },
                createdBy: student.assigned_teacher_id,
                createdAt: session.completed_at || session.updated_at,
                status: 'active'
              });
            }
          });
        }
      } catch (sessionError) {
        console.warn('⚠️ Error fetching sessions:', sessionError);
      }

      // 4. WhatsApp contact notes (with error handling)
      try {
        const { data: contacts, error: contactsError } = await supabase
          .from('whatsapp_contacts')
          .select(`
            *,
            profiles!whatsapp_contacts_contacted_by_fkey(full_name)
          `)
          .eq('student_id', id)
          .not('notes', 'is', null);

        if (contactsError) {
          console.warn('⚠️ WhatsApp contacts fetch error:', contactsError.message);
        } else if (contacts) {
          contacts.forEach(contact => {
            if (contact.notes) {
              notes.push({
                id: `contact-${contact.id}`,
                studentId: id,
                noteType: 'general',
                content: contact.notes,
                createdBy: contact.contacted_by,
                createdAt: contact.created_at,
                status: student.status
              });
            }
          });
        }
      } catch (contactError) {
        console.warn('⚠️ Error fetching WhatsApp contacts:', contactError);
      }

      // Sort notes by creation date
      notes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Create status history (simplified for now)
      const statusHistory = [
        {
          status: 'pending',
          changedAt: student.created_at,
          changedBy: student.assigned_sales_agent_id,
          notes: student.notes
        }
      ];

      // Add trial completion/ghosting to history (with error handling)
      try {
        const { data: trialOutcomes } = await supabase
          .from('trial_outcomes')
          .select('*')
          .eq('student_id', id)
          .limit(1);

        if (trialOutcomes && trialOutcomes.length > 0) {
          const outcome = trialOutcomes[0];
          const outcomeType = outcome.outcome as 'completed' | 'ghosted';
          statusHistory.push({
            status: outcomeType === 'completed' ? 'trial-completed' : 'trial-ghosted',
            changedAt: outcome.created_at,
            changedBy: outcome.submitted_by,
            notes: outcome.teacher_notes
          });
        }
      } catch (outcomeError) {
        console.warn('⚠️ Error fetching trial outcomes for history:', outcomeError);
      }

      const journeyData: StudentJourneyData = {
        studentId: id,
        currentStatus: student.status,
        notes,
        statusHistory
      };

      console.log('✅ Journey data compiled:', {
        notesCount: notes.length,
        statusHistoryCount: statusHistory.length
      });

      setJourneyData(journeyData);

    } catch (error: any) {
      console.error('❌ Error fetching student journey:', error);
      setError(error.message || 'Failed to load student journey');
      toast.error('Failed to load student journey');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchStudentJourney(studentId);
    }
  }, [studentId]);

  const getNotesForStatus = (status: string): StudentNote[] => {
    if (!journeyData) return [];

    try {
      switch (status) {
        case 'pending':
          return journeyData.notes.filter(note => 
            note.noteType === 'sales_booking' || note.status === 'pending'
          );
        case 'confirmed':
          return journeyData.notes.filter(note => 
            ['sales_booking', 'general'].includes(note.noteType) && 
            ['pending', 'confirmed'].includes(note.status)
          );
        case 'trial-completed':
          return journeyData.notes.filter(note => 
            note.noteType === 'trial_outcome' && note.metadata?.outcomeType === 'completed'
          );
        case 'trial-ghosted':
          return journeyData.notes.filter(note => 
            note.noteType === 'trial_outcome' && note.metadata?.outcomeType === 'ghosted'
          );
        case 'active':
        case 'paid':
          return journeyData.notes; // Show all notes for active/paid students
        default:
          return journeyData.notes.filter(note => note.status === status);
      }
    } catch (error) {
      console.warn('⚠️ Error filtering notes for status:', status, error);
      return [];
    }
  };

  return {
    journeyData,
    loading,
    error,
    getNotesForStatus,
    refreshJourney: () => studentId && fetchStudentJourney(studentId)
  };
};
