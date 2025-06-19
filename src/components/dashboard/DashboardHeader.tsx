
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

const DashboardHeader: React.FC = () => {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleDisplay = (role: string) => {
    const roleMap = {
      admin: 'Administrator',
      sales: 'Sales Agent',
      teacher: 'Teacher',
      supervisor: 'Supervisor'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { text: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
      approved: { text: 'Approved', color: 'bg-green-100 text-green-800' },
      rejected: { text: 'Rejected', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status as keyof typeof statusMap] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  if (!user) return null;

  const statusBadge = getStatusBadge(user.status);

  return (
    <header className="bg-white border-b border-border px-6 py-4">
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
          <div className="text-right">
            <p className="text-sm font-medium">{user.fullName}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{getRoleDisplay(user.role)}</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                {statusBadge.text}
              </span>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuItem onClick={logout}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
