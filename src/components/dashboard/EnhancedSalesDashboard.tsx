import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTrialSessionFlow } from '@/hooks/useTrialSessionFlow';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import FollowUpQueue from '@/components/sales/FollowUpQueue';
import PaymentLinkGenerator from '@/components/sales/PaymentLinkGenerator';
import { toast } from 'sonner';

const EnhancedSalesDashboard: React.FC = () => {
  const { students, loading, refetchData } = useTrialSessionFlow();
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  
  useRealTimeUpdates(refetchData);

  // Mock packages data (will be replaced with real data)
  const packages = [
    { id: '1', name: 'Basic Package', sessionCount: 4, price: 99 },
    { id: '2', name: 'Standard Package', sessionCount: 8, price: 179 },
    { id: '3', name: 'Premium Package', sessionCount: 12, price: 249 },
    { id: '4', name: 'Intensive Package', sessionCount: 16, price: 299 }
  ];

  // Calculate real sales stats
  const salesStats = {
    conversionRate: 68,
    trialsBookedToday: students.filter(s => {
      const today = new Date().toDateString();
      return new Date(s.createdAt).toDateString() === today;
    }).length,
    pendingFollowUps: students.filter(s => s.trialOutcome?.outcome === 'completed' && !s.paymentLink).length,
    activePaymentLinks: students.filter(s => s.paymentLink?.status === 'pending').length,
    monthlyRanking: 3
  };

  const handleCreatePaymentLink = async (studentId: string) => {
    console.log('Creating payment link for student:', studentId);
    toast.success('Payment link creation dialog would open here');
  };

  const handleScheduleFollowUp = (studentId: string) => {
    console.log('Scheduling follow-up for student:', studentId);
    toast.success('Follow-up scheduling dialog would open here');
  };

  const handleWhatsAppContact = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student?.phone) {
      const message = encodeURIComponent(
        `Hi ${student.name}! I hope your trial session went well. I'd love to help you continue your English learning journey. Are you ready to get started with a package?`
      );
      window.open(`https://wa.me/${student.phone}?text=${message}`, '_blank');
      toast.success('WhatsApp opened for follow-up contact');
    }
  };

  const handleGeneratePaymentLink = async (data: any) => {
    setIsGeneratingLink(true);
    try {
      // Mock link generation - would integrate with real payment system
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockLink = `https://payment.ayatbian.com/link/${Math.random().toString(36).substr(2, 9)}`;
      return mockLink;
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-primary">Sales Dashboard</h2>
        <Badge variant="outline" className="text-xs">
          Enhanced Sales Access
        </Badge>
      </div>

      {/* Sales Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{salesStats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trials Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{salesStats.trialsBookedToday}</div>
            <p className="text-xs text-muted-foreground">Booked today</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{salesStats.pendingFollowUps}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{salesStats.activePaymentLinks}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">#{salesStats.monthlyRanking}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Sales Content */}
      <Tabs defaultValue="followups" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
          <TabsTrigger value="payment-links">Payment Links</TabsTrigger>
          <TabsTrigger value="bookings">Trial Bookings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="followups" className="space-y-4">
          <FollowUpQueue
            students={students}
            onCreatePaymentLink={handleCreatePaymentLink}
            onScheduleFollowUp={handleScheduleFollowUp}
            onWhatsAppContact={handleWhatsAppContact}
          />
        </TabsContent>

        <TabsContent value="payment-links" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaymentLinkGenerator
              packages={packages}
              onGenerateLink={handleGeneratePaymentLink}
              isGenerating={isGeneratingLink}
            />
            
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Active Payment Links</CardTitle>
                <CardDescription>Monitor link performance and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {students
                    .filter(s => s.paymentLink?.status === 'pending')
                    .map((student) => (
                      <div key={student.id} className="p-3 border border-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{student.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Link created: {student.paymentLink?.createdAt ? 
                                new Date(student.paymentLink.createdAt).toLocaleDateString() : 'Unknown'
                              }
                            </p>
                          </div>
                          <Badge className="bg-orange-100 text-orange-800">
                            {student.paymentLink?.currency.toUpperCase()} {student.paymentLink?.amount}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  {students.filter(s => s.paymentLink?.status === 'pending').length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No active payment links</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Trial Bookings</CardTitle>
              <CardDescription>View and manage trial bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This tab will contain trial booking management features.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Track sales performance and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This tab will contain sales analytics and performance tracking.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedSalesDashboard;
