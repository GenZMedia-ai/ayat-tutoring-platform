
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationError {
  id: string;
  event_type: string;
  payload: any;
  error_message: string;
  created_at: string;
}

const NotificationMonitor: React.FC = () => {
  const [errors, setErrors] = useState<NotificationError[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_errors: 0,
    recent_errors: 0,
    error_types: {} as Record<string, number>
  });

  const fetchNotificationErrors = async () => {
    setLoading(true);
    try {
      // Get recent errors (last 24 hours)
      const { data: recentErrors, error } = await supabase
        .from('notification_errors')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setErrors(recentErrors || []);

      // Calculate stats
      const errorTypes: Record<string, number> = {};
      recentErrors?.forEach(error => {
        errorTypes[error.event_type] = (errorTypes[error.event_type] || 0) + 1;
      });

      setStats({
        total_errors: recentErrors?.length || 0,
        recent_errors: recentErrors?.filter(e => 
          new Date(e.created_at) > new Date(Date.now() - 60 * 60 * 1000)
        ).length || 0,
        error_types: errorTypes
      });

    } catch (error) {
      console.error('Error fetching notification errors:', error);
      toast.error('Failed to fetch notification errors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationErrors();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEventTypeBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'teacher.student.assigned':
      case 'teacher.family.assigned':
        return 'bg-blue-100 text-blue-800';
      case 'trial.outcome.submitted':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notification Monitor</h2>
        <Button 
          onClick={fetchNotificationErrors}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Errors (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold">{stats.total_errors}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Recent Errors (1h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold">{stats.recent_errors}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">
                {stats.recent_errors === 0 ? 'Healthy' : 'Issues Detected'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Types Overview */}
      {Object.keys(stats.error_types).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Error Types (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.error_types).map(([type, count]) => (
                <Badge 
                  key={type} 
                  variant="outline"
                  className={getEventTypeBadgeColor(type)}
                >
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notification Errors</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4">Loading...</p>
          ) : errors.length === 0 ? (
            <p className="text-center py-4 text-green-600">
              ✅ No notification errors in the last 24 hours
            </p>
          ) : (
            <div className="space-y-4">
              {errors.map((error) => (
                <div 
                  key={error.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge className={getEventTypeBadgeColor(error.event_type)}>
                      {error.event_type}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatTimestamp(error.created_at)}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    <strong>Error:</strong> {error.error_message}
                  </div>
                  
                  <details className="text-sm">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      View Payload
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                      {JSON.stringify(error.payload, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationMonitor;
