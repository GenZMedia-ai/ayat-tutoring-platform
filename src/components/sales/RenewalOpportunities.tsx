import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRenewalOpportunities } from '@/hooks/useRenewalOpportunities';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { PaymentLinkModal } from '@/components/sales/PaymentLinkModal';
import { 
  RefreshCw, 
  User, 
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  Phone
} from 'lucide-react';

const RenewalOpportunities: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { opportunities, loading, refreshOpportunities } = useRenewalOpportunities();
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProbabilityBadgeVariant = (probability: number) => {
    if (probability >= 80) return 'default';
    if (probability >= 60) return 'secondary';
    return 'outline';
  };

  const formatRevenue = (amount: number) => {
    return `$${(amount / 100).toFixed(0)}`;
  };

  const handleCreateRenewalLink = (studentId: string) => {
    setSelectedStudentIds([studentId]);
    setIsPaymentModalOpen(true);
  };

  const getUrgencyLevel = (expiredDays: number) => {
    if (expiredDays <= 7) return { level: 'urgent', color: 'text-red-600', bg: 'bg-red-50' };
    if (expiredDays <= 30) return { level: 'moderate', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'low', color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  return (
    <>
      <Card className="dashboard-card">
        <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <RefreshCw className="h-5 w-5 text-primary" />
            Renewal Opportunities
          </CardTitle>
          <CardDescription>
            Smart AI-powered renewal predictions for expired students - prioritized by conversion probability
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className={`ml-2 text-muted-foreground ${isRTL ? 'mr-2 ml-0' : ''}`}>
                Analyzing renewal opportunities...
              </span>
            </div>
          ) : opportunities.length === 0 ? (
            <div className={`text-center py-8 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-muted-foreground">No renewal opportunities found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Expired students with renewal potential will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opportunity) => {
                const urgency = getUrgencyLevel(opportunity.expiredDays);
                
                return (
                  <div key={opportunity.id} className={`p-4 border rounded-lg ${urgency.bg} border-l-4 border-l-primary`}>
                    <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="p-2 bg-primary/10 rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                          <h4 className="font-medium">{opportunity.name}</h4>
                          <div className={`flex items-center gap-2 text-sm text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Phone className="h-3 w-3" />
                            <span>{opportunity.phone}</span>
                            <span>•</span>
                            <span>{opportunity.country}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getProbabilityBadgeVariant(opportunity.conversionProbability)}>
                          <Target className="h-3 w-3 mr-1" />
                          {opportunity.conversionProbability}% Success
                        </Badge>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div className="text-center p-2 bg-white rounded">
                        <div className="text-xs text-muted-foreground">Cycle</div>
                        <div className="font-semibold">#{opportunity.subscriptionCycle}</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded">
                        <div className="text-xs text-muted-foreground">LTV</div>
                        <div className="font-semibold">{formatRevenue(opportunity.lifetimeRevenue)}</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded">
                        <div className="text-xs text-muted-foreground">Completion</div>
                        <div className="font-semibold">{opportunity.completionRate.toFixed(0)}%</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded">
                        <div className="text-xs text-muted-foreground">Expired</div>
                        <div className={`font-semibold ${urgency.color}`}>
                          {opportunity.expiredDays}d ago
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Badge variant="outline">
                          {opportunity.renewalCount} previous renewals
                        </Badge>
                        {urgency.level === 'urgent' && (
                          <Badge variant="destructive">URGENT</Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="ayat-button-primary"
                        onClick={() => handleCreateRenewalLink(opportunity.id)}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Create Renewal Link
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-4 border-t border-border">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm text-muted-foreground">
                      {opportunities.length} renewal opportunities
                    </span>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">
                        Avg {(opportunities.reduce((acc, op) => acc + op.conversionProbability, 0) / opportunities.length).toFixed(0)}% success rate
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={refreshOpportunities}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentLinkModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </>
  );
};

export default RenewalOpportunities;