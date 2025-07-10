
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
      label: 'Pending Trials', 
      priority: 'high',
      description: 'Awaiting confirmation'
    },
    { 
      key: 'confirmed', 
      label: 'Confirmed Trials', 
      priority: 'medium',
      description: 'Ready to conduct'
    },
    { 
      key: 'completed', 
      label: 'Completed Trials', 
      priority: 'high',
      description: 'Sessions finished'
    },
    { 
      key: 'awaiting_payment', 
      label: 'Awaiting Payment', 
      priority: 'high',
      description: 'Payment pending'
    },
    { 
      key: 'follow_up', 
      label: 'Follow-up Required', 
      priority: 'medium',
      description: 'Needs attention'
    },
    { 
      key: 'paid', 
      label: 'Paid Students', 
      priority: 'low',
      description: 'Payment complete'
    },
    { 
      key: 'ghosted', 
      label: 'Ghosted Trials', 
      priority: 'medium',
      description: 'No-show students'
    },
    { 
      key: 'dropped', 
      label: 'Dropped Students', 
      priority: 'low',
      description: 'Cancelled enrollment'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {metricsConfig.map((metric) => {
        const count = metrics[metric.key as keyof MetricsData];
        const isHighPriority = metric.priority === 'high' && count > 0;
        
        return (
          <Card key={metric.key} className="sales-stat-card relative group hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="text-center">
                {/* Priority Indicator */}
                {isHighPriority && (
                  <div className="absolute top-3 right-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                )}
                
                {/* Count */}
                <div className="sales-stat-number text-primary mb-2">
                  {count}
                </div>
                
                {/* Label */}
                <div className="sales-stat-label mb-1">
                  {metric.label}
                </div>
                
                {/* Description */}
                <div className="text-xs text-muted-foreground opacity-75">
                  {metric.description}
                </div>
                
                {/* Status Badge */}
                <div className="mt-2">
                  <Badge variant={count > 0 ? 'default' : 'secondary'} className="text-xs">
                    {count} {count === 1 ? 'item' : 'items'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
