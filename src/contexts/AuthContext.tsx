
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { User as AppUser, TeacherType, UserRole } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  validateInvitationCode: (code: string) => Promise<{ valid: boolean; role?: string; error?: string }>;
  refreshUserProfile: () => Promise<void>;
}

interface RegisterData {
  invitationCode: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  teacherType?: TeacherType;
  language: 'en' | 'ar';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Email validation helper
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

// Password validation helper
const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// Phone validation helper
const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, retries: number = 3): Promise<AppUser | null> => {
    try {
      console.log('🔍 Fetching user profile for:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        
        // If profile doesn't exist and we have retries left, wait and retry
        if (error.code === 'PGRST116' && retries > 0) {
          console.log('🔄 Profile not found, retrying in 1 second...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchUserProfile(userId, retries - 1);
        }
        
        return null;
      }

      if (!profile) {
        console.error('❌ Profile not found for user:', userId);
        return null;
      }

      console.log('✅ Profile loaded successfully:', profile.role);
      
      return {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        phone: profile.phone,
        role: profile.role as UserRole,
        language: profile.language as 'en' | 'ar',
        status: profile.status as 'pending' | 'approved' | 'rejected',
        createdAt: profile.created_at,
        teacherType: profile.teacher_type as TeacherType | undefined,
        approvedBy: profile.approved_by,
        approvedAt: profile.approved_at,
        telegramChatId: profile.telegram_chat_id,
        telegramUserId: profile.telegram_user_id,
        telegramUsername: profile.telegram_username,
        telegramVerified: profile.telegram_verified,
        telegramLinkedAt: profile.telegram_linked_at
      };
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error);
      return null;
    }
  };

  const refreshUserProfile = async (): Promise<void> => {
    if (!session?.user) return;
    
    const profile = await fetchUserProfile(session.user.id);
    setUser(profile);
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        
        if (session?.user) {
          // Use setTimeout to defer Supabase calls and prevent deadlock
          setTimeout(async () => {
            if (!mounted) return;
            
            const profile = await fetchUserProfile(session.user.id);
            if (mounted) {
              setUser(profile);
              setLoading(false);
            }
          }, 100);
        } else {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      if (session?.user) {
        setTimeout(async () => {
          if (!mounted) return;
          
          const profile = await fetchUserProfile(session.user.id);
          if (mounted) {
            setUser(profile);
            setLoading(false);
          }
        }, 100);
      } else {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Validate input
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }
      
      if (!isValidEmail(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      
      console.log('🔐 Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        
        // Provide user-friendly error messages
        switch (error.message) {
          case 'Invalid login credentials':
            return { success: false, error: 'Invalid email or password. Please check your credentials and try again.' };
          case 'Email not confirmed':
            return { success: false, error: 'Please check your email and click the confirmation link before signing in.' };
          case 'Too many requests':
            return { success: false, error: 'Too many login attempts. Please wait a few minutes and try again.' };
          default:
            return { success: false, error: error.message || 'Login failed. Please try again.' };
        }
      }

      if (!data.user) {
        return { success: false, error: 'Login failed. Please try again.' };
      }

      console.log('✅ Login successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Logging out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Logout error:', error);
        toast.error('Error signing out');
      } else {
        console.log('✅ Logout successful');
        toast.success('Signed out successfully');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast.error('Error signing out');
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Validate input
      if (!userData.fullName?.trim()) {
        return { success: false, error: 'Full name is required' };
      }
      
      if (!isValidEmail(userData.email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      
      if (!isValidPhone(userData.phone)) {
        return { success: false, error: 'Please enter a valid phone number' };
      }
      
      if (!isValidPassword(userData.password)) {
        return { success: false, error: 'Password must be at least 6 characters long' };
      }
      
      console.log('📝 Starting registration process...');
      
      // First validate the invitation code and get the role
      const codeValidation = await validateInvitationCode(userData.invitationCode);
      if (!codeValidation.valid || !codeValidation.role) {
        return { success: false, error: codeValidation.error || 'Invalid invitation code' };
      }

      console.log('🎫 Invitation code validated, role:', codeValidation.role);

      // Create the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: userData.fullName.trim(),
            phone: userData.phone.trim(),
            role: codeValidation.role,
            teacher_type: userData.teacherType,
            language: userData.language
          }
        }
      });

      if (error) {
        console.error('❌ Registration error:', error);
        
        // Provide user-friendly error messages
        switch (error.message) {
          case 'User already registered':
            return { success: false, error: 'An account with this email already exists. Please try signing in instead.' };
          case 'Password should be at least 6 characters':
            return { success: false, error: 'Password must be at least 6 characters long' };
          case 'Unable to validate email address: invalid format':
            return { success: false, error: 'Please enter a valid email address' };
          default:
            return { success: false, error: error.message || 'Registration failed. Please try again.' };
        }
      }

      if (!data.user) {
        return { success: false, error: 'Registration failed. Please try again.' };
      }

      console.log('✅ User created successfully');

      // Update invitation code usage
      try {
        const { data: currentCode, error: fetchError } = await supabase
          .from('invitation_codes')
          .select('used_count')
          .eq('code', userData.invitationCode)
          .single();

        if (!fetchError && currentCode) {
          await supabase
            .from('invitation_codes')
            .update({ used_count: (currentCode.used_count || 0) + 1 })
            .eq('code', userData.invitationCode);
          
          console.log('📊 Invitation code usage updated');
        }
      } catch (inviteError) {
        console.error('⚠️ Failed to update invitation code usage:', inviteError);
        // Don't fail registration for this
      }

      console.log('🎉 Registration completed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { success: false, error: 'An unexpected error occurred during registration. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const validateInvitationCode = async (code: string): Promise<{ valid: boolean; role?: string; error?: string }> => {
    try {
      if (!code?.trim()) {
        return { valid: false, error: 'Invitation code is required' };
      }

      console.log('🔍 Validating invitation code:', code);
      
      const { data: invitationCode, error } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      console.log('📋 Query result:', { data: invitationCode, error });

      if (error) {
        console.error('❌ Database error:', error);
        if (error.code === 'PGRST116') {
          return { valid: false, error: 'Invalid invitation code. Please check the code and try again.' };
        }
        return { valid: false, error: 'Failed to validate invitation code. Please try again.' };
      }

      if (!invitationCode) {
        return { valid: false, error: 'Invalid invitation code. Please check the code and try again.' };
      }

      // Check if code is expired
      if (invitationCode.expires_at && new Date(invitationCode.expires_at) < new Date()) {
        return { valid: false, error: 'This invitation code has expired. Please request a new one.' };
      }

      // Check if usage limit is reached
      if (invitationCode.usage_limit && (invitationCode.used_count || 0) >= invitationCode.usage_limit) {
        return { valid: false, error: 'This invitation code has reached its usage limit. Please request a new one.' };
      }

      console.log('✅ Code validation successful:', invitationCode.role);
      return { valid: true, role: invitationCode.role };
    } catch (error) {
      console.error('❌ Error validating invitation code:', error);
      return { valid: false, error: 'Failed to validate invitation code. Please try again.' };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    login,
    logout,
    register,
    validateInvitationCode,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
