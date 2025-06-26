
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { TeacherType } from '@/types';

interface RegisterFormProps {
  onBackToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin }) => {
  const { register, validateInvitationCode, loading } = useAuth();
  const [step, setStep] = useState<'code' | 'form'>('code');
  const [roleFromCode, setRoleFromCode] = useState<string>('');
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

  const handleCodeValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.invitationCode) {
      toast.error('Please enter an invitation code');
      return;
    }

    console.log('🔧 Starting code validation for:', formData.invitationCode);
    
    const result = await validateInvitationCode(formData.invitationCode);
    
    console.log('📋 Validation result:', result);
    
    if (result.valid && result.role) {
      setRoleFromCode(result.role);
      setStep('form');
      toast.success(`Code validated! Registering as ${result.role}`);
    } else {
      const errorMessage = result.error || 'Invalid or expired invitation code';
      console.error('❌ Code validation failed:', errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (roleFromCode === 'teacher' && !formData.teacherType) {
      toast.error('Please select a teacher type');
      return;
    }

    const registrationData = {
      invitationCode: formData.invitationCode,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      teacherType: formData.teacherType as TeacherType,
      language: formData.language
    };

    const success = await register(registrationData);
    if (success) {
      toast.success('Registration successful! Please check your email to verify your account, then wait for admin approval.');
      onBackToLogin();
    } else {
      toast.error('Registration failed. Please try again.');
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
                onChange={(e) => handleChange('invitationCode', e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full ayat-button-primary"
              disabled={loading}
            >
              {loading ? 'Validating...' : 'Validate Code'}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full"
              onClick={onBackToLogin}
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
              onChange={(e) => handleChange('fullName', e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (WhatsApp)</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="+1234567890"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              required
            />
          </div>

          {roleFromCode === 'teacher' && (
            <div className="space-y-2">
              <Label htmlFor="teacherType">Teacher Type</Label>
              <Select value={formData.teacherType} onValueChange={(value) => handleChange('teacherType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kids">Kids</SelectItem>
                  <SelectItem value="adult">Adult</SelectItem>
                  <SelectItem value="mixed">Mixed (Kids + Adult)</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="language">Preferred Language</Label>
            <Select value={formData.language} onValueChange={(value: 'en' | 'ar') => handleChange('language', value)}>
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
              onChange={(e) => handleChange('password', e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full ayat-button-primary"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Complete Registration'}
          </Button>
          
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full"
            onClick={() => setStep('code')}
          >
            Back to Code Entry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;
