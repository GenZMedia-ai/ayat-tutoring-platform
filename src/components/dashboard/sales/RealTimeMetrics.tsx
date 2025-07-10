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
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      priority: 'high'
    },
    { 
      key: 'confirmed', 
      label: 'Confirmed', 
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      priority: 'medium'
    },
    { 
      key: 'completed', 
      label: 'Completed', 
      color: 'text-green-600 bg-green-50 border-green-200',
      priority: 'high'
    },
    { 
      key: 'awaiting_payment', 
      label: 'Awaiting Payment', 
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      priority: 'high'
    },
    { 
      key: 'follow_up', 
      label: 'Follow-up', 
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      priority: 'medium'
    },
    { 
      key: 'paid', 
      label: 'Paid', 
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      priority: 'low'
    },
    { 
      key: 'ghosted', 
      label: 'Ghosted', 
      color: 'text-red-600 bg-red-50 border-red-200',
      priority: 'medium'
    },
    { 
      key: 'dropped', 
      label: 'Dropped', 
      color: 'text-gray-600 bg-gray-50 border-gray-200',
      priority: 'low'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {metricsConfig.map((metric) => {
        const count = metrics[metric.key as keyof MetricsData];
        const isHighPriority = metric.priority === 'high' && count > 0;
        
        return (
          <Card 
            key={metric.key} 
            className={`transition-all duration-200 ${
              isHighPriority 
                ? 'ring-2 ring-primary/20 shadow-md' 
                : 'hover:shadow-sm'
            }`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${metric.color.split(' ')[0]}`}>
                  {count}
                </div>
                {isHighPriority && (
                  <Badge variant="destructive" className="text-xs">
                    Action Needed
                  </Badge>
                )}
              </div>
              {count > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {count === 1 ? 'item' : 'items'}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};