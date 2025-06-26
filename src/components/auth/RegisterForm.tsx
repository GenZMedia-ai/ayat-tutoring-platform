
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { TeacherType } from '@/types';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface RegisterFormProps {
  onBackToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin }) => {
  const { register, validateInvitationCode, loading } = useAuth();
  const [step, setStep] = useState<'code' | 'form'>('code');
  const [roleFromCode, setRoleFromCode] = useState<string>('');
  const [codeValidating, setCodeValidating] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    invitationCode: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    teacherType: '',
    language: 'en' as 'en' | 'ar'
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters';
        return '';
      case 'email':
        if (!value) return 'Email is required';
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      case 'phone':
        if (!value) return 'Phone number is required';
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid phone number';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Real-time validation for password confirmation
    if (name === 'confirmPassword' || name === 'password') {
      if (name === 'confirmPassword' && value !== formData.password) {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else if (name === 'password' && formData.confirmPassword && value !== formData.confirmPassword) {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }
  };

  const handleCodeValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.invitationCode.trim()) {
      toast.error('Please enter an invitation code');
      return;
    }

    setCodeValidating(true);
    console.log('🔧 Starting code validation for:', formData.invitationCode);
    
    try {
      const result = await validateInvitationCode(formData.invitationCode);
      
      console.log('📋 Validation result:', result);
      
      if (result.valid && result.role) {
        setRoleFromCode(result.role);
        setStep('form');
        toast.success(`Code validated! Registering as ${result.role}`, {
          icon: <CheckCircle className="w-4 h-4" />
        });
      } else {
        const errorMessage = result.error || 'Invalid or expired invitation code';
        console.error('❌ Code validation failed:', errorMessage);
        toast.error(errorMessage, {
          icon: <AlertCircle className="w-4 h-4" />
        });
      }
    } catch (error) {
      console.error('❌ Code validation error:', error);
      toast.error('Failed to validate code. Please try again.');
    } finally {
      setCodeValidating(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const errors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'invitationCode' && key !== 'teacherType') {
        const error = validateField(key, formData[key as keyof typeof formData]);
        if (error) errors[key] = error;
      }
    });

    // Validate teacher type for teachers
    if (roleFromCode === 'teacher' && !formData.teacherType) {
      errors.teacherType = 'Please select a teacher type';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please fix the errors below');
      return;
    }

    setFormSubmitting(true);

    try {
      const registrationData = {
        invitationCode: formData.invitationCode,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        teacherType: formData.teacherType as TeacherType,
        language: formData.language
      };

      const result = await register(registrationData);
      
      if (result.success) {
        toast.success('Registration successful! Please check your email to verify your account, then wait for admin approval.', {
          duration: 6000,
          icon: <CheckCircle className="w-4 h-4" />
        });
        onBackToLogin();
      } else {
        toast.error(result.error || 'Registration failed. Please try again.', {
          icon: <AlertCircle className="w-4 h-4" />
        });
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  if (step === 'code') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="brand-gradient w-12 h-12 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">AW</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Join Our Team</CardTitle>
          <CardDescription className="text-center">
            Enter your invitation code to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCodeValidation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invitationCode">Invitation Code</Label>
              <Input
                id="invitationCode"
                name="invitationCode"
                placeholder="Enter your invitation code"
                value={formData.invitationCode}
                onChange={(e) => handleFieldChange('invitationCode', e.target.value.toUpperCase())}
                disabled={codeValidating}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full ayat-button-primary"
              disabled={codeValidating || !formData.invitationCode.trim()}
            >
              {codeValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                'Validate Code'
              )}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full"
              onClick={onBackToLogin}
              disabled={codeValidating}
            >
              Back to Login
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Test with invitation code:</p>
            <div className="mt-2 text-xs">
              <p className="font-mono">ADMIN2025 - Admin Role</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Complete Registration</CardTitle>
        <CardDescription className="text-center">
          Registering as: <span className="font-semibold capitalize">{roleFromCode}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegistration} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Your full name"
              value={formData.fullName}
              onChange={(e) => handleFieldChange('fullName', e.target.value)}
              disabled={formSubmitting}
              className={fieldErrors.fullName ? 'border-red-500' : ''}
              required
            />
            {fieldErrors.fullName && (
              <p className="text-sm text-red-500">{fieldErrors.fullName}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              disabled={formSubmitting}
              className={fieldErrors.email ? 'border-red-500' : ''}
              required
            />
            {fieldErrors.email && (
              <p className="text-sm text-red-500">{fieldErrors.email}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (WhatsApp)</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="+1234567890"
              value={formData.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              disabled={formSubmitting}
              className={fieldErrors.phone ? 'border-red-500' : ''}
              required
            />
            {fieldErrors.phone && (
              <p className="text-sm text-red-500">{fieldErrors.phone}</p>
            )}
          </div>

          {roleFromCode === 'teacher' && (
            <div className="space-y-2">
              <Label htmlFor="teacherType">Teacher Type</Label>
              <Select 
                value={formData.teacherType} 
                onValueChange={(value) => handleFieldChange('teacherType', value)}
                disabled={formSubmitting}
              >
                <SelectTrigger className={fieldErrors.teacherType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select teacher type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kids">Kids</SelectItem>
                  <SelectItem value="adult">Adult</SelectItem>
                  <SelectItem value="mixed">Mixed (Kids + Adult)</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.teacherType && (
                <p className="text-sm text-red-500">{fieldErrors.teacherType}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="language">Preferred Language</Label>
            <Select 
              value={formData.language} 
              onValueChange={(value: 'en' | 'ar') => handleFieldChange('language', value)}
              disabled={formSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              disabled={formSubmitting}
              className={fieldErrors.password ? 'border-red-500' : ''}
              required
            />
            {fieldErrors.password && (
              <p className="text-sm text-red-500">{fieldErrors.password}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
              disabled={formSubmitting}
              className={fieldErrors.confirmPassword ? 'border-red-500' : ''}
              required
            />
            {fieldErrors.confirmPassword && (
              <p className="text-sm text-red-500">{fieldErrors.confirmPassword}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full ayat-button-primary"
            disabled={formSubmitting || Object.keys(fieldErrors).some(key => fieldErrors[key])}
          >
            {formSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              'Complete Registration'
            )}
          </Button>
          
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full"
            onClick={() => setStep('code')}
            disabled={formSubmitting}
          >
            Back to Code Entry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;
