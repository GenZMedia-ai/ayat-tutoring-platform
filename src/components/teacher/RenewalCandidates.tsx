import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRenewalCandidates } from '@/hooks/useRenewalCandidates';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { 
  User, 
  ArrowRight,
  Clock,
  Target,
  TrendingUp
} from 'lucide-react';

const RenewalCandidates: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { candidates, loading, refreshCandidates } = useRenewalCandidates();

  const getReadinessBadgeVariant = (readiness: string) => {
    switch (readiness) {
      case 'ready': return 'default';
      case 'almost': return 'secondary';
      case 'early': return 'outline';
      default: return 'outline';
    }
  };

  const getReadinessColor = (readiness: string) => {
    switch (readiness) {
      case 'ready': return 'text-green-600';
      case 'almost': return 'text-yellow-600';
      case 'early': return 'text-blue-600';
      default: return 'text-muted-foreground';
    }
  };

  const handleNotifySales = (candidateId: string, salesAgentName: string) => {
    console.log(`🔔 Notifying sales agent ${salesAgentName} about renewal candidate ${candidateId}`);
    // Future: Send notification to sales agent
  };

  return (
    <Card className="dashboard-card">
      <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
        <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Target className="h-5 w-5 text-primary" />
          Renewal Candidates
        </CardTitle>
        <CardDescription>
          Active students nearing completion - perfect timing for renewal discussions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className={`ml-2 text-muted-foreground ${isRTL ? 'mr-2 ml-0' : ''}`}>
              Loading renewal candidates...
            </span>
          </div>
        ) : candidates.length === 0 ? (
          <div className={`text-center py-8 ${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="text-muted-foreground">No renewal candidates yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Students at 50%+ completion will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="p-4 border border-border rounded-lg">
                <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <h4 className="font-medium">{candidate.name}</h4>
                      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span>{candidate.completedSessions}/{candidate.totalSessions} sessions</span>
                        <span>•</span>
                        <span>{candidate.country}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getReadinessBadgeVariant(candidate.renewalReadiness)}>
                      {candidate.renewalReadiness.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className={`flex items-center justify-between mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-medium">Completion Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {candidate.completionRate.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={candidate.completionRate} className="h-2" />
                </div>

                {/* Optimal Timing */}
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Clock className={`h-4 w-4 ${getReadinessColor(candidate.renewalReadiness)}`} />
                    <span className={`text-sm ${getReadinessColor(candidate.renewalReadiness)}`}>
                      {candidate.optimalMentionTime}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ayat-button-secondary"
                    onClick={() => handleNotifySales(candidate.id, candidate.salesAgentName)}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Notify Sales
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-border">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm text-muted-foreground">
                  {candidates.length} renewal candidate{candidates.length !== 1 ? 's' : ''} ready
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={refreshCandidates}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RenewalCandidates;