
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp } from 'lucide-react';

export type DateRangeOption = 'today' | 'this-week' | 'next-7-days';

interface SessionDateRangeSelectorProps {
  value: DateRangeOption;
  onChange: (value: DateRangeOption) => void;
  sessionCount: number;
  isRTL?: boolean;
}

export const SessionDateRangeSelector: React.FC<SessionDateRangeSelectorProps> = ({
  value,
  onChange,
  sessionCount,
  isRTL = false
}) => {
  const options = [
    { value: 'today' as const, label: 'Today', icon: Calendar },
    { value: 'this-week' as const, label: 'This Week', icon: Clock },
    { value: 'next-7-days' as const, label: 'Next 7 Days', icon: TrendingUp }
  ];

  return (
    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className={`flex border rounded-lg p-1 bg-muted/30 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = value === option.value;
          
          return (
            <Button
              key={option.value}
              onClick={() => onChange(option.value)}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={`h-8 px-3 text-xs font-medium transition-all ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-muted'
              } ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Icon className="h-3 w-3" />
              <span className={isRTL ? 'mr-1' : 'ml-1'}>{option.label}</span>
            </Button>
          );
        })}
      </div>
      
      <Badge variant="outline" className="text-xs">
        {sessionCount} sessions
      </Badge>
    </div>
  );
};
