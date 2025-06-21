
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

      setFamilyGroups(data || []);
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
            ? { ...family, status: newStatus as any, updated_at: new Date().toISOString() }
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
