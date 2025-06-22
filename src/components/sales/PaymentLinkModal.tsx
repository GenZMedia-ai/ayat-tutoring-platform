
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PackageSelectionForm } from './PackageSelectionForm';
import { CustomPriceForm } from './CustomPriceForm';
import { usePackageManagement } from '@/hooks/usePackageManagement';
import { useCurrencyManagement } from '@/hooks/useCurrencyManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TrialSessionFlowStudent } from '@/types/trial';
import { FamilyGroup } from '@/types/family';

interface PaymentLinkModalProps {
  student: TrialSessionFlowStudent | FamilyGroup;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentLinkModal: React.FC<PaymentLinkModalProps> = ({
  student,
  open,
  onClose,
  onSuccess
}) => {
  const { packages } = usePackageManagement();
  const { currencies } = useCurrencyManagement();
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<any>(null);
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const enabledCurrencies = currencies.filter(c => c.is_enabled);
  const activePackages = packages.filter(p => p.is_active);

  // Helper functions to handle both individual students and family groups
  const isIndividualStudent = (data: any): data is TrialSessionFlowStudent => {
    return 'uniqueId' in data && 'name' in data;
  };

  const isFamilyGroup = (data: any): data is FamilyGroup => {
    return 'unique_id' in data && 'parent_name' in data;
  };

  const getStudentId = () => {
    return student.id;
  };

  const getStudentName = () => {
    if (isIndividualStudent(student)) {
      return student.name;
    } else if (isFamilyGroup(student)) {
      return student.parent_name;
    }
    return 'Unknown';
  };

  const getStudentUniqueId = () => {
    if (isIndividualStudent(student)) {
      return student.uniqueId;
    } else if (isFamilyGroup(student)) {
      return student.unique_id;
    }
    return 'Unknown';
  };

  const getStudentAge = () => {
    if (isIndividualStudent(student)) {
      return student.age;
    }
    return null; // Family groups don't have a single age
  };

  const getStudentPhone = () => {
    return student.phone;
  };

  const getStudentCountry = () => {
    return student.country;
  };

  const getStudentStatus = () => {
    return student.status;
  };

  const getStudentCount = () => {
    if (isFamilyGroup(student)) {
      return student.student_count;
    }
    return 1;
  };

  const calculateFinalPrice = () => {
    if (useCustomPrice && customPrice) {
      return parseInt(customPrice);
    }
    return selectedPackage?.price || 0;
  };

  const validateInputs = () => {
    if (!selectedPackage) {
      toast.error('Please select a package');
      return false;
    }
    if (!selectedCurrency) {
      toast.error('Please select a currency');
      return false;
    }
    const finalPrice = calculateFinalPrice();
    if (finalPrice <= 0) {
      toast.error('Please enter a valid price');
      return false;
    }
    return true;
  };

  const validateStudentStatus = () => {
    const studentStatus = getStudentStatus();
    console.log('🔍 Validating student status:', studentStatus);
    
    if (!studentStatus) {
      console.error('❌ Student status is missing');
      toast.error('Student data is incomplete - missing status information');
      return false;
    }
    
    const validStatuses = ['trial-completed', 'trial-ghosted'];
    if (!validStatuses.includes(studentStatus)) {
      toast.error(`Cannot create payment link for student with status: ${studentStatus}. Student must have completed or ghosted trial.`);
      return false;
    }
    return true;
  };

  const createStripePaymentLink = async (finalPrice: number) => {
    console.log('🔗 Creating Stripe payment link...');
    
    const studentId = getStudentId();
    const studentUniqueId = getStudentUniqueId();
    
    const { data, error } = await supabase.functions.invoke('create-payment-link', {
      body: {
        student_ids: [studentId],
        package_id: selectedPackage.id,
        currency: selectedCurrency.code,
        amount: finalPrice,
        payment_type: isFamilyGroup(student) ? 'family_group' : 'single_student',
        metadata: {
          system_name: 'AyatWBian',
          student_unique_id: studentUniqueId,
          payment_type: isFamilyGroup(student) ? 'family_group' : 'single_student',
          package_session_count: selectedPackage.session_count.toString(),
          student_count: getStudentCount().toString()
        }
      }
    });

    if (error) {
      console.error('❌ Stripe edge function error:', error);
      throw new Error(`Payment system error: ${error.message}`);
    }

    console.log('✅ Stripe payment link created:', data);
    return data;
  };

  const updateStudentStatus = async () => {
    console.log('📝 Updating student status to awaiting-payment...');
    
    const studentId = getStudentId();
    const tableName = isFamilyGroup(student) ? 'family_groups' : 'students';
    
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ 
        status: 'awaiting-payment',
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId);

    if (updateError) {
      console.error('❌ Error updating student status:', updateError);
      throw new Error(`Failed to update student status: ${updateError.message}`);
    }

    console.log('✅ Student status updated successfully');
  };

