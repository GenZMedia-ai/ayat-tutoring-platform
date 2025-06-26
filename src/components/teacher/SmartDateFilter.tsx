
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter } from 'lucide-react';

export type DateRange = 'today' | 'tomorrow' | 'this-week' | 'next-7-days' | 'this-month' | 'next-month' | 'all-time';

export interface SmartDateFilterProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  resultCount?: number;
  className?: string;
}

const SmartDateFilter: React.FC<SmartDateFilterProps> = ({
  value,
  onChange,
  resultCount,
  className
}) => {
  const getDateRangeLabel = (range: DateRange) => {
    switch (range) {
      case 'today': return 'Today';
      case 'tomorrow': return 'Tomorrow';
      case 'this-week': return 'This Week';
      case 'next-7-days': return 'Next 7 Days';
      case 'this-month': return 'This Month';
      case 'next-month': return 'Next Month';
      case 'all-time': return 'All Time';
      default: return 'All Time';
    }
  };

  const getSmartSuggestion = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour < 10) {
      return 'today'; // Morning - suggest today
    } else if (currentHour < 16) {
      return 'this-week'; // Afternoon - suggest this week
    } else {
      return 'tomorrow'; // Evening - suggest tomorrow
    }
  };

  const smartSuggestion = getSmartSuggestion();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filter:</span>
      </div>
      
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[140px] bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">
            <div className="flex items-center gap-2">
              <span>Today</span>
              {smartSuggestion === 'today' && (
                <Badge variant="secondary" className="text-xs">Smart</Badge>
              )}
            </div>
          </SelectItem>
          <SelectItem value="tomorrow">
            <div className="flex items-center gap-2">
              <span>Tomorrow</span>
              {smartSuggestion === 'tomorrow' && (
                <Badge variant="secondary" className="text-xs">Smart</Badge>
              )}
            </div>
          </SelectItem>
          <SelectItem value="this-week">
            <div className="flex items-center gap-2">
              <span>This Week</span>
              {smartSuggestion === 'this-week' && (
                <Badge variant="secondary" className="text-xs">Smart</Badge>
              )}
            </div>
          </SelectItem>
          <SelectItem value="next-7-days">Next 7 Days</SelectItem>
          <SelectItem value="this-month">This Month</SelectItem>
          <SelectItem value="next-month">Next Month</SelectItem>
          <SelectItem value="all-time">All Time</SelectItem>
        </SelectContent>
      </Select>
      
      {resultCount !== undefined && (
        <Badge variant="outline" className="ml-1">
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
};

export default SmartDateFilter;
