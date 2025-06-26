
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter } from 'lucide-react';

export type DateRange = 'today' | 'tomorrow' | 'next-3-days' | 'this-week' | 'next-7-days' | 'this-month' | 'last-month' | 'all-time';

export interface SmartDateFilterProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  resultCount?: number;
  showResultCount?: boolean;
  className?: string;
}

export const SmartDateFilter: React.FC<SmartDateFilterProps> = ({
  value,
  onChange,
  resultCount = 0,
  showResultCount = true,
  className = ""
}) => {
  const getDateRangeLabel = (range: DateRange) => {
    switch (range) {
      case 'today': return 'Today';
      case 'tomorrow': return 'Tomorrow';
      case 'next-3-days': return 'Next 3 Days';
      case 'this-week': return 'This Week';
      case 'next-7-days': return 'Next 7 Days';
      case 'this-month': return 'This Month';
      case 'last-month': return 'Last Month';
      case 'all-time': return 'All Time';
      default: return 'Select Period';
    }
  };

  const getSmartSuggestion = () => {
    if (resultCount === 0 && value !== 'all-time') {
      return 'Try "All Time" to see more results';
    }
    if (resultCount === 0 && value === 'all-time') {
      return 'No data available';
    }
    return null;
  };

  const suggestion = getSmartSuggestion();

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">Period:</span>
        </div>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">
              <div className="flex items-center gap-2">
                <span>Today</span>
                <Badge variant="outline" className="text-xs">Quick</Badge>
              </div>
            </SelectItem>
            <SelectItem value="tomorrow">Tomorrow</SelectItem>
            <SelectItem value="next-3-days">Next 3 Days</SelectItem>
            <SelectItem value="this-week">
              <div className="flex items-center gap-2">
                <span>This Week</span>
                <Badge variant="secondary" className="text-xs">Popular</Badge>
              </div>
            </SelectItem>
            <SelectItem value="next-7-days">Next 7 Days</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="all-time">
              <div className="flex items-center gap-2">
                <span>All Time</span>
                <Badge variant="outline" className="text-xs">Complete</Badge>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showResultCount && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Filter className="h-3 w-3" />
            {resultCount} result{resultCount !== 1 ? 's' : ''}
          </Badge>
          {suggestion && (
            <Badge variant="secondary" className="text-xs">
              💡 {suggestion}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
