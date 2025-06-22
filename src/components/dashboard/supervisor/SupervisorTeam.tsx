
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SupervisorTeam: React.FC = () => {
  const teachers = [
    { id: '1', name: 'Sara Mohamed', type: 'Kids', capacity: '8/10', performance: 'Excellent' },
    { id: '2', name: 'Omar Ahmed', type: 'Mixed', capacity: '6/10', performance: 'Good' },
    { id: '3', name: 'Layla Hassan', type: 'Adult', capacity: '9/10', performance: 'Excellent' }
  ];

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Teacher Management</CardTitle>
        <CardDescription>
          Monitor and manage your assigned teachers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">{teacher.name}</h4>
                <div className="flex gap-2">
                  <Badge variant="outline">{teacher.type}</Badge>
                  <Badge variant="secondary">Capacity: {teacher.capacity}</Badge>
                  <Badge variant={teacher.performance === 'Excellent' ? 'default' : 'secondary'}>
                    {teacher.performance}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  View Details
                </Button>
                <Button size="sm" className="ayat-button-primary">
                  Manage
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupervisorTeam;
