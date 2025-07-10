import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
          // Small delay to ensure data is updated
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
      statusColor: '#6A1B9A',
      priority: 'high'
    },
    { 
      key: 'confirmed', 
      label: 'Confirmed', 
      statusColor: '#495057',
      priority: 'medium'
    },
    { 
      key: 'completed', 
      label: 'Completed', 
      statusColor: '#2E7D32',
      priority: 'high'
    },
    { 
      key: 'awaiting_payment', 
      label: 'Awaiting Payment', 
      statusColor: '#E65100',
      priority: 'high'
    },
    { 
      key: 'follow_up', 
      label: 'Follow-up', 
      statusColor: '#8B6F47',
      priority: 'medium'
    },
    { 
      key: 'paid', 
      label: 'Paid', 
      statusColor: '#2E7D32',
      priority: 'low'
    },
    { 
      key: 'ghosted', 
      label: 'Ghosted', 
      statusColor: '#C62828',
      priority: 'medium'
    },
    { 
      key: 'dropped', 
      label: 'Dropped', 
      statusColor: '#495057',
      priority: 'low'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-5">
      {metricsConfig.map((metric, index) => {
        const count = metrics[metric.key as keyof MetricsData];
        const isHighPriority = metric.priority === 'high' && count > 0;
        
        return (
          <div 
            key={metric.key}
            className="bg-white rounded-lg border border-gray-200 p-5 text-center transition-all duration-200 hover:shadow-lg"
          >
            {/* Status indicator */}
            <div 
              className="w-1 h-8 mx-auto mb-3 rounded-full"
              style={{ backgroundColor: metric.statusColor }}
            />
            
            {/* Count */}
            <div 
              className="text-2xl font-semibold leading-none mb-2"
              style={{ color: '#212529' }}
            >
              {count}
            </div>
            
            {/* Label */}
            <div className="text-xs font-medium uppercase tracking-wider text-gray-600 mb-1">
              {metric.label}
            </div>
            
            {/* Sublabel */}
            <div className="text-xs text-gray-500">
              {count === 1 ? 'item' : 'items'}
            </div>

            {/* High priority indicator */}
            {isHighPriority && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};