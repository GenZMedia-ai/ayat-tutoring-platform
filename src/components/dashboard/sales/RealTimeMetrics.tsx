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
      colorType: 'tan',
      priority: 'high'
    },
    { 
      key: 'confirmed', 
      label: 'Confirmed', 
      colorType: 'brown',
      priority: 'medium'
    },
    { 
      key: 'completed', 
      label: 'Completed', 
      colorType: 'tan',
      priority: 'high'
    },
    { 
      key: 'awaiting_payment', 
      label: 'Awaiting Payment', 
      colorType: 'brown',
      priority: 'high'
    },
    { 
      key: 'follow_up', 
      label: 'Follow-up', 
      colorType: 'tan',
      priority: 'medium'
    },
    { 
      key: 'paid', 
      label: 'Paid', 
      colorType: 'brown',
      priority: 'low'
    },
    { 
      key: 'ghosted', 
      label: 'Ghosted', 
      colorType: 'tan',
      priority: 'medium'
    },
    { 
      key: 'dropped', 
      label: 'Dropped', 
      colorType: 'brown',
      priority: 'low'
    }
  ];

  const getGradient = (colorType: string) => {
    return colorType === 'tan' 
      ? 'linear-gradient(90deg, #a57865, #b88974)'
      : 'linear-gradient(90deg, #57463f, #6b574c)';
  };

  const getCountColor = (colorType: string) => {
    return colorType === 'tan' ? '#a57865' : '#57463f';
  };

  return (
    <div className="flex gap-6 p-2 overflow-x-auto scrollbar-hide scroll-smooth md:gap-5 sm:gap-4">
      {metricsConfig.map((metric, index) => {
        const count = metrics[metric.key as keyof MetricsData];
        const isHighPriority = metric.priority === 'high' && count > 0;
        
        return (
          <div 
            key={metric.key}
            className="bg-white rounded-2xl px-6 py-8 min-w-[160px] flex-shrink-0 border border-gray-100 transition-all duration-300 relative text-center cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(165,120,101,0.1)] hover:border-gray-200 md:min-w-[140px] md:px-5 md:py-7 sm:min-w-[110px] sm:px-4 sm:py-5"
            style={{ 
              animationDelay: `${index * 0.1}s`,
            }}
          >
            {/* Top gradient bar */}
            <div 
              className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-300 hover:h-1"
              style={{
                background: getGradient(metric.colorType)
              }}
            />
            
            {/* Count */}
            <div 
              className="text-4xl font-extralight leading-none mb-3 tracking-tight md:text-3xl sm:text-2xl"
              style={{ color: getCountColor(metric.colorType) }}
            >
              {count}
            </div>
            
            {/* Label */}
            <div className="text-sm font-medium uppercase tracking-wider text-gray-700 md:text-xs sm:text-xs">
              {metric.label}
            </div>
            
            {/* Sublabel */}
            <div className="text-xs text-gray-500 mt-1 font-normal">
              {count === 1 ? 'item' : 'items'}
            </div>

            {/* High priority indicator */}
            {isHighPriority && (
              <div className="absolute top-3 right-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};