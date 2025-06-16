
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
  validateInvitationCode: (code: string) => Promise<{ valid: boolean; role?: string }>;
  loading: boolean;
}

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  invitationCode: string;
  teacherType?: string;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('ayat-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const validateInvitationCode = async (code: string): Promise<{ valid: boolean; role?: string }> => {
    // Mock validation - replace with actual API call
    const mockCodes = {
      'ADMIN2025': 'admin',
      'SALES2025': 'sales',
      'TEACHER2025': 'teacher',
      'SUPERVISOR2025': 'supervisor'
    };
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    
    if (mockCodes[code as keyof typeof mockCodes]) {
      return { valid: true, role: mockCodes[code as keyof typeof mockCodes] };
    }
    return { valid: false };
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Mock registration - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new user (pending approval)
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: userData.email,
        fullName: userData.fullName,
        phone: userData.phone,
        role: 'teacher', // This would come from invitation code validation
        teacherType: userData.teacherType as TeacherType,
        language: userData.language,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      console.log('User registered, awaiting approval:', newUser);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Mock login - replace with actual authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock approved user for demo
      const mockUser: User = {
        id: '1',
        email: email,
        fullName: 'Ahmed Hassan',
        phone: '+201234567890',
        role: email.includes('admin') ? 'admin' : email.includes('sales') ? 'sales' : email.includes('teacher') ? 'teacher' : 'supervisor',
        teacherType: email.includes('teacher') ? 'mixed' : undefined,
        language: 'en',
        status: 'approved',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString()
      };

      setUser(mockUser);
      localStorage.setItem('ayat-user', JSON.stringify(mockUser));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ayat-user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      register,
      validateInvitationCode,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
