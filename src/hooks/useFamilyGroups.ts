
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FamilyGroup } from '@/types/family';
import { toast } from 'sonner';

export const useFamilyGroups = () => {
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFamilyGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('family_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching family groups:', error);
        toast.error('Failed to load family groups');
        return;
      }

      // Type-safe mapping from database schema to our interface
      const mappedFamilyGroups: FamilyGroup[] = (data || []).map(row => ({
        id: row.id,
        unique_id: row.unique_id,
        parent_name: row.parent_name,
        phone: row.phone,
        country: row.country,
        platform: row.platform as 'zoom' | 'google-meet',
        notes: row.notes || undefined,
        status: row.status as FamilyGroup['status'],
        assigned_teacher_id: row.assigned_teacher_id || undefined,
        assigned_sales_agent_id: row.assigned_sales_agent_id,
        assigned_supervisor_id: row.assigned_supervisor_id || undefined,
        trial_date: row.trial_date || undefined,
        trial_time: row.trial_time || undefined,
        teacher_type: row.teacher_type as FamilyGroup['teacher_type'],
        student_count: row.student_count,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      setFamilyGroups(mappedFamilyGroups);
    } catch (error) {
      console.error('Exception fetching family groups:', error);
      toast.error('Failed to load family groups');
    } finally {
      setLoading(false);
    }
  };

  const updateFamilyStatus = async (familyId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('family_groups')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', familyId);

      if (error) {
        console.error('Error updating family status:', error);
        toast.error('Failed to update family status');
        return false;
      }

      // Update local state
      setFamilyGroups(prev => 
        prev.map(family => 
          family.id === familyId 
            ? { ...family, status: newStatus as FamilyGroup['status'], updated_at: new Date().toISOString() }
            : family
        )
      );

      toast.success('Family status updated successfully');
      return true;
    } catch (error) {
      console.error('Exception updating family status:', error);
      toast.error('Failed to update family status');
      return false;
    }
  };

  useEffect(() => {
    fetchFamilyGroups();
  }, []);

  return {
    familyGroups,
    loading,
    fetchFamilyGroups,
    updateFamilyStatus
  };
};
