
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { User as AppUser, TeacherType, UserRole } from '@/types';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<boolean>;
  validateInvitationCode: (code: string) => Promise<{ valid: boolean; role?: string }>;
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string): Promise<AppUser | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.error('Error fetching profile:', error);
        return null;
      }

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
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          // Use setTimeout to defer Supabase calls and prevent deadlock
          setTimeout(async () => {
            const profile = await fetchUserProfile(session.user.id);
            setUser(profile);
            setLoading(false);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setTimeout(async () => {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
          setLoading(false);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      
      // First validate the invitation code and get the role
      const codeValidation = await validateInvitationCode(userData.invitationCode);
      if (!codeValidation.valid || !codeValidation.role) {
        throw new Error('Invalid invitation code');
      }

      // Create the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: userData.fullName,
            phone: userData.phone,
            role: codeValidation.role,
            teacher_type: userData.teacherType,
            language: userData.language
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        return false;
      }

      // Update invitation code usage
      if (data.user) {
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
        }
      }

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validateInvitationCode = async (code: string): Promise<{ valid: boolean; role?: string }> => {
    try {
      const { data: invitationCode, error } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !invitationCode) {
        return { valid: false };
      }

      // Check if code is expired
      if (invitationCode.expires_at && new Date(invitationCode.expires_at) < new Date()) {
        return { valid: false };
      }

      // Check if usage limit is reached
      if (invitationCode.usage_limit && (invitationCode.used_count || 0) >= invitationCode.usage_limit) {
        return { valid: false };
      }

      return { valid: true, role: invitationCode.role };
    } catch (error) {
      console.error('Error validating invitation code:', error);
      return { valid: false };
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
