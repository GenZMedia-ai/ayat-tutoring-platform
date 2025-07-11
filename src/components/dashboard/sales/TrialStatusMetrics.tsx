
import React, { useEffect } from 'react';
import { useMixedStudentData } from '@/hooks/useMixedStudentData';
import { supabase } from '@/integrations/supabase/client';

export const TrialStatusMetrics: React.FC = () => {
  const { getStatsCount } = useMixedStudentData();

  const updateMetrics = () => {
    // Metrics will update automatically through the hook
  };

  useEffect(() => {
    // Set up real-time subscriptions for live updates
    const subscription = supabase
      .channel('trial-status-metrics-updates')
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
    // First Row
    { 
      key: 'pending', 
      label: 'Pending', 
      subtitle: 'Action Needed',
      showSubtitle: true
    },
    { 
      key: 'confirmed', 
      label: 'Confirmed', 
      subtitle: 'Ready to Go',
      showSubtitle: false
    },
    { 
      key: 'trial-completed', 
      label: 'Trial Completed', 
      subtitle: 'Action Needed',
      showSubtitle: true
    },
    { 
      key: 'awaiting-payment', 
      label: 'Awaiting Payment', 
      subtitle: 'Action Needed',
      showSubtitle: true
    },
    // Second Row
    { 
      key: 'follow-up', 
      label: 'Follow-up', 
      subtitle: 'Action Needed',
      showSubtitle: true
    },
    { 
      key: 'paid', 
      label: 'Paid', 
      subtitle: 'Completed',
      showSubtitle: false
    },
    { 
      key: 'trial-ghosted', 
      label: 'Ghosted', 
      subtitle: 'Follow-up Required',
      showSubtitle: true
    },
    { 
      key: 'dropped', 
      label: 'Dropped', 
      subtitle: 'Closed',
      showSubtitle: false
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {metricsConfig.map((metric, index) => {
        const count = getStatsCount(metric.key);
        
        return (
          <div 
            key={metric.key}
            className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center hover:shadow-sm transition-shadow"
          >
            {/* Count */}
            <div className="text-2xl font-semibold text-amber-900 mb-1">
              {count}
            </div>
            
            {/* Label */}
            <div className="text-sm font-medium text-amber-800 mb-1">
              {metric.label}
            </div>
            
            {/* Subtitle */}
            {metric.showSubtitle && (
              <div className="text-xs text-amber-700">
                {metric.subtitle}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
