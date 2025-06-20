
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookingData } from '@/hooks/useSalesAvailability';

interface MultiStudentFormProps {
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

export const MultiStudentForm: React.FC<MultiStudentFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState<BookingData>({
    studentName: '',
    country: '',
    phone: '',
    platform: 'zoom',
    age: 0,
    parentName: '',
    students: [{ name: '', age: 0 }, { name: '', age: 0 }]
  });

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [studentCount, setStudentCount] = useState<number>(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.parentName || !formData.country || !formData.phone || !formData.students?.every(s => s.name && s.age)) {
      return;
    }

    // Add country prefix to phone number before submitting
    const countryData = countries.find(c => c.code === formData.country);
    const fullPhoneNumber = countryData ? `${countryData.prefix}${formData.phone}` : formData.phone;

    onSubmit({
      ...formData,
      phone: fullPhoneNumber,
    });
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setFormData(prev => ({ ...prev, country: countryCode, phone: '' }));
  };

  const handleStudentCountChange = (count: number) => {
    setStudentCount(count);
    const newStudents = Array.from({ length: count }, (_, i) => 
      formData.students?.[i] || { name: '', age: 0 }
    );
    setFormData(prev => ({ ...prev, students: newStudents }));
  };

  const updateStudent = (index: number, field: 'name' | 'age', value: string | number) => {
    const newStudents = [...(formData.students || [])];
    newStudents[index] = { ...newStudents[index], [field]: value };
    setFormData(prev => ({ ...prev, students: newStudents }));
  };

  const selectedCountryData = countries.find(c => c.code === selectedCountry);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Parent Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-lg">Parent Information</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="parentName">Parent Name *</Label>
            <Input
              id="parentName"
              value={formData.parentName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
              placeholder="Ahmed Al-Rashid"
              required
            />
          </div>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <div className="space-y-2">
            <Label htmlFor="platform">Platform Preference *</Label>
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
        </div>
      </div>

      {/* Students Information */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-lg">Students Information</h4>
          <div className="flex items-center gap-2">
            <Label htmlFor="studentCount">How many students?</Label>
            <Select value={studentCount.toString()} onValueChange={(value) => handleStudentCountChange(parseInt(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5].map(num => (
                  <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {formData.students?.map((student, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 p-3 border border-border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor={`student-${index}-name`}>Student {index + 1} Name *</Label>
                <Input
                  id={`student-${index}-name`}
                  value={student.name}
                  onChange={(e) => updateStudent(index, 'name', e.target.value)}
                  placeholder={`Student ${index + 1} name`}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`student-${index}-age`}>Age *</Label>
                <Input
                  id={`student-${index}-age`}
                  type="number"
                  min="3"
                  max="80"
                  value={student.age || ''}
                  onChange={(e) => updateStudent(index, 'age', parseInt(e.target.value) || 0)}
                  placeholder="Age"
                  required
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full ayat-button-primary" disabled={loading}>
        {loading ? 'Booking...' : 'Book Family Trial'}
      </Button>
    </form>
  );
};
