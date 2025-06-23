
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FamilyPackageSelection {
  id: string;
  student_id: string;
  package_id: string;
  custom_price?: number;
  currency: string;
  notes?: string;
}

interface StudentPackageSelection {
  student_id: string;
  student_name: string;
  student_age: number;
  package_id?: string;
  custom_price?: number;
  use_custom_price: boolean;
}

export const useFamilyPackageSelections = (familyGroupId?: string) => {
  const [selections, setSelections] = useState<StudentPackageSelection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState<string>('');
  const { toast } = useToast();

  // Load existing selections and family students
  useEffect(() => {
    if (!familyGroupId) return;

    const loadFamilyData = async () => {
      setIsLoading(true);
      try {
        // Get family students
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('id, name, age')
          .eq('family_group_id', familyGroupId)
          .order('name');

        if (studentsError) throw studentsError;

        // Get existing package selections
        const { data: existingSelections, error: selectionsError } = await supabase
          .from('family_package_selections')
          .select('*')
          .eq('family_group_id', familyGroupId);

        if (selectionsError) throw selectionsError;

        // Merge student data with existing selections
        const mergedSelections = students?.map(student => {
          const existingSelection = existingSelections?.find(
            sel => sel.student_id === student.id
          );

          return {
            student_id: student.id,
            student_name: student.name,
            student_age: student.age,
            package_id: existingSelection?.package_id,
            custom_price: existingSelection?.custom_price,
            use_custom_price: !!existingSelection?.custom_price,
          };
        }) || [];

        setSelections(mergedSelections);

        // Set currency from first selection if available
        if (existingSelections && existingSelections.length > 0) {
          setCurrency(existingSelections[0].currency);
        }

      } catch (error: any) {
        console.error('Failed to load family package data:', error);
        toast({
          title: "Error",
          description: "Failed to load family package selections",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFamilyData();
  }, [familyGroupId, toast]);

  const updateSelection = (
    studentId: string, 
    field: keyof StudentPackageSelection, 
    value: any
  ) => {
    setSelections(prev => prev.map(selection => 
      selection.student_id === studentId 
        ? { ...selection, [field]: value }
        : selection
    ));
  };

  const saveSelection = async (
    studentId: string,
    packageId: string,
    customPrice?: number,
    selectedCurrency: string = 'USD'
  ) => {
    if (!familyGroupId) return false;

    try {
      const { data, error } = await supabase.rpc('upsert_family_package_selection', {
        p_family_group_id: familyGroupId,
        p_student_id: studentId,
        p_package_id: packageId,
        p_custom_price: customPrice,
        p_currency: selectedCurrency.toUpperCase(),
        p_notes: null
      });

      if (error) throw error;

      // Update local currency state
      setCurrency(selectedCurrency.toUpperCase());

      console.log('✅ Package selection saved:', data);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to save package selection:', error);
      toast({
        title: "Error",
        description: `Failed to save selection: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const calculateTotal = (packages: any[], selectedCurrency: any) => {
    if (!selectedCurrency) return 0;

    return selections.reduce((total, selection) => {
      if (!selection.package_id) return total;

      const selectedPackage = packages.find(p => p.id === selection.package_id);
      if (!selectedPackage) return total;

      const price = selection.use_custom_price && selection.custom_price 
        ? selection.custom_price 
        : selectedPackage.price;

      return total + price;
    }, 0);
  };

  const validateSelections = () => {
    const incomplete = selections.filter(s => !s.package_id);
    const isComplete = incomplete.length === 0 && selections.length > 0;
    
    return {
      isComplete,
      missingCount: incomplete.length,
      totalCount: selections.length
    };
  };

  const getPaymentData = async () => {
    if (!familyGroupId) return null;

    try {
      const { data, error } = await supabase.rpc('calculate_family_payment_total', {
        p_family_group_id: familyGroupId
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('❌ Failed to calculate payment total:', error);
      return null;
    }
  };

  return {
    selections,
    currency,
    isLoading,
    updateSelection,
    saveSelection,
    calculateTotal,
    validateSelections,
    getPaymentData,
    setCurrency
  };
};
