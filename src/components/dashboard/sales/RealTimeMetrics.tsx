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
      hasActionNeeded: true
    },
    { 
      key: 'confirmed', 
      label: 'Confirmed',
      hasActionNeeded: false
    },
    { 
      key: 'completed', 
      label: 'Completed',
      hasActionNeeded: true
    },
    { 
      key: 'awaiting_payment', 
      label: 'Awaiting Payment',
      hasActionNeeded: true
    },
    { 
      key: 'follow_up', 
      label: 'Follow-up',
      hasActionNeeded: false
    },
    { 
      key: 'paid', 
      label: 'Paid',
      hasActionNeeded: false
    },
    { 
      key: 'ghosted', 
      label: 'Ghosted',
      hasActionNeeded: false
    },
    { 
      key: 'dropped', 
      label: 'Dropped',
      hasActionNeeded: false
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {metricsConfig.map((metric, index) => {
        const count = metrics[metric.key as keyof MetricsData];
        
        return (
          <div 
            key={metric.key}
            className="bg-white border border-border rounded-lg p-6 text-center relative transition-shadow hover:shadow-md"
          >
            {/* Top indicator bar */}
            <div 
              className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-lg"
            />
            
            {/* Count */}
            <div className="text-3xl font-semibold text-foreground mb-2">
              {count}
            </div>
            
            {/* Label */}
            <div className="text-sm font-medium text-secondary-foreground mb-1">
              {metric.label}
            </div>
            
            {/* Action needed indicator */}
            {metric.hasActionNeeded && count > 0 && (
              <div className="text-xs text-primary font-medium">
                Action Needed
              </div>
            )}
            
            {/* Fallback when no action needed */}
            {!metric.hasActionNeeded && (
              <div className="text-xs text-muted-foreground">
                {count === 1 ? 'item' : 'items'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};