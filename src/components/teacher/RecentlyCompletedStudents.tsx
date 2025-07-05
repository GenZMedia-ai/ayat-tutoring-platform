import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRecentlyCompletedStudents } from '@/hooks/useRecentlyCompletedStudents';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { 
  CheckCircle, 
  User, 
  ArrowRight,
  Calendar,
  Trophy,
  DollarSign
} from 'lucide-react';

const RecentlyCompletedStudents: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { students, loading, refreshStudents } = useRecentlyCompletedStudents();

  const getPotentialBadgeVariant = (potential: string) => {
    switch (potential) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const formatRevenue = (amount: number) => {
    return `$${(amount / 100).toFixed(0)}`;
  };

  const handleReferToSales = (studentId: string, salesAgentName: string) => {
    // This would integrate with the sales dashboard notification system
    console.log(`🔄 Referring student ${studentId} to sales agent ${salesAgentName} for renewal`);
    // Future: Create auto-follow-up for sales agent
  };

  return (
    <Card className="dashboard-card">
      <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
        <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Trophy className="h-5 w-5 text-primary" />
          Recently Completed Students
        </CardTitle>
        <CardDescription>
          Students who finished their packages in the last 30 days - potential renewals
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className={`ml-2 text-muted-foreground ${isRTL ? 'mr-2 ml-0' : ''}`}>
              Loading completed students...
            </span>
          </div>
        ) : students.length === 0 ? (
          <div className={`text-center py-8 ${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="text-muted-foreground">No recently completed students</p>
            <p className="text-sm text-muted-foreground mt-1">
              Students who complete their packages will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="p-4 border border-border rounded-lg">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <h4 className="font-medium">{student.name}</h4>
                      <div className={`flex items-center gap-4 text-sm text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <CheckCircle className="h-3 w-3" />
                          <span>{student.completionRate.toFixed(0)}% completed</span>
                        </div>
                        <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          <span>{student.daysCompleted} days ago</span>
                        </div>
                        <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <DollarSign className="h-3 w-3" />
                          <span>{formatRevenue(student.lifetimeRevenue)} LTV</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getPotentialBadgeVariant(student.renewalPotential)}>
                          {student.renewalPotential.toUpperCase()} Renewal Potential
                        </Badge>
                        <Badge variant="outline">
                          Cycle #{student.subscriptionCycle}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ayat-button-secondary"
                    onClick={() => handleReferToSales(student.id, student.salesAgentName)}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Refer to Sales
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-border">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm text-muted-foreground">
                  {students.length} completed student{students.length !== 1 ? 's' : ''} ready for renewal
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={refreshStudents}
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

export default RecentlyCompletedStudents;