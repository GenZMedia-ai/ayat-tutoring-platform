
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useMixedStudentData } from '@/hooks/useMixedStudentData';

const ModernStatusMetrics: React.FC = () => {
  const { getStatsCount } = useMixedStudentData();

  const statusCards = [
    {
      title: 'Pending Confirmation',
      count: getStatsCount('pending'),
      color: 'bg-stone-50 border-stone-200',
      textColor: 'text-stone-800',
      numberColor: 'text-stone-600'
    },
    {
      title: 'Confirmed',
      count: getStatsCount('confirmed'),
      color: 'bg-stone-50 border-stone-200',
      textColor: 'text-stone-800',
      numberColor: 'text-stone-600'
    },
    {
      title: 'Trial Completed',
      count: getStatsCount('trial-completed'),
      color: 'bg-stone-50 border-stone-200',
      textColor: 'text-stone-800',
      numberColor: 'text-stone-600'
    },
    {
      title: 'Trial Ghosted',
      count: getStatsCount('trial-ghosted'),
      color: 'bg-stone-50 border-stone-200',
      textColor: 'text-stone-800',
      numberColor: 'text-stone-600'
    },
    {
      title: 'Follow-up',
      count: getStatsCount('follow-up'),
      color: 'bg-stone-50 border-stone-200',
      textColor: 'text-stone-800',
      numberColor: 'text-stone-600'
    },
    {
      title: 'Awaiting Payment',
      count: getStatsCount('awaiting-payment'),
      color: 'bg-stone-50 border-stone-200',
      textColor: 'text-stone-800',
      numberColor: 'text-stone-600'
    },
    {
      title: 'Paid',
      count: getStatsCount('paid'),
      color: 'bg-stone-50 border-stone-200',
      textColor: 'text-stone-800',
      numberColor: 'text-stone-600'
    },
    {
      title: 'Active',
      count: getStatsCount('active'),
      color: 'bg-stone-50 border-stone-200',
      textColor: 'text-stone-800',
      numberColor: 'text-stone-600'
    },
    {
      title: 'Expired',
      count: getStatsCount('expired'),
      color: 'bg-stone-50 border-stone-200',
      textColor: 'text-stone-800',
      numberColor: 'text-stone-600'
    },
    {
      title: 'Cancelled',
      count: getStatsCount('cancelled'),
      color: 'bg-stone-50 border-stone-200',
      textColor: 'text-stone-800',
      numberColor: 'text-stone-600'
    },
    {
      title: 'Dropped',
      count: getStatsCount('dropped'),
      color: 'bg-stone-50 border-stone-200',
      textColor: 'text-stone-800',
      numberColor: 'text-stone-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statusCards.map((card, index) => (
        <Card key={index} className={`${card.color} border hover:shadow-sm transition-shadow`}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${card.numberColor} mb-1`}>
                {card.count}
              </div>
              <div className={`text-sm font-medium ${card.textColor} mb-1`}>
                {card.title}
              </div>
              <div className={`text-xs ${card.textColor} opacity-70`}>
                Action Needed
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ModernStatusMetrics;