  const handleCreatePaymentLink = async () => {
    if (!validateInputs() || !validateStudentStatus()) return;

    setIsCreating(true);
    const finalPrice = calculateFinalPrice();

    try {
      console.log('🚀 Starting payment link creation process:', {
        studentId: getStudentId(),
        studentName: getStudentName(),
        studentType: isFamilyGroup(student) ? 'family' : 'individual',
        packageId: selectedPackage.id,
        currency: selectedCurrency.code,
        amount: finalPrice
      });

      // Step 1: Create Stripe payment link
      const stripeData = await createStripePaymentLink(finalPrice);

      // Step 2: Update student status to awaiting-payment
      await updateStudentStatus();

      // Step 3: Copy to clipboard and notify success
      if (stripeData?.url) {
        await navigator.clipboard.writeText(stripeData.url);
        toast.success('Payment link created and copied to clipboard!');
      } else {
        toast.success('Payment link created successfully!');
      }

      console.log('🎉 Payment link creation completed successfully');
      onSuccess();

    } catch (error: any) {
      console.error('❌ Payment link creation failed:', error);
      
      const errorMessage = error?.message || 'Unknown error occurred';
      
      if (errorMessage.includes('Payment system error')) {
        toast.error('Payment system error. Please check Stripe configuration.');
      } else if (errorMessage.includes('STRIPE_SECRET_KEY')) {
        toast.error('Stripe not configured. Please contact administrator.');
      } else if (errorMessage.includes('Authentication')) {
        toast.error('Authentication error. Please refresh and try again.');
      } else {
        toast.error(`Failed to create payment link: ${errorMessage}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Payment Link</DialogTitle>
          <DialogDescription>
            Create a payment link for {getStudentName()} ({getStudentUniqueId()})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">
              {isFamilyGroup(student) ? 'Family Group Information' : 'Student Information'}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Name:</span> {getStudentName()}</div>
              {isIndividualStudent(student) && (
                <div><span className="font-medium">Age:</span> {getStudentAge()}</div>
              )}
              {isFamilyGroup(student) && (
                <div><span className="font-medium">Students:</span> {getStudentCount()}</div>
              )}
              <div><span className="font-medium">Phone:</span> {getStudentPhone()}</div>
              <div><span className="font-medium">Country:</span> {getStudentCountry()}</div>
              <div><span className="font-medium">Status:</span> 
                <Badge variant="outline" className="ml-2">{getStudentStatus()}</Badge>
              </div>
              <div><span className="font-medium">Type:</span> 
                <Badge variant="outline" className="ml-2">
                  {isFamilyGroup(student) ? 'Family Group' : 'Individual'}
                </Badge>
              </div>
            </div>
          </div>

          <PackageSelectionForm
            packages={activePackages}
            selectedPackage={selectedPackage}
            onPackageSelect={setSelectedPackage}
            currencies={enabledCurrencies}
            selectedCurrency={selectedCurrency}
            onCurrencySelect={setSelectedCurrency}
          />

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="custom-price"
                checked={useCustomPrice}
                onCheckedChange={setUseCustomPrice}
              />
              <Label htmlFor="custom-price">Use custom negotiated price?</Label>
            </div>

            {useCustomPrice && (
              <CustomPriceForm
                customPrice={customPrice}
                onPriceChange={setCustomPrice}
                currency={selectedCurrency}
              />
            )}
          </div>

          {selectedPackage && selectedCurrency && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Payment Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Package:</span>
                  <span>{selectedPackage.name} ({selectedPackage.session_count} sessions)</span>
                </div>
                <div className="flex justify-between">
                  <span>Currency:</span>
                  <span>{selectedCurrency.name} ({selectedCurrency.symbol})</span>
                </div>
                {isFamilyGroup(student) && (
                  <div className="flex justify-between">
                    <span>Students:</span>
                    <span>{getStudentCount()}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-green-800">
                  <span>Final Price:</span>
                  <span>{selectedCurrency.symbol}{calculateFinalPrice()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleCreatePaymentLink}
              disabled={!selectedPackage || !selectedCurrency || isCreating}
              className="flex-1"
            >
              {isCreating ? 'Creating Payment Link...' : 'Create Payment Link'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
