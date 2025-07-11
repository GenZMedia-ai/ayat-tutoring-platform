
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  CreditCard, 
  UserPlus, 
  MessageSquare,
  BarChart3,
  Settings 
} from 'lucide-react';

const SalesSidebar: React.FC = () => {
  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/sales'
    },
    {
      icon: Calendar,
      label: 'Trial Appointments',
      path: '/sales/trials'
    },
    {
      icon: Users,
      label: 'Students',
      path: '/sales/students'
    },
    {
      icon: UserPlus,
      label: 'Follow-up',
      path: '/sales/followup'
    },
    {
      icon: CreditCard,
      label: 'Payment Links',
      path: '/sales/payments'
    },
    {
      icon: MessageSquare,
      label: 'Communications',
      path: '/sales/communications'
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      path: '/sales/analytics'
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/sales/settings'
    }
  ];

  return (
    <div className="w-64 bg-sales-bg-secondary border-r border-sales-border h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sales-border">
        <h1 className="text-xl font-semibold text-sales-text-primary">Sales Dashboard</h1>
        <p className="text-sm text-sales-text-muted mt-1">Manage your sales pipeline</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-sales-primary text-white shadow-sales-sm' 
                    : 'text-sales-text-secondary hover:bg-sales-bg-tertiary hover:text-sales-text-primary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    className={`h-5 w-5 ${
                      isActive ? 'text-white' : 'text-sales-text-muted group-hover:text-sales-text-secondary'
                    }`} 
                  />
                  <span className="font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sales-border">
        <div className="text-xs text-sales-text-muted text-center">
          Sales Dashboard v2.0
        </div>
      </div>
    </div>
  );
};

export default SalesSidebar;
