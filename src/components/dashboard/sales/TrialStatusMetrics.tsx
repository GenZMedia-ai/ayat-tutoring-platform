
import React from 'react';
import { useMixedStudentData } from '@/hooks/useMixedStudentData';

export const TrialStatusMetrics: React.FC = () => {
  const { getStatsCount } = useMixedStudentData();

  const statusMetrics = [
    {
      key: 'pending',
      label: 'Pending',
      subtitle: 'Action Needed',
      count: getStatsCount('pending')
    },
    {
      key: 'confirmed',
      label: 'Confirmed',
      subtitle: 'Action Needed',
      count: getStatsCount('confirmed')
    },
    {
      key: 'trial-completed',
      label: 'Completed',
      subtitle: null,
      count: getStatsCount('trial-completed')
    },
    {
      key: 'awaiting-payment',
      label: 'Awaiting Payment',
      subtitle: 'Action Needed',
      count: getStatsCount('awaiting-payment')
    },
    {
      key: 'follow-up',
      label: 'Follow-up',
      subtitle: null,
      count: getStatsCount('follow-up')
    },
    {
      key: 'paid',
      label: 'Paid',
      subtitle: null,
      count: getStatsCount('paid')
    },
    {
      key: 'trial-ghosted',
      label: 'Ghosted',
      subtitle: null,
      count: getStatsCount('trial-ghosted')
    },
    {
      key: 'dropped',
      label: 'Dropped',
      subtitle: null,
      count: getStatsCount('dropped')
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {statusMetrics.map((metric) => (
        <div
          key={metric.key}
          className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-center"
        >
          <div className="text-3xl font-bold text-stone-800 mb-1">
            {metric.count}
          </div>
          <div className="text-sm font-medium text-stone-700 mb-1">
            {metric.label}
          </div>
          {metric.subtitle && (
            <div className="text-xs text-stone-500">
              {metric.subtitle}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
