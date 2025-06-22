
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

interface PaymentLinkModalProps {
  student: any;
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

  const calculateFinalPrice = () => {
    if (useCustomPrice && customPrice) {
      return parseInt(customPrice);
    }
    return selectedPackage?.price || 0;
  };

  const handleCreatePaymentLink = async () => {
    if (!selectedPackage || !selectedCurrency) {
      toast.error('Please select a package and currency');
      return;
    }

    const finalPrice = calculateFinalPrice();
    if (finalPrice <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsCreating(true);

    try {
      console.log('🔗 Creating payment link for student:', {
        studentId: student.id,
        studentName: student.name,
        packageId: selectedPackage.id,
        currency: selectedCurrency.code,
        amount: finalPrice
      });

      // Call Stripe edge function to create payment link
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: {
          student_ids: [student.id],
          package_id: selectedPackage.id,
          currency: selectedCurrency.code,
          amount: finalPrice,
          payment_type: 'single_student',
          metadata: {
            system_name: 'AyatWBian',
            student_unique_id: student.uniqueId,
            payment_type: 'single_student',
            package_session_count: selectedPackage.session_count.toString()
          }
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      console.log('✅ Payment link created successfully:', data);

      // Update student status to awaiting payment
      const { error: updateError } = await supabase
        .from('students')
        .update({ status: 'awaiting-payment' })
        .eq('id', student.id);

      if (updateError) {
        console.error('❌ Error updating student status:', updateError);
        throw updateError;
      }

      console.log('✅ Student status updated to awaiting-payment');

      // Copy payment link to clipboard
      if (data?.url) {
        await navigator.clipboard.writeText(data.url);
        toast.success('Payment link created and copied to clipboard!');
      }

      onSuccess();
    } catch (error) {
      console.error('❌ Error creating payment link:', error);
      
      // Provide more specific error messages
      if (error?.message?.includes('status_check')) {
        toast.error('Status update failed - database constraint error. Please contact support.');
      } else if (error?.message?.includes('stripe')) {
        toast.error('Stripe configuration error. Please check payment settings.');
      } else {
        toast.error(`Failed to create payment link: ${error?.message || 'Unknown error'}`);
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
            Create a payment link for {student.name} ({student.uniqueId})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Student Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Name:</span> {student.name}</div>
              <div><span className="font-medium">Age:</span> {student.age}</div>
              <div><span className="font-medium">Phone:</span> {student.phone}</div>
              <div><span className="font-medium">Country:</span> {student.country}</div>
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
              {isCreating ? 'Creating...' : 'Create Payment Link'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
