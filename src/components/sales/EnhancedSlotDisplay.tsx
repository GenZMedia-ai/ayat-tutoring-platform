
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, MapPin, AlertCircle, Search, Database } from 'lucide-react';
import { GroupedTimeSlot, SimpleTimeSlot } from '@/services/simpleAvailabilityService';

interface EnhancedSlotDisplayProps {
  groupedSlots: GroupedTimeSlot[];
  onBookSlot: (slot: SimpleTimeSlot) => void;
  loading?: boolean;
}

export const EnhancedSlotDisplay: React.FC<EnhancedSlotDisplayProps> = ({
  groupedSlots,
  onBookSlot,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p>Searching for available slots...</p>
        <p className="text-xs mt-2">Checking teacher availability and timezone conversion...</p>
      </div>
    );
  }

  if (groupedSlots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <div className="space-y-2">
          <p className="font-medium text-red-600">No available slots found for the selected hour.</p>
          <div className="text-sm space-y-2">
            <div className="p-3 bg-yellow-50 rounded-lg text-left">
              <p className="font-medium text-yellow-800 mb-2">🔍 Search Details:</p>
              <p className="text-yellow-700 text-xs">Check browser console for detailed search logs including:</p>
              <ul className="list-disc list-inside text-yellow-700 text-xs mt-1 space-y-1">
                <li>Timezone conversion results</li>
                <li>Database query parameters</li>
                <li>Teacher filtering process</li>
                <li>Available vs searched time slots</li>
              </ul>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg text-left">
              <p className="font-medium text-blue-800 mb-2">💡 Troubleshooting Tips:</p>
              <ul className="list-disc list-inside text-blue-700 text-xs space-y-1">
                <li><strong>Check Console:</strong> Open browser dev tools for detailed search logs</li>
                <li><strong>Try Different Hours:</strong> Database shows availability 4:00 PM - 6:30 PM Qatar time</li>
                <li><strong>Teacher Type:</strong> Try "Mixed" for more options</li>
                <li><strong>Date:</strong> Ensure selected date has teacher availability</li>
                <li><strong>Timezone:</strong> Verify timezone matches client location</li>
              </ul>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg text-left">
              <p className="font-medium text-green-800 mb-2">📅 Current Database Status:</p>
              <div className="text-green-700 text-xs space-y-1">
                <p><strong>Date:</strong> June 24, 2025</p>
                <p><strong>Available Times (Qatar):</strong> 7:00 PM - 9:30 PM</p>
                <p><strong>Available Times (UTC):</strong> 16:00 - 18:30</p>
                <p><strong>Teachers:</strong> 6 slots available with teacher "Esraa"</p>
                <p><strong>Search Range:</strong> System searches exact hour + fallback (±1 hour)</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-gray-600" />
                <p className="font-medium text-gray-800 text-sm">Debug Information</p>
              </div>
              <p className="text-xs text-gray-600">
                If slots should be available, check browser console for detailed search logs. 
                The system logs timezone conversion, database queries, and teacher filtering steps.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-lg">
          Available Time Slots ({groupedSlots.length} time{groupedSlots.length !== 1 ? 's' : ''} found)
        </h4>
        <Badge variant="outline" className="text-xs">
          Total: {groupedSlots.reduce((sum, slot) => sum + slot.teacherCount, 0)} teachers available
        </Badge>
      </div>

      <div className="space-y-3">
        {groupedSlots.map((timeSlot, index) => (
          <Card key={`${timeSlot.utcStartTime}-${index}`} className="border border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  {/* Time Range Display */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-lg text-primary">
                      {timeSlot.timeRange}
                    </span>
                  </div>
                  
                  {/* Teacher Count */}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-green-600">
                      {timeSlot.teacherCount} teacher{timeSlot.teacherCount !== 1 ? 's' : ''} available
                    </span>
                  </div>
                  
                  {/* Timezone Information */}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {timeSlot.egyptTimeDisplay}
                    </span>
                  </div>
                  
                  {/* UTC Time for Reference */}
                  <div className="text-xs text-green-600">
                    UTC: {timeSlot.utcStartTime} - {timeSlot.utcEndTime}
                  </div>

                  {/* Teacher Details */}
                  <div className="text-xs text-gray-600">
                    Teachers: {timeSlot.teachers.map(t => `${t.teacherName} (${t.teacherType})`).join(', ')}
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Quick Book Button */}
                  <Button 
                    size="sm"
                    className="w-full ayat-button-primary"
                    onClick={() => onBookSlot(timeSlot.teachers[0])}
                  >
                    Book Any Teacher
                  </Button>
                  
                  {/* Show individual teachers if more than 1 */}
                  {timeSlot.teacherCount > 1 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground text-center">Or choose specific teacher:</p>
                      {timeSlot.teachers.slice(0, 3).map((teacher) => (
                        <Button
                          key={teacher.id}
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => onBookSlot(teacher)}
                        >
                          {teacher.teacherName} ({teacher.teacherType})
                        </Button>
                      ))}
                      {timeSlot.teacherCount > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{timeSlot.teacherCount - 3} more teachers
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Enhanced Summary Information */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium text-sm">Search Results Summary</p>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            💡 <strong>Found {groupedSlots.length} available time slots</strong> with automatic timezone conversion.
          </p>
          <p>
            🔍 <strong>Search included:</strong> Exact hour + ±1 hour fallback range for better availability.
          </p>
          <p>
            👥 <strong>Teacher Filtering:</strong> Mixed teachers are included in all searches for maximum options.
          </p>
          <p>
            🕒 <strong>Each slot:</strong> 30 minutes long with real-time availability checking.
          </p>
        </div>
      </div>
    </div>
  );
};
