import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, ExternalLink, Copy, CreditCard, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PaymentLinkData {
  id: string;
  student_ids: string[];
  currency: string;
  amount: number;
  stripe_session_id: string | null;
  stripe_checkout_url?: string | null; // Make this optional
  created_by: string;
  expires_at: string;
  clicked_at: string | null;
  paid_at: string | null;
  status: 'pending' | 'clicked' | 'expired' | 'paid';
  created_at: string;
  updated_at: string;
  students?: Array<{
    id: string;
    name: string;
    unique_id: string;
    phone: string;
  }>;
}

const SalesPaymentLinks: React.FC = () => {
  const { user } = useAuth();
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchPaymentLinks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // First get all payment links created by this sales agent
      const { data: links, error: linksError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (linksError) {
        console.error('Error fetching payment links:', linksError);
        throw linksError;
      }

      // Then fetch student details for each payment link
      const enrichedLinks: PaymentLinkData[] = [];
      
      for (const link of links || []) {
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('id, name, unique_id, phone')
          .in('id', link.student_ids);

        if (studentsError) {
          console.error('Error fetching students for payment link:', studentsError);
        }

        enrichedLinks.push({
          ...link,
          students: students || []
        });
      }

      console.log('📋 Payment links loaded:', {
        total: enrichedLinks.length,
        statusBreakdown: {
          pending: enrichedLinks.filter(l => l.status === 'pending').length,
          clicked: enrichedLinks.filter(l => l.status === 'clicked').length,
          paid: enrichedLinks.filter(l => l.status === 'paid').length,
          expired: enrichedLinks.filter(l => l.status === 'expired').length,
        }
      });

      setPaymentLinks(enrichedLinks);
    } catch (error) {
      console.error('Error loading payment links:', error);
      toast.error('Failed to load payment links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentLinks();
  }, [user]);

  // Filter payment links
  const filteredLinks = paymentLinks.filter(link => {
    const studentNames = link.students?.map(s => s.name.toLowerCase()).join(' ') || '';
    const studentIds = link.students?.map(s => s.unique_id.toLowerCase()).join(' ') || '';
    const matchesSearch = studentNames.includes(searchTerm.toLowerCase()) || 
                         studentIds.includes(searchTerm.toLowerCase()) ||
                         link.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || link.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCopyLink = async (link: PaymentLinkData) => {
    if (!link.stripe_session_id) {
      toast.error('No payment session available');
      return;
    }

    // Construct the correct Stripe checkout URL
    const checkoutUrl = `https://checkout.stripe.com/c/pay/${link.stripe_session_id}`;
    
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      toast.success('Payment link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleOpenLink = (link: PaymentLinkData) => {
    if (!link.stripe_session_id) {
      toast.error('No payment session available');
      return;
    }

    // Construct the correct Stripe checkout URL
    const checkoutUrl = `https://checkout.stripe.com/c/pay/${link.stripe_session_id}`;
    window.open(checkoutUrl, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Pending' },
      'clicked': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Clicked' },
      'paid': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Paid' },
      'expired': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Expired' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status };
    return (
      <Badge className={`${config.color} border`}>
        {config.label}
      </Badge>
    );
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'clicked', label: 'Clicked' },
    { value: 'paid', label: 'Paid' },
    { value: 'expired', label: 'Expired' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading payment links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">Payment Links</h3>
          <p className="text-sm text-muted-foreground">
            Manage and track payment links for your students
          </p>
        </div>
        <Button 
          onClick={fetchPaymentLinks} 
          variant="outline" 
          size="sm"
          className="border-primary/30 text-primary hover:bg-primary/5"
        >
          <Search className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <Card className="border-primary/10">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, ID, or payment link ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-primary/30 focus:border-primary"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-primary/30">
                  <Filter className="h-4 w-4 mr-2 text-primary" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({option.value === 'all' ? filteredLinks.length : filteredLinks.filter(l => l.status === option.value).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {paymentLinks.filter(l => l.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {paymentLinks.filter(l => l.status === 'clicked').length}
              </div>
              <div className="text-sm text-muted-foreground">Clicked</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {paymentLinks.filter(l => l.status === 'paid').length}
              </div>
              <div className="text-sm text-muted-foreground">Paid</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {paymentLinks.filter(l => l.status === 'expired').length}
              </div>
              <div className="text-sm text-muted-foreground">Expired</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Links List */}
      {filteredLinks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No payment links found
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'You haven\'t created any payment links yet'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredLinks.map((link) => (
            <Card key={link.id} className="border-l-4 border-l-primary/20 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">
                        {link.currency.toUpperCase()} {(link.amount / 100).toFixed(2)}
                      </CardTitle>
                      {getStatusBadge(link.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created: {format(new Date(link.created_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Students */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Students ({link.students?.length || 0})
                  </p>
                  <div className="space-y-1">
                    {link.students?.map((student) => (
                      <div key={student.id} className="text-sm bg-muted/50 p-2 rounded border border-primary/10">
                        <div className="font-medium">{student.name}</div>
                        <div className="text-muted-foreground">ID: {student.unique_id}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Expires:</span>
                    <div className="text-muted-foreground">
                      {format(new Date(link.expires_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  {link.clicked_at && (
                    <div>
                      <span className="font-medium">Clicked:</span>
                      <div className="text-muted-foreground">
                        {format(new Date(link.clicked_at), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  )}
                  {link.paid_at && (
                    <div>
                      <span className="font-medium">Paid:</span>
                      <div className="text-muted-foreground">
                        {format(new Date(link.paid_at), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-primary/10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(link)}
                    className="flex-1 border-primary/30 text-primary hover:bg-primary/5"
                    disabled={!link.stripe_session_id}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleOpenLink(link)}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={!link.stripe_session_id}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SalesPaymentLinks;
