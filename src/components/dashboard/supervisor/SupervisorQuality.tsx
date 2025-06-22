
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SupervisorQuality: React.FC = () => {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Quality Control</CardTitle>
        <CardDescription>
          Session observation and performance evaluation tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h4 className="font-medium">Session Observation</h4>
              <div className="space-y-2">
                <Button className="w-full justify-start ayat-button-primary">
                  Schedule Observation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Review Past Observations
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Performance Tools</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Teacher Feedback Forms
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Student Satisfaction Reports
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Recent Quality Actions</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <span className="font-medium">Session Reassignment</span>
                  <p className="text-sm text-muted-foreground">
                    Reassigned Omar's session to Sara Mohamed
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupervisorQuality;
