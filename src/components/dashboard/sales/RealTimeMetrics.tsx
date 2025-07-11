
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMixedStudentData } from '@/hooks/useMixedStudentData';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  CheckCircle, 
  UserCheck, 
  CreditCard, 
  UserPlus, 
  DollarSign, 
  UserX, 
  XCircle 
} from 'lucide-react';

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
      subtitle: 'Action Needed',
      icon: Clock,
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
      isActionNeeded: true
    },
    {
      key: 'confirmed',
      label: 'Confirmed',
      subtitle: 'Scheduled',
      icon: UserCheck,
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-200',
      isActionNeeded: false
    },
    {
      key: 'completed',
      label: 'Completed',
      subtitle: 'Action Needed',
      icon: CheckCircle,
      colorClass: 'text-green-600',
      bgClass: 'bg-green-50',
      borderClass: 'border-green-200',
      isActionNeeded: true
    },
    {
      key: 'awaiting_payment',
      label: 'Awaiting Payment',
      subtitle: 'Action Needed',
      icon: CreditCard,
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-50',
      borderClass: 'border-purple-200',
      isActionNeeded: true
    },
    {
      key: 'follow_up',
      label: 'Follow-up',
      subtitle: 'Scheduled',
      icon: UserPlus,
      colorClass: 'text-orange-600',
      bgClass: 'bg-orange-50',
      borderClass: 'border-orange-200',
      isActionNeeded: false
    },
    {
      key: 'paid',
      label: 'Paid',
      subtitle: 'Active',
      icon: DollarSign,
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      isActionNeeded: false
    },
    {
      key: 'ghosted',
      label: 'Ghosted',
      subtitle: 'Action Needed',
      icon: UserX,
      colorClass: 'text-red-600',
      bgClass: 'bg-red-50',
      borderClass: 'border-red-200',
      isActionNeeded: true
    },
    {
      key: 'dropped',
      label: 'Dropped',
      subtitle: 'Closed',
      icon: XCircle,
      colorClass: 'text-gray-600',
      bgClass: 'bg-gray-50',
      borderClass: 'border-gray-200',
      isActionNeeded: false
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metricsConfig.map((metric) => {
        const count = metrics[metric.key as keyof MetricsData];
        const IconComponent = metric.icon;
        
        return (
          <Card 
            key={metric.key}
            className={`bg-sales-bg-secondary border-sales-border shadow-sales-sm hover:shadow-sales-md transition-all duration-200 relative overflow-hidden`}
          >
            {/* Top accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${metric.isActionNeeded ? 'bg-sales-primary' : 'bg-sales-secondary'}`} />
            
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg ${metric.bgClass} ${metric.borderClass} border`}>
                  <IconComponent className={`h-5 w-5 ${metric.colorClass}`} />
                </div>
                {metric.isActionNeeded && (
                  <div className="w-2 h-2 rounded-full bg-sales-primary animate-pulse" />
                )}
              </div>
              
              <div className="space-y-2">
                <div className="text-3xl font-semibold text-sales-text-primary">
                  {count}
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-sales-text-primary">
                    {metric.label}
                  </div>
                  <div className="text-xs text-sales-text-muted">
                    {metric.subtitle}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
