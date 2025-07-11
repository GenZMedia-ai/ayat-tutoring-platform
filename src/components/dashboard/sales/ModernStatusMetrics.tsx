
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useMixedStudentData } from '@/hooks/useMixedStudentData';

const ModernStatusMetrics: React.FC = () => {
  const { getStatsCount } = useMixedStudentData();

  const statusCards = [
    {
      title: 'Pending Confirmation',
      count: getStatsCount('pending'),
      color: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-800',
      numberColor: 'text-orange-600'
    },
    {
      title: 'Confirmed',
      count: getStatsCount('confirmed'),
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-800',
      numberColor: 'text-blue-600'
    },
    {
      title: 'Trial Completed',
      count: getStatsCount('trial-completed'),
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-800',
      numberColor: 'text-green-600'
    },
    {
      title: 'Trial Ghosted',
      count: getStatsCount('trial-ghosted'),
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-800',
      numberColor: 'text-red-600'
    },
    {
      title: 'Follow-up',
      count: getStatsCount('follow-up'),
      color: 'bg-amber-50 border-amber-200',
      textColor: 'text-amber-800',
      numberColor: 'text-amber-600'
    },
    {
      title: 'Awaiting Payment',
      count: getStatsCount('awaiting-payment'),
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-800',
      numberColor: 'text-purple-600'
    },
    {
      title: 'Paid',
      count: getStatsCount('paid'),
      color: 'bg-emerald-50 border-emerald-200',
      textColor: 'text-emerald-800',
      numberColor: 'text-emerald-600'
    },
    {
      title: 'Active',
      count: getStatsCount('active'),
      color: 'bg-cyan-50 border-cyan-200',
      textColor: 'text-cyan-800',
      numberColor: 'text-cyan-600'
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
