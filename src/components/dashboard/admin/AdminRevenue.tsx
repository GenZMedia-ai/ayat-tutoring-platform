
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Package,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  TrendingDown
} from 'lucide-react';

const AdminRevenue: React.FC = () => {
  const [timeRange, setTimeRange] = useState('this-month');
  const [currency, setCurrency] = useState('USD');

  // Mock data - in real implementation, this would come from hooks
  const revenueData = {
    totalRevenue: 125000,
    monthlyGrowth: 15.2,
    totalStudents: 287,
    activeTeachers: 12,
    avgRevenuePerStudent: 435,
    topPackage: '8 Sessions',
    packageRevenue: {
      '4 Sessions': 25000,
      '8 Sessions': 65000,
      '12 Sessions': 35000
    },
    teacherPerformance: [
      { name: 'Ahmed Hassan', students: 35, revenue: 18500, growth: 12.5 },
      { name: 'Fatima Al-Rashid', students: 28, revenue: 14200, growth: 8.3 },
      { name: 'Omar Khalil', students: 42, revenue: 22100, growth: 18.7 },
      { name: 'Aisha Mohamed', students: 25, revenue: 12750, growth: 6.1 }
    ],
    salesAgentPerformance: [
      { name: 'Sarah Johnson', conversions: 45, revenue: 32500, conversionRate: 68.2 },
      { name: 'Mike Chen', conversions: 38, revenue: 28400, conversionRate: 61.3 },
      { name: 'Lisa Wang', conversions: 32, revenue: 24800, conversionRate: 59.7 },
      { name: 'Ahmed Ali', conversions: 29, revenue: 21300, conversionRate: 55.4 }
    ],
    monthlyTrend: [
      { month: 'Jan', revenue: 95000, students: 245 },
      { month: 'Feb', revenue: 102000, students: 258 },
      { month: 'Mar', revenue: 108000, students: 267 },
      { month: 'Apr', revenue: 115000, students: 275 },
      { month: 'May', revenue: 118000, students: 281 },
      { month: 'Jun', revenue: 125000, students: 287 }
    ]
  };

  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'د.إ'
  };

  const formatCurrency = (amount: number) => {
    const symbol = currencySymbols[currency] || '$';
    return `${symbol}${(amount / 100).toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">System Revenue Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive revenue tracking and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-quarter">This Quarter</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="AED">AED</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(revenueData.totalRevenue)}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    {formatPercentage(revenueData.monthlyGrowth)}
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold">{revenueData.totalStudents}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Avg: {formatCurrency(revenueData.avgRevenuePerStudent)} per student
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Teachers</p>
                <p className="text-2xl font-bold">{revenueData.activeTeachers}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Avg: {Math.round(revenueData.totalStudents / revenueData.activeTeachers)} students each
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Package</p>
                <p className="text-2xl font-bold">{revenueData.topPackage}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(revenueData.packageRevenue['8 Sessions'])} revenue
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Revenue Overview</TabsTrigger>
          <TabsTrigger value="teachers">Teacher Performance</TabsTrigger>
          <TabsTrigger value="sales">Sales Performance</TabsTrigger>
          <TabsTrigger value="packages">Package Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
                <CardDescription>Revenue and student growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueData.monthlyTrend.map((month, index) => (
                    <div key={month.month} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{month.month} 2024</p>
                        <p className="text-sm text-muted-foreground">{month.students} students</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(month.revenue)}</p>
                        {index > 0 && (
                          <div className="flex items-center">
                            {month.revenue > revenueData.monthlyTrend[index - 1].revenue ? (
                              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                            )}
                            <span className={`text-xs ${month.revenue > revenueData.monthlyTrend[index - 1].revenue ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(((month.revenue - revenueData.monthlyTrend[index - 1].revenue) / revenueData.monthlyTrend[index - 1].revenue) * 100)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Package Revenue Distribution</CardTitle>
                <CardDescription>Revenue breakdown by package type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(revenueData.packageRevenue).map(([packageName, revenue]) => {
                    const percentage = (revenue / revenueData.totalRevenue) * 100;
                    return (
                      <div key={packageName} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{packageName}</span>
                          <span>{formatCurrency(revenue)} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Revenue Performance</CardTitle>
              <CardDescription>Individual teacher revenue and growth metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueData.teacherPerformance.map((teacher, index) => (
                  <div key={teacher.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{teacher.name}</h4>
                        <p className="text-sm text-muted-foreground">{teacher.students} active students</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{formatCurrency(teacher.revenue)}</p>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-sm text-green-600 font-medium">
                            {formatPercentage(teacher.growth)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Revenue per student: {formatCurrency(teacher.revenue / teacher.students)}</span>
                      <span>Rank: #{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Agent Performance</CardTitle>
              <CardDescription>Conversion rates and revenue by sales agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueData.salesAgentPerformance.map((agent, index) => (
                  <div key={agent.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{agent.name}</h4>
                        <p className="text-sm text-muted-foreground">{agent.conversions} conversions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{formatCurrency(agent.revenue)}</p>
                        <p className="text-sm text-muted-foreground">
                          {agent.conversionRate.toFixed(1)}% conversion rate
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Conversion Rate</span>
                        <span>{agent.conversionRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            agent.conversionRate > 65 ? 'bg-green-500' :
                            agent.conversionRate > 55 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${agent.conversionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Package Performance Analysis</CardTitle>
              <CardDescription>Detailed breakdown of package popularity and profitability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Detailed package analytics charts will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminRevenue;
