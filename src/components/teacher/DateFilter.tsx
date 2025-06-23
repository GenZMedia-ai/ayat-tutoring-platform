
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

export type DateRange = 'today' | 'yesterday' | 'last-7-days' | 'this-month' | 'last-month' | 'all-time' | 'custom';
export type FilterType = 'session_date' | 'booking_date';

interface DateFilterProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  filterType?: FilterType;
  onFilterTypeChange?: (type: FilterType) => void;
  className?: string;
  resultCount?: number;
}

export const DateFilter: React.FC<DateFilterProps> = ({ 
  value, 
  onChange, 
  filterType = 'session_date',
  onFilterTypeChange,
  className = '',
  resultCount 
}) => {
  // If no filter type controls needed, show simple version
  if (!onFilterTypeChange) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last-7-days">Last 7 Days</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="all-time">All Time</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
        {resultCount !== undefined && (
          <Badge variant="outline" className="text-xs ml-2">
            {resultCount} results
          </Badge>
        )}
      </div>
    );
  }

  // Enhanced version with filter type controls
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 ${className}`}>
      {/* Filter Type Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex border rounded-md p-1 bg-muted/50">
          <button
            onClick={() => onFilterTypeChange('session_date')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
              filterType === 'session_date' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="h-3 w-3" />
            Session Date
          </button>
          <button
            onClick={() => onFilterTypeChange('booking_date')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
              filterType === 'booking_date' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="h-3 w-3" />
            Booking Date
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last-7-days">Last 7 Days</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="all-time">All Time</SelectItem>
          </SelectContent>
        </Select>
        
        {resultCount !== undefined && (
          <Badge variant="outline" className="text-xs">
            {resultCount} results
          </Badge>
        )}
      </div>

      {/* Helper Text */}
      <div className="text-xs text-muted-foreground">
        {filterType === 'session_date' ? 'When sessions are scheduled' : 'When trials were booked'}
      </div>
    </div>
  );
};
