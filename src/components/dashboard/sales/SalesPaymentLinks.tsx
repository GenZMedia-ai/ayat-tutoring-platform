
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, ExternalLink, Copy, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface PaymentLink {
  id: string;
  student_ids: string[];
  status: string;
  created_at: string;
  expires_at: string;
  paid_at?: string;
  clicked_at?: string;
  stripe_session_id?: string;
  created_by: string;
  student_names?: string[];
  family_group_id?: string;
  payment_type: string;
  package_session_count: number;
}

const SalesPaymentLinks: React.FC = () => {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('thismonth');

  // Get date range based on filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        return { from: now, to: now };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { from: yesterday, to: yesterday };
      case 'last7days':
        return { from: subDays(now, 7), to: now };
      case 'thismonth':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'lastmonth':
        const lastMonth = subDays(startOfMonth(now), 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      case 'alltime':
        return { from: new Date('2024-01-01'), to: now };
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  };

  // Load payment links
  const loadPaymentLinks = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { from, to } = getDateRange();
      const fromStr = format(from, 'yyyy-MM-dd');
      const toStr = format(to, 'yyyy-MM-dd');

      const { data: links, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('created_by', user.id)
        .gte('created_at', fromStr)
        .lte('created_at', toStr + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch student names for each payment link
      const linksWithNames = await Promise.all(
        (links || []).map(async (link) => {
          if (link.family_group_id) {
            // For family payments, get family info
            const { data: family } = await supabase
              .from('family_groups')
              .select('parent_name, student_count')
              .eq('id', link.family_group_id)
              .single();
            
            return {
              ...link,
              student_names: family ? [`${family.parent_name} (${family.student_count} students)`] : ['Family Group']
            };
          } else {
            // For individual payments, get student names
            const { data: students } = await supabase
              .from('students')
              .select('name')
              .in('id', link.student_ids);
            
            return {
              ...link,
              student_names: students?.map(s => s.name) || []
            };
          }
        })
      );

      setPaymentLinks(linksWithNames);
    } catch (error) {
      console.error('Error loading payment links:', error);
      toast.error('Failed to load payment links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentLinks();
  }, [dateFilter]);

  // Filter payment links
  const filteredLinks = paymentLinks.filter(link => {
    const matchesSearch = link.student_names?.some(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || link.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || link.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'clicked':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'clicked':
        return <Clock className="h-4 w-4" />;
      case 'expired':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const copyPaymentLink = (sessionId: string) => {
    if (sessionId) {
      const url = `https://checkout.stripe.com/pay/${sessionId}`;
      navigator.clipboard.writeText(url);
      toast.success('Payment link copied to clipboard');
    }
  };

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
          <h3 className="text-lg font-semibold">Payment Links</h3>
          <p className="text-sm text-muted-foreground">
            Manage all created payment links and track their status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredLinks.length} payment links
          </Badge>
          <Button onClick={loadPaymentLinks} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards - No amounts shown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredLinks.filter(l => l.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredLinks.filter(l => l.status === 'clicked').length}
              </div>
              <div className="text-sm text-muted-foreground">Clicked</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredLinks.filter(l => l.status === 'paid').length}
              </div>
              <div className="text-sm text-muted-foreground">Paid</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {filteredLinks.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Links</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Filter</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="thismonth">This Month</SelectItem>
                  <SelectItem value="lastmonth">Last Month</SelectItem>
                  <SelectItem value="alltime">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Filter</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="clicked">Clicked</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Student name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Links List - No amounts displayed */}
      {filteredLinks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
        <div className="grid grid-cols-1 gap-4">
          {filteredLinks.map((link) => (
            <Card key={link.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(link.status)}
                    <Badge className={getStatusColor(link.status)}>
                      {link.status.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {link.payment_type === 'family' ? 'Family' : 'Individual'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {link.package_session_count} sessions
                  </div>
                </div>
                <CardTitle className="text-lg">
                  {link.student_names?.join(', ') || 'Unknown Student'}
                </CardTitle>
                <CardDescription>
                  Payment Link ID: {link.id.slice(0, 8)}...
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created:</span> {format(new Date(link.created_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                  <div>
                    <span className="font-medium">Expires:</span> {format(new Date(link.expires_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                  {link.clicked_at && (
                    <div>
                      <span className="font-medium">Clicked:</span> {format(new Date(link.clicked_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}
                  {link.paid_at && (
                    <div>
                      <span className="font-medium">Paid:</span> {format(new Date(link.paid_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {link.stripe_session_id && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyPaymentLink(link.stripe_session_id!)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://checkout.stripe.com/pay/${link.stripe_session_id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open Link
                      </Button>
                    </>
                  )}
                </div>

                {/* Status Messages */}
                {link.status === 'pending' && (
                  <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                    ⏳ Payment link created and ready to be shared with the client
                  </div>
                )}
                {link.status === 'clicked' && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    👁️ Client has viewed the payment link but hasn't completed payment yet
                  </div>
                )}
                {link.status === 'paid' && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    ✅ Payment completed successfully! Student is ready for activation
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SalesPaymentLinks;
