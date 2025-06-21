
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, TrendingUp, Calendar } from 'lucide-react';

interface EarningsData {
  monthlyTarget: number;
  currentEarnings: number;
  baseHours: number;
  bonusHours: number;
  totalMinutes: number;
  nextPaymentDate: string;
  bonusRate: number;
  hourlyRate: number;
}

interface EarningsWidgetProps {
  earningsData: EarningsData;
}

const EarningsWidget: React.FC<EarningsWidgetProps> = ({ earningsData }) => {
  const progressPercentage = (earningsData.currentEarnings / earningsData.monthlyTarget) * 100;
  const projectedEarnings = earningsData.currentEarnings + (earningsData.bonusHours * earningsData.bonusRate);
  
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Monthly Earnings Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium">${earningsData.currentEarnings} / ${earningsData.monthlyTarget}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">${earningsData.currentEarnings}</div>
            <div className="text-xs text-green-600">Base Earnings</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">${projectedEarnings}</div>
            <div className="text-xs text-blue-600">Projected Total</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Minutes Taught</span>
            </div>
            <Badge variant="outline">{earningsData.totalMinutes} min</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Bonus Hours</span>
            </div>
            <Badge variant="outline" className="bg-orange-50 text-orange-600">
              {earningsData.bonusHours}h @ ${earningsData.bonusRate}/h
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Next Payment</span>
            </div>
            <span className="text-sm font-medium">{earningsData.nextPaymentDate}</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground text-center">
            Base Rate: ${earningsData.hourlyRate}/hour • Bonus Rate: ${earningsData.bonusRate}/hour
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EarningsWidget;
