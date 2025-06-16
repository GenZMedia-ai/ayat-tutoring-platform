
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

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          // Mock user data for now - in real implementation this would fetch from your users table
          const mockUser: AppUser = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'Demo User',
            phone: session.user.user_metadata?.phone || '+1234567890',
            role: session.user.user_metadata?.role || 'admin',
            language: session.user.user_metadata?.language || 'en',
            status: 'approved',
            createdAt: new Date().toISOString(),
            teacherType: session.user.user_metadata?.teacher_type
          };
          setUser(mockUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const mockUser: AppUser = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || 'Demo User',
          phone: session.user.user_metadata?.phone || '+1234567890',
          role: session.user.user_metadata?.role || 'admin',
          language: session.user.user_metadata?.language || 'en',
          status: 'approved',
          createdAt: new Date().toISOString(),
          teacherType: session.user.user_metadata?.teacher_type
        };
        setUser(mockUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Demo accounts for testing
      const demoAccounts = {
        'admin@ayatwbian.com': { role: 'admin', fullName: 'Admin User' },
        'sales@ayatwbian.com': { role: 'sales', fullName: 'Sales Agent' },
        'teacher@ayatwbian.com': { role: 'teacher', fullName: 'Teacher User', teacherType: 'mixed' },
        'supervisor@ayatwbian.com': { role: 'supervisor', fullName: 'Supervisor User' }
      };

      if (email in demoAccounts && password === 'password') {
        const demoData = demoAccounts[email as keyof typeof demoAccounts];
        
        // Create a mock session for demo purposes
        const mockUser: AppUser = {
          id: `demo-${demoData.role}`,
          email,
          fullName: demoData.fullName,
          phone: '+1234567890',
          role: demoData.role as UserRole,
          language: 'en',
          status: 'approved',
          createdAt: new Date().toISOString(),
          teacherType: demoData.teacherType as TeacherType
        };
        
        setUser(mockUser);
        return true;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
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
      
      // Mock registration - in real implementation this would create user in Supabase
      console.log('Registration data:', userData);
      
      // Simulate successful registration
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validateInvitationCode = async (code: string): Promise<{ valid: boolean; role?: string }> => {
    // Mock validation for demo codes
    const demoCodes = {
      'ADMIN2025': 'admin',
      'TEACHER2025': 'teacher',
      'SALES2025': 'sales',
      'SUPERVISOR2025': 'supervisor'
    };

    if (code in demoCodes) {
      return { valid: true, role: demoCodes[code as keyof typeof demoCodes] };
    }

    return { valid: false };
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
