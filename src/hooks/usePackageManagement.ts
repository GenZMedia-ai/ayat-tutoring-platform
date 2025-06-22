
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  session_count: number;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export const usePackageManagement = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  const createPackage = async (packageData: Omit<Package, 'id' | 'created_at' | 'created_by'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('packages')
        .insert([{
          ...packageData,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchPackages();
      toast.success('Package created successfully');
      return data;
    } catch (error) {
      console.error('Error creating package:', error);
      toast.error('Failed to create package');
      throw error;
    }
  };

  const updatePackage = async (id: string, updates: Partial<Package>) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchPackages();
      toast.success('Package updated successfully');
    } catch (error) {
      console.error('Error updating package:', error);
      toast.error('Failed to update package');
      throw error;
    }
  };

  const deletePackage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchPackages();
      toast.success('Package deleted successfully');
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Failed to delete package');
      throw error;
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return {
    packages,
    loading,
    createPackage,
    updatePackage,
    deletePackage,
    refetch: fetchPackages
  };
};
