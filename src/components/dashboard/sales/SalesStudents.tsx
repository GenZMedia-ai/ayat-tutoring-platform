
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Calendar, Package, DollarSign, Phone, BookOpen, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaidStudent {
  id: string;
  unique_id: string;
  name: string;
  age: number;
  phone: string;
  country: string;
  platform: string;
  status: string;
  parent_name: string | null;
  package_session_count: number;
  package_name: string | null;
  payment_amount: number;
  payment_currency: string;
  created_at: string;
  sessions_completed: number;
  is_family_member: boolean;
  family_group_id: string | null;
  teacher_name: string;
  assigned_teacher_id: string | null;
}

const SalesStudents: React.FC = () => {
  const [paidStudents, setPaidStudents] = useState<PaidStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // Load paid students with optimized session counting
  const loadPaidStudents = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      console.log('Loading paid students for user:', user.id);

      // Get students with their teacher information using proper foreign key relationship
      const { data: students, error } = await supabase
        .from('students')
        .select(`
          id,
          unique_id,
          name,
          age,
          phone,
          country,
          platform,
          status,
          parent_name,
          package_session_count,
          package_name,
          payment_amount,
          payment_currency,
          created_at,
          family_group_id,
          assigned_teacher_id,
          profiles!fk_students_assigned_teacher (
            full_name
          )
        `)
        .eq('assigned_sales_agent_id', user.id)
        .in('status', ['paid', 'active', 'expired'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading students:', error);
        throw new Error(`Failed to load students: ${error.message}`);
      }

      console.log('Loaded students:', students?.length || 0);

      if (!students || students.length === 0) {
        setPaidStudents([]);
        console.log('No paid students found');
        return;
      }

      // Get session completion counts for all students in a single query
      const studentIds = students.map(s => s.id);
      
      const { data: sessionCounts, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          id,
          status,
          session_students!inner(
            student_id
          )
        `)
        .in('session_students.student_id', studentIds)
        .eq('status', 'completed');

      if (sessionError) {
        console.error('Error loading session counts:', sessionError);
        // Don't throw error, just log it and continue with 0 counts
      }

      console.log('Loaded session counts:', sessionCounts?.length || 0);

      // Create a map of student ID to completed session count
      const sessionCountMap = new Map<string, number>();
      if (sessionCounts) {
        sessionCounts.forEach(session => {
          const studentId = (session.session_students as any)[0]?.student_id;
          if (studentId) {
            sessionCountMap.set(studentId, (sessionCountMap.get(studentId) || 0) + 1);
          }
        });
      }

      // Process students with session counts
      const studentsWithProgress: PaidStudent[] = students.map(student => ({
        id: student.id,
        unique_id: student.unique_id,
        name: student.name,
        age: student.age,
        phone: student.phone,
        country: student.country,
        platform: student.platform,
        status: student.status,
        parent_name: student.parent_name,
        package_session_count: student.package_session_count || 8,
        package_name: student.package_name,
        payment_amount: student.payment_amount || 0,
        payment_currency: student.payment_currency || 'USD',
        created_at: student.created_at,
        sessions_completed: sessionCountMap.get(student.id) || 0,
        is_family_member: Boolean(student.family_group_id),
        family_group_id: student.family_group_id,
        teacher_name: (student.profiles as any)?.full_name || 'Not Assigned',
        assigned_teacher_id: student.assigned_teacher_id
      }));

      setPaidStudents(studentsWithProgress);
      console.log('Processed students with session progress:', studentsWithProgress.length);

    } catch (error) {
      console.error('Error loading paid students:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load paid students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaidStudents();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleWhatsAppContact = (student: PaidStudent) => {
    const phone = student.phone.replace(/[^0-9]/g, '');
    const message = `Hello ${student.name}! This is regarding your learning sessions with us. How are your lessons going?`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading paid students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Paid Students</h3>
          <p className="text-sm text-muted-foreground">
            Monitor your converted students and their learning progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {paidStudents.length} paid students
          </Badge>
          <Button onClick={loadPaidStudents} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {paidStudents.filter(s => s.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Active Students</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {paidStudents.filter(s => s.status === 'paid').length}
              </div>
              <div className="text-sm text-muted-foreground">Awaiting Activation</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {paidStudents.filter(s => s.status === 'expired').length}
              </div>
              <div className="text-sm text-muted-foreground">Expired (Renewal)</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${paidStudents.reduce((sum, s) => sum + (s.payment_amount || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      {paidStudents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No paid students found
              </h3>
              <p className="text-sm text-muted-foreground">
                Your converted students will appear here once they complete payment
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {paidStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(student.status)}>
                      {student.status.toUpperCase()}
                    </Badge>
                    {student.is_family_member && (
                      <Badge variant="outline">Family Member</Badge>
                    )}
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    {student.payment_amount} {student.payment_currency}
                  </div>
                </div>
                <CardTitle className="text-lg">{student.name}</CardTitle>
                <CardDescription>
                  ID: {student.unique_id} • Age: {student.age}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Phone:</span> {student.phone}
                  </div>
                  <div>
                    <span className="font-medium">Country:</span> {student.country}
                  </div>
                  <div>
                    <span className="font-medium">Platform:</span> {student.platform}
                  </div>
                  <div>
                    <span className="font-medium">Teacher:</span> {student.teacher_name}
                  </div>
                  {student.parent_name && (
                    <div>
                      <span className="font-medium">Parent:</span> {student.parent_name}
                    </div>
                  )}
                </div>

                {/* Package Info */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {student.package_name || 'Standard Package'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {student.sessions_completed}/{student.package_session_count} sessions
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {student.status === 'active' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{getProgressPercentage(student.sessions_completed, student.package_session_count)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${getProgressPercentage(student.sessions_completed, student.package_session_count)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Contact Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleWhatsAppContact(student)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    Contact via WhatsApp
                  </button>
                </div>

                {/* Status-specific messages */}
                {student.status === 'paid' && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    💡 Student has paid and is awaiting session activation by teacher
                  </div>
                )}
                {student.status === 'expired' && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    🔄 Package expired - potential renewal opportunity
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

export default SalesStudents;
