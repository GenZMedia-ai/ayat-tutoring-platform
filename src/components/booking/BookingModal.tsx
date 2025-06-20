
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SingleStudentForm } from './SingleStudentForm';
import { MultiStudentForm } from './MultiStudentForm';
import { RoundRobinBookingData } from '@/types/groupedSlots';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoundRobinBookingData, isMultiStudent: boolean) => Promise<boolean>;
  selectedSlot: string;
  selectedDate: Date;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedSlot,
  selectedDate
}) => {
  const [bookingType, setBookingType] = useState<'select' | 'single' | 'multi'>('select');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: RoundRobinBookingData) => {
    setLoading(true);
    const success = await onSubmit(data, bookingType === 'multi');
    setLoading(false);
    
    if (success) {
      onClose();
      setBookingType('select');
    }
  };

  const handleClose = () => {
    onClose();
    setBookingType('select');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Book Trial Session
          </DialogTitle>
          <div className="text-sm text-muted-foreground space-y-1">
            <div><strong>Time:</strong> {selectedSlot}</div>
            <div><strong>Date:</strong> {selectedDate.toDateString()}</div>
          </div>
        </DialogHeader>

        {bookingType === 'select' && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Choose the booking type for this trial session:
            </p>
            <div className="flex gap-4">
              <Button 
                className="flex-1 ayat-button-primary"
                onClick={() => setBookingType('single')}
              >
                Single Student
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setBookingType('multi')}
              >
                Multi Students (Family)
              </Button>
            </div>
          </div>
        )}

        {bookingType === 'single' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setBookingType('select')}
              >
                ← Back
              </Button>
              <h3 className="font-medium">Single Student Booking</h3>
            </div>
            <SingleStudentForm onSubmit={handleSubmit} loading={loading} />
          </div>
        )}

        {bookingType === 'multi' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setBookingType('select')}
              >
                ← Back
              </Button>
              <h3 className="font-medium">Multi Students Booking</h3>
            </div>
            <MultiStudentForm onSubmit={handleSubmit} loading={loading} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
