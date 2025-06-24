
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Plus,
  Filter
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

const AdminAvailability: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teacherTypeFilter, setTeacherTypeFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, 1 = next week, etc.

  // Mock data - in real implementation, this would come from hooks
  const teachers = [
    {
      id: '1',
      name: 'Ahmed Hassan',
      teacherType: 'male',
      totalSlots: 35,
      bookedSlots: 28,
      availableSlots: 7,
      emergencyOverride: false,
      status: 'active',
      lastUpdated: '2024-06-22T10:00:00Z'
    },
    {
      id: '2',
      name: 'Fatima Al-Rashid',
      teacherType: 'female',
      totalSlots: 30,
      bookedSlots: 25,
      availableSlots: 5,
      emergencyOverride: false,
      status: 'active',
      lastUpdated: '2024-06-22T14:30:00Z'
    },
    {
      id: '3',
      name: 'Omar Khalil',
      teacherType: 'male',
      totalSlots: 40,
      bookedSlots: 40,
      availableSlots: 0,
      emergencyOverride: true,
      status: 'full',
      lastUpdated: '2024-06-22T09:15:00Z'
    },
    {
      id: '4',
      name: 'Aisha Mohamed',
      teacherType: 'female',
      totalSlots: 25,
      bookedSlots: 15,
      availableSlots: 10,
      emergencyOverride: false,
      status: 'active',
      lastUpdated: '2024-06-22T16:45:00Z'
    }
  ];

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = teacherTypeFilter === 'all' || teacher.teacherType === teacherTypeFilter;
    const matchesAvailability = availabilityFilter === 'all' || 
      (availabilityFilter === 'available' && teacher.availableSlots > 0) ||
      (availabilityFilter === 'full' && teacher.availableSlots === 0) ||
      (availabilityFilter === 'emergency' && teacher.emergencyOverride);
    
    return matchesSearch && matchesType && matchesAvailability;
  });

  const getAvailabilityBadge = (teacher: any) => {
    if (teacher.emergencyOverride) {
      return <Badge className="bg-red-100 text-red-800 border-0">Emergency Override</Badge>;
    }
    if (teacher.availableSlots === 0) {
      return <Badge className="bg-orange-100 text-orange-800 border-0">Fully Booked</Badge>;
    }
    if (teacher.availableSlots < 5) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-0">Limited Availability</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 border-0">Available</Badge>;
  };

  const getUtilizationPercentage = (teacher: any) => {
    return Math.round((teacher.bookedSlots / teacher.totalSlots) * 100);
  };

  const getCurrentWeekStart = () => {
    const today = new Date();
    return addDays(startOfWeek(today, { weekStartsOn: 1 }), selectedWeek * 7);
  };

  const getWeekDays = () => {
    const weekStart = getCurrentWeekStart();
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };

  const stats = {
    totalTeachers: teachers.length,
    totalSlots: teachers.reduce((sum, t) => sum + t.totalSlots, 0),
    bookedSlots: teachers.reduce((sum, t) => sum + t.bookedSlots, 0),
    availableSlots: teachers.reduce((sum, t) => sum + t.availableSlots, 0),
    emergencyOverrides: teachers.filter(t => t.emergencyOverride).length
  };

  const overallUtilization = Math.round((stats.bookedSlots / stats.totalSlots) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Global Availability Overview</h3>
          <p className="text-sm text-muted-foreground">
            Monitor teacher capacity and manage emergency overrides
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Capacity Settings
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Emergency Override
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Teachers</p>
                <p className="text-2xl font-bold">{stats.totalTeachers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Slots</p>
                <p className="text-2xl font-bold">{stats.totalSlots}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Booked</p>
                <p className="text-2xl font-bold text-orange-600">{stats.bookedSlots}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">{stats.availableSlots}</p>
              </div>
              <XCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilization</p>
                <p className="text-2xl font-bold">{overallUtilization}%</p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${overallUtilization > 90 ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Teacher Overview</TabsTrigger>
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="analytics">Capacity Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search teachers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Select value={teacherTypeFilter} onValueChange={setTeacherTypeFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="male">Male Teachers</SelectItem>
                      <SelectItem value="female">Female Teachers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:w-48">
                  <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="full">Fully Booked</SelectItem>
                      <SelectItem value="emergency">Emergency Override</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teachers List */}
          <Card>
            <CardHeader>
              <CardTitle>Teachers ({filteredTeachers.length})</CardTitle>
              <CardDescription>
                Current availability status and capacity management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTeachers.map((teacher) => (
                  <div key={teacher.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-semibold">{teacher.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {teacher.teacherType} Teacher
                            </Badge>
                            {getAvailabilityBadge(teacher)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Last updated: {format(new Date(teacher.lastUpdated), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>

                    {/* Capacity Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Capacity Utilization</span>
                        <span>{getUtilizationPercentage(teacher)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            getUtilizationPercentage(teacher) > 90 ? 'bg-red-500' :
                            getUtilizationPercentage(teacher) > 75 ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${getUtilizationPercentage(teacher)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="font-semibold text-lg">{teacher.totalSlots}</p>
                        <p className="text-muted-foreground">Total Slots</p>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <p className="font-semibold text-lg text-orange-600">{teacher.bookedSlots}</p>
                        <p className="text-muted-foreground">Booked</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="font-semibold text-lg text-green-600">{teacher.availableSlots}</p>
                        <p className="text-muted-foreground">Available</p>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        View Schedule
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Adjust Capacity
                      </Button>
                      {teacher.availableSlots === 0 && (
                        <Button variant="outline" size="sm" className="text-red-600">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Emergency Override
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule Overview</CardTitle>
              <CardDescription>
                Visual representation of teacher availability by day and time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={selectedWeek.toString()} onValueChange={(value) => setSelectedWeek(parseInt(value))}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Current Week</SelectItem>
                    <SelectItem value="1">Next Week</SelectItem>
                    <SelectItem value="2">Week After Next</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Weekly schedule grid will be displayed here showing teacher availability by time slots
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Capacity Analytics</CardTitle>
              <CardDescription>
                Trends and insights for capacity planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Capacity analytics charts and insights will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAvailability;
