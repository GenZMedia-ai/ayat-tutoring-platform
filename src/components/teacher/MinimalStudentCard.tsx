
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Phone, User, Users, MapPin, BookOpen } from 'lucide-react';

interface MinimalStudentCardProps {
  student: any;
  onContact: () => void;
  onCompleteRegistration: () => void;
}

export const MinimalStudentCard: React.FC<MinimalStudentCardProps> = ({
  student,
  onContact,
  onCompleteRegistration
}) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                {student.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Age {student.age}</span>
                {student.isFamilyMember && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>Family</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300"
          >
            PAID
          </Badge>
        </div>

        {/* Student Details */}
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-primary">
                {student.packageSessionCount} sessions to schedule
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <BookOpen className="h-4 w-4 text-slate-400" />
              <span className="capitalize">{student.platform}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>{student.country}</span>
            </div>
          </div>

          {student.parentName && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">Parent:</span> {student.parentName}
              </p>
            </div>
          )}

          {student.notes && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {student.notes}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1 border-slate-200 hover:bg-slate-50 dark:border-slate-700"
            onClick={onContact}
          >
            <Phone className="h-4 w-4 mr-2" />
            Contact
          </Button>
          <Button 
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-sm"
            onClick={onCompleteRegistration}
          >
            <Clock className="h-4 w-4 mr-2" />
            Schedule Sessions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
