import React, { useState } from 'react';
import { DateFilter, DateRange } from '@/components/teacher/DateFilter';
import PaidStudentsSection from '@/components/teacher/PaidStudentsSection';

const EnhancedTeacherPaidRegistration: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('today');

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Paid Registration</h1>
          <p className="text-muted-foreground">Complete registration for paid students</p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Existing Paid Students Section */}
      <PaidStudentsSection />
    </div>
  );
};

export default EnhancedTeacherPaidRegistration;
