
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountryPhoneInput } from '@/components/ui/CountryPhoneInput';
import { RoundRobinBookingData } from '@/types/groupedSlots';
import { isValidPhoneNumber } from 'react-phone-number-input';

interface SingleStudentFormProps {
  onSubmit: (data: RoundRobinBookingData) => void;
  loading?: boolean;
}

export const SingleStudentForm: React.FC<SingleStudentFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState<RoundRobinBookingData>({
    studentName: '',
    country: '',
    phone: '',
    platform: 'zoom',
    age: 0,
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.phone || !formData.age) {
      return;
    }
    
    if (!isValidPhoneNumber(formData.phone)) {
      return;
    }
    
    onSubmit(formData);
  };

  const isFormValid = formData.studentName && 
                     formData.phone && 
                     formData.age > 0 && 
                     isValidPhoneNumber(formData.phone);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="studentName">Student Name *</Label>
          <Input
            id="studentName"
            value={formData.studentName}
            onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
            placeholder="Ahmed Hassan"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">Age *</Label>
          <Input
            id="age"
            type="number"
            min="3"
            max="80"
            value={formData.age || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
            placeholder="12"
            required
          />
        </div>
      </div>

      <CountryPhoneInput
        label="WhatsApp Phone"
        value={formData.phone}
        onChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
        required
      />

      <div className="space-y-2">
        <Label htmlFor="platform">Platform *</Label>
        <Select 
          value={formData.platform} 
          onValueChange={(value: 'zoom' | 'google-meet') => setFormData(prev => ({ ...prev, platform: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="zoom">Zoom</SelectItem>
            <SelectItem value="google-meet">Google Meet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any special requirements or notes"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full ayat-button-primary" 
        disabled={loading || !isFormValid}
      >
        {loading ? 'Booking...' : 'Book Trial Session'}
      </Button>
    </form>
  );
};
