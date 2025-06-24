
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Users,
  Eye,
  Ban,
  Edit,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

const AdminPaymentLinks: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');

  // Mock data - in real implementation, this would come from a hook
  const paymentLinks = [
    {
      id: '1',
      studentName: 'Ahmed Hassan',
      uniqueId: 'AH001',
      amount: 15000,
      currency: 'USD',
      status: 'paid',
      createdBy: 'Sarah Johnson',
      createdAt: '2024-06-20T10:00:00Z',
      clickedAt: '2024-06-21T14:30:00Z',
      paidAt: '2024-06-21T14:45:00Z',
      packageSessionCount: 8,
      paymentType: 'single_student'
    },
    {
      id: '2',
      studentName: 'Fatima Al-Rashid',
      uniqueId: 'FAR002',
      amount: 12000,
      currency: 'USD',
      status: 'pending',
      createdBy: 'Mike Chen',
      createdAt: '2024-06-22T09:15:00Z',
      clickedAt: null,
      paidAt: null,
      packageSessionCount: 6,
      paymentType: 'single_student'
    },
    {
      id: '3',
      studentName: 'Al-Mahmoud Family',
      uniqueId: 'AMF003',
      amount: 28000,
      currency: 'USD',
      status: 'clicked',
      createdBy: 'Sarah Johnson',
      createdAt: '2024-06-23T11:30:00Z',
      clickedAt: '2024-06-23T16:20:00Z',
      paidAt: null,
      packageSessionCount: 16,
      paymentType: 'family'
    }
  ];

  const salesAgents = ['Sarah Johnson', 'Mike Chen', 'Lisa Wang', 'Ahmed Ali'];

  const filteredLinks = paymentLinks.filter(link => {
    const matchesSearch = link.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || link.status === statusFilter;
    const matchesAgent = agentFilter === 'all' || link.createdBy === agentFilter;
    
    return matchesSearch && matchesStatus && matchesAgent;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-orange-100 text-orange-800', label: 'Pending' },
      'clicked': { color: 'bg-blue-100 text-blue-800', label: 'Clicked' },
      'paid': { color: 'bg-green-100 text-green-800', label: 'Paid' },
      'expired': { color: 'bg-red-100 text-red-800', label: 'Expired' }
    };
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>;
  };

  const stats = {
    totalLinks: paymentLinks.length,
    totalRevenue: paymentLinks.filter(l => l.status === 'paid').reduce((sum, l) => sum + l.amount, 0),
    conversionRate: (paymentLinks.filter(l => l.status === 'paid').length / paymentLinks.length * 100).toFixed(1),
    pendingValue: paymentLinks.filter(l => l.status === 'pending' || l.status === 'clicked').reduce((sum, l) => sum + l.amount, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Payment Links Management</h3>
          <p className="text-sm text-muted-foreground">
            Monitor and manage all payment links across the system
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Links</p>
                <p className="text-2xl font-bold">{stats.totalLinks}</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${(stats.totalRevenue / 100).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Value</p>
                <p className="text-2xl font-bold">${(stats.pendingValue / 100).toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, ID, or sales agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
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
            <div className="sm:w-48">
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {salesAgents.map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Links Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Links ({filteredLinks.length})</CardTitle>
          <CardDescription>
            All payment links with admin override capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLinks.map((link) => (
              <div key={link.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{link.studentName}</h4>
                      {getStatusBadge(link.status)}
                      <Badge variant="outline" className="text-xs">
                        {link.paymentType === 'family' ? 'Family' : 'Individual'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {link.uniqueId} • Created by {link.createdBy}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      ${(link.amount / 100).toLocaleString()} {link.currency}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {link.packageSessionCount} sessions
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created:</span>{' '}
                    {format(new Date(link.createdAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                  {link.clickedAt && (
                    <div>
                      <span className="font-medium">Clicked:</span>{' '}
                      {format(new Date(link.clickedAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}
                  {link.paidAt && (
                    <div>
                      <span className="font-medium">Paid:</span>{' '}
                      {format(new Date(link.paidAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}
                </div>

                {/* Admin Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {link.status === 'pending' && (
                    <>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Modify
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Ban className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPaymentLinks;
