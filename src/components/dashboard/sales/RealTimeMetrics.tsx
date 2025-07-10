
import React, { useEffect, useState } from 'react';
import { useMixedStudentData } from '@/hooks/useMixedStudentData';
import { supabase } from '@/integrations/supabase/client';

interface MetricsData {
  pending: number;
  confirmed: number;
  completed: number;
  awaiting_payment: number;
  follow_up: number;
  paid: number;
  ghosted: number;
  dropped: number;
}

export const RealTimeMetrics: React.FC = () => {
  const { getStatsCount } = useMixedStudentData();
  const [metrics, setMetrics] = useState<MetricsData>({
    pending: 0,
    confirmed: 0,
    completed: 0,
    awaiting_payment: 0,
    follow_up: 0,
    paid: 0,
    ghosted: 0,
    dropped: 0
  });

  const updateMetrics = () => {
    setMetrics({
      pending: getStatsCount('pending'),
      confirmed: getStatsCount('confirmed'),
      completed: getStatsCount('trial-completed'),
      awaiting_payment: getStatsCount('awaiting-payment'),
      follow_up: getStatsCount('follow-up'),
      paid: getStatsCount('paid'),
      ghosted: getStatsCount('trial-ghosted'),
      dropped: getStatsCount('dropped')
    });
  };

  useEffect(() => {
    updateMetrics();
    
    // Set up real-time subscriptions for live updates
    const subscription = supabase
      .channel('sales-metrics-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students'
        },
        () => {
          setTimeout(updateMetrics, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_groups'
        },
        () => {
          setTimeout(updateMetrics, 100);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [getStatsCount]);

  const metricsConfig = [
    { 
      key: 'pending', 
      label: 'Pending', 
      borderColor: '#8B6F47',
      needsAction: true,
      priority: 'high'
    },
    { 
      key: 'confirmed', 
      label: 'Confirmed', 
      borderColor: '#D4A574',
      needsAction: false,
      priority: 'medium'
    },
    { 
      key: 'completed', 
      label: 'Trial Completed', 
      borderColor: '#28A745',
      needsAction: true,
      priority: 'high'
    },
    { 
      key: 'awaiting_payment', 
      label: 'Awaiting Payment', 
      borderColor: '#E65100',
      needsAction: true,
      priority: 'high'
    },
    { 
      key: 'follow_up', 
      label: 'Follow-up', 
      borderColor: '#A0826D',
      needsAction: true,
      priority: 'medium'
    },
    { 
      key: 'paid', 
      label: 'Paid', 
      borderColor: '#28A745',
      needsAction: false,
      priority: 'low'
    },
    { 
      key: 'ghosted', 
      label: 'Ghosted', 
      borderColor: '#DC3545',
      needsAction: false,
      priority: 'medium'
    },
    { 
      key: 'dropped', 
      label: 'Dropped', 
      borderColor: '#6C757D',
      needsAction: false,
      priority: 'low'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {metricsConfig.map((metric) => {
        const count = metrics[metric.key as keyof MetricsData];
        
        return (
          <div 
            key={metric.key}
            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden"
          >
            {/* Thick colored left border */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ backgroundColor: metric.borderColor }}
            />
            
            {/* Card content */}
            <div className="p-6 pl-8">
              {/* Count - Large and prominent */}
              <div 
                className="text-5xl font-bold leading-none mb-3"
                style={{ color: '#212529' }}
              >
                {count}
              </div>
              
              {/* Status label */}
              <div className="text-sm font-medium text-gray-700 mb-2">
                {metric.label}
              </div>
              
              {/* Action needed indicator */}
              {metric.needsAction && count > 0 && (
                <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                  Action Needed
                </div>
              )}
              
              {/* Item count sublabel */}
              <div className="text-xs text-gray-500 mt-2">
                {count === 1 ? '1 item' : `${count} items`}
              </div>
            </div>

            {/* Priority indicator for high priority items */}
            {metric.priority === 'high' && count > 0 && (
              <div className="absolute top-3 right-3">
                <div className="w-2 h-2 rounded-full bg-red-500" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
