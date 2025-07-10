
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Phone, 
  Calendar, 
  Clock,
  MapPin,
  BookOpen,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  User
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  age: number;
  phone: string;
  country: string;
  platform: string;
  status: string;
  package_session_count?: number;
  notes?: string;
  parent_name?: string;
  payment_amount?: number;
  payment_currency?: string;
}

interface ModernTeacherStudentCardProps {
  student: Student;
  onViewSessions?: (studentId: string) => void;
  onContact?: (studentId: string) => void;
  onViewProgress?: (studentId: string) => void;
}

const ModernTeacherStudentCard: React.FC<ModernTeacherStudentCardProps> = ({
  student,
  onViewSessions,
  onContact,
  onViewProgress
}) => {
  const { isRTL } = useLanguage();
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'trial-completed':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'S';
  };

  return (
    <Card className="border border-stone-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden">
      {/* Header Section */}
      <div className={`flex items-start justify-between p-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Avatar className="h-12 w-12 border-2 border-stone-200">
            <AvatarFallback className="bg-gradient-to-br from-stone-400 to-stone-600 text-white font-semibold">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className="font-semibold text-stone-900 text-lg">{student.name}</h3>
            <p className="text-sm text-stone-600">Age {student.age} • ID: {student.id.slice(0, 8)}</p>
            {student.parent_name && (
              <p className="text-xs text-stone-500">Parent: {student.parent_name}</p>
            )}
          </div>
        </div>
        
        <Badge className={`px-3 py-1 text-xs font-medium border ${getStatusColor(student.status)}`}>
          {student.status?.charAt(0).toUpperCase() + student.status?.slice(1) || 'Active'}
        </Badge>
      </div>

      {/* Information Rows */}
      <div className="px-4 pb-4 space-y-3">
        {/* Phone */}
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-stone-100">
            <Phone className="h-4 w-4 text-stone-600" />
          </div>
          <span className="text-sm text-stone-700 font-medium">{student.phone}</span>
        </div>

        {/* Country */}
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-stone-100">
            <MapPin className="h-4 w-4 text-stone-600" />
          </div>
          <span className="text-sm text-stone-700">{student.country}</span>
        </div>

        {/* Platform */}
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-stone-100">
            <MessageSquare className="h-4 w-4 text-stone-600" />
          </div>
          <span className="text-sm text-stone-700">{student.platform}</span>
        </div>

        {/* Package Sessions */}
        {student.package_session_count && (
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-stone-100">
              <BookOpen className="h-4 w-4 text-stone-600" />
            </div>
            <span className="text-sm text-stone-700">{student.package_session_count} Sessions Package</span>
          </div>
        )}

        {/* Payment Amount */}
        {student.payment_amount && (
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-stone-100">
              <User className="h-4 w-4 text-stone-600" />
            </div>
            <span className="text-sm text-stone-700">
              {student.payment_amount} {student.payment_currency || 'USD'}
            </span>
          </div>
        )}
      </div>

      {/* Notes Section */}
      {student.notes && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setIsNotesExpanded(!isNotesExpanded)}
            className={`flex items-center gap-2 w-full text-left text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <span>Notes</span>
            {isNotesExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {isNotesExpanded && (
            <div className="mt-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
              <p className="text-sm text-stone-700">{student.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 pb-4 pt-2 border-t border-stone-100">
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            onClick={() => onViewSessions?.(student.id)}
            className="flex-1 bg-gradient-to-r from-stone-600 to-stone-700 hover:from-stone-700 hover:to-stone-800 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-xs"
          >
            View Sessions
          </Button>
          <Button
            onClick={() => onContact?.(student.id)}
            variant="outline"
            className="flex-1 border-stone-300 text-stone-700 hover:bg-stone-50 font-medium py-2 px-3 rounded-lg transition-all duration-200 text-xs"
          >
            Contact
          </Button>
          {student.status === 'active' && (
            <Button
              onClick={() => onViewProgress?.(student.id)}
              variant="outline"
              className="flex-1 border-stone-300 text-stone-700 hover:bg-stone-50 font-medium py-2 px-3 rounded-lg transition-all duration-200 text-xs"
            >
              Progress
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ModernTeacherStudentCard;
