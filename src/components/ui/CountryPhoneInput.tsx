
import React from 'react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Label } from '@/components/ui/label';

interface CountryPhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  label,
  value,
  onChange,
  required = false,
  className = ''
}) => {
  const isValid = value ? isValidPhoneNumber(value) : true;

  return (
    <div className="space-y-2">
      <Label htmlFor="phone">
        {label} {required && '*'}
      </Label>
      <PhoneInput
        international
        defaultCountry="SA"
        value={value}
        onChange={(val) => onChange(val || '')}
        className={`phone-input ${className} ${!isValid ? 'border-red-500' : ''}`}
        style={{
          '--PhoneInputCountryFlag-height': '1em',
          '--PhoneInputCountrySelectArrow-color': '#6b7280',
          '--PhoneInput-color--focus': '#2563eb'
        }}
      />
      {!isValid && value && (
        <p className="text-sm text-red-600">Please enter a valid phone number</p>
      )}
    </div>
  );
};
