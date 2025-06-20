
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookingData } from '@/hooks/useSalesAvailability';

interface SingleStudentFormProps {
  onSubmit: (data: BookingData) => void;
  loading?: boolean;
}

const countries = [
  { code: 'SA', name: 'Saudi Arabia', prefix: '+966' },
  { code: 'AE', name: 'UAE', prefix: '+971' },
  { code: 'QA', name: 'Qatar', prefix: '+974' },
  { code: 'KW', name: 'Kuwait', prefix: '+965' },
  { code: 'BH', name: 'Bahrain', prefix: '+973' },
  { code: 'OM', name: 'Oman', prefix: '+968' },
  { code: 'EG', name: 'Egypt', prefix: '+20' }
];

export const SingleStudentForm: React.FC<SingleStudentFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState<BookingData>({
    studentName: '',
    country: '',
    phone: '',
    platform: 'zoom',
    age: 0,
    notes: ''
  });

  const [selectedCountry, setSelectedCountry] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.country || !formData.phone || !formData.age) {
      return;
    }
    onSubmit(formData);
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setFormData(prev => ({ ...prev, country: countryCode, phone: '' }));
  };

  const selectedCountryData = countries.find(c => c.code === selectedCountry);

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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Select value={selectedCountry} onValueChange={handleCountryChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">WhatsApp Phone *</Label>
          <div className="flex">
            {selectedCountryData && (
              <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                {selectedCountryData.prefix}
              </span>
            )}
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="501234567"
              className={selectedCountryData ? "rounded-l-none" : ""}
              required
            />
          </div>
        </div>
      </div>

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

      <Button type="submit" className="w-full ayat-button-primary" disabled={loading}>
        {loading ? 'Booking...' : 'Book Trial Session'}
      </Button>
    </form>
  );
};
