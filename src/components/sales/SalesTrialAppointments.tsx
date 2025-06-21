import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Calendar, Phone, MapPin, Clock, User, Edit2, MoreHorizontal } from 'lucide-react';
import { useTrialSessionFlow } from '@/hooks/useTrialSessionFlow';
import { StudentTrialCard } from './StudentTrialCard';
import { StudentEditModal } from './StudentEditModal';
import { StatusChangeModal } from './StatusChangeModal';
import { TrialSessionFlowStudent } from '@/types/trial';

const SalesTrialAppointments: React.FC = () => {
  const { students, loading, refetchData } = useTrialSessionFlow();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingStudent, setEditingStudent] = useState<TrialSessionFlowStudent | null>(null);
  const [changingStatusStudent, setChangingStatusStudent] = useState<TrialSessionFlowStudent | null>(null);

  // Filter students based on search and status
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group students by status for better organization
  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const status = student.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(student);
    return acc;
  }, {} as Record<string, TrialSessionFlowStudent[]>);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'trial-completed', label: 'Trial Completed' },
    { value: 'trial-ghosted', label: 'Trial Ghosted' },
    { value: 'awaiting-payment', label: 'Awaiting Payment' },
    { value: 'paid', label: 'Paid' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'dropped', label: 'Dropped' }
  ];

  const getStatusCount = (status: string) => {
    if (status === 'all') return students.length;
    return students.filter(s => s.status === status).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading trial appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Trial Appointments</h3>
          <p className="text-sm text-muted-foreground">
            Manage your trial sessions and student appointments
          </p>
        </div>
        <Button onClick={refetchData} variant="outline" size="sm">
          <Search className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or phone..."
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
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({getStatusCount(option.value)})
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
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {getStatusCount('pending')}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getStatusCount('confirmed')}
              </div>
              <div className="text-sm text-muted-foreground">Confirmed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {getStatusCount('trial-completed')}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {getStatusCount('awaiting-payment')}
              </div>
              <div className="text-sm text-muted-foreground">Awaiting Payment</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No trial appointments found
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'You haven\'t created any trial appointments yet'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStudents.map((student) => (
            <StudentTrialCard
              key={student.id}
              student={student}
              onEdit={setEditingStudent}
              onStatusChange={setChangingStatusStudent}
              onRefresh={refetchData}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {editingStudent && (
        <StudentEditModal
          student={editingStudent}
          open={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            setEditingStudent(null);
            refetchData();
          }}
        />
      )}

      {changingStatusStudent && (
        <StatusChangeModal
          student={changingStatusStudent}
          open={!!changingStatusStudent}
          onClose={() => setChangingStatusStudent(null)}
          onSuccess={() => {
            setChangingStatusStudent(null);
            refetchData();
          }}
        />
      )}
    </div>
  );
};

export default SalesTrialAppointments;
