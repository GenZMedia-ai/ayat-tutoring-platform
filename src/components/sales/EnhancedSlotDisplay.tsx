
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, MapPin } from 'lucide-react';
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
      </div>
    );
  }

  if (groupedSlots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground space-y-2">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">No available slots found for the selected hour.</p>
        <p className="text-sm">Try selecting a different time or check nearby hours.</p>
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
                          {teacher.teacherName}
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
      
      {/* Summary Information */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> Each time slot is 30 minutes long. 
          You can book with any available teacher or choose a specific one.
        </p>
      </div>
    </div>
  );
};
