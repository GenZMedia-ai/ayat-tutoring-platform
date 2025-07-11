
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { useNavigate } from 'react-router-dom';

const DashboardHeader: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Don't render if no user (prevents flash of content)
  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'supervisor':
        return 'Supervisor';
      case 'sales':
        return 'Sales Agent';
      case 'teacher':
        return 'Teacher';
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'supervisor':
        return 'secondary';
      case 'sales':
        return 'default';
      case 'teacher':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="brand-gradient w-10 h-10 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">AW</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Ayat w Bian</h1>
            <p className="text-sm text-muted-foreground">Tutoring Management System</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <LanguageToggle />
          
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-right">
              <p className="text-sm font-medium">{user.fullName}</p>
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                  {getRoleDisplayName(user.role)}
                </Badge>
                {user.teacherType && (
                  <Badge variant="outline" className="text-xs">
                    {user.teacherType}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
