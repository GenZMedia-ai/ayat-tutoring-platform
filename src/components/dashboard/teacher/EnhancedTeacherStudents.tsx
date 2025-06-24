
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeacherActiveStudents } from '@/hooks/useTeacherActiveStudents';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { CompactStudentCard } from '@/components/teacher/CompactStudentCard';

const EnhancedTeacherStudents: React.FC = () => {
  const { students, loading } = useTeacherActiveStudents();

  const handleEditSession = (sessionData: any) => {
    // TODO: Implement session editing modal
    console.log('Edit session:', sessionData);
  };

  if (loading) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Active Students</CardTitle>
          <CardDescription>View and manage your active students and their progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2 text-muted-foreground">Loading students...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Active Students</h1>
        <p className="text-muted-foreground">Manage your active students and track their progress</p>
      </div>

      {students.length === 0 ? (
        <Card className="dashboard-card">
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-muted-foreground text-lg font-medium">No active students found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Students will appear here once they complete registration and start their sessions
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {students.map((student) => (
            <CompactStudentCard
              key={student.studentId}
              student={student}
              onEditSession={handleEditSession}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedTeacherStudents;
