
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  StickyNote, 
  ChevronDown, 
  ChevronRight,
  User,
  ClipboardCheck,
  MessageCircle,
  BookOpen,
  Star,
  AlertCircle
} from 'lucide-react';
import { StudentNote } from '@/types/studentNotes';
import { format } from 'date-fns';

interface StudentNotesDisplayProps {
  notes: StudentNote[];
  status: string;
  compact?: boolean;
  showTitle?: boolean;
}

export const StudentNotesDisplay: React.FC<StudentNotesDisplayProps> = ({
  notes,
  status,
  compact = false,
  showTitle = true
}) => {
  const [expanded, setExpanded] = useState(!compact);

  const getTypeIcon = (noteType: string) => {
    try {
      switch (noteType) {
        case 'sales_booking':
          return <User className="h-4 w-4 text-blue-600" />;
        case 'trial_outcome':
          return <ClipboardCheck className="h-4 w-4 text-purple-600" />;
        case 'session_completion':
          return <BookOpen className="h-4 w-4 text-green-600" />;
        case 'general':
          return <MessageCircle className="h-4 w-4 text-gray-600" />;
        default:
          return <StickyNote className="h-4 w-4 text-orange-600" />;
      }
    } catch (error) {
      console.warn('⚠️ Error getting type icon:', error);
      return <StickyNote className="h-4 w-4 text-orange-600" />;
    }
  };

  const getTypeLabel = (noteType: string) => {
    try {
      switch (noteType) {
        case 'sales_booking':
          return 'Sales Notes';
        case 'trial_outcome':
          return 'Trial Outcome';
        case 'session_completion':
          return 'Session Notes';
        case 'general':
          return 'Contact Notes';
        default:
          return 'Notes';
      }
    } catch (error) {
      console.warn('⚠️ Error getting type label:', error);
      return 'Notes';
    }
  };

  const getStatusColor = (noteStatus: string) => {
    try {
      switch (noteStatus) {
        case 'pending':
          return 'bg-orange-100 text-orange-800';
        case 'confirmed':
          return 'bg-blue-100 text-blue-800';
        case 'trial-completed':
          return 'bg-green-100 text-green-800';
        case 'trial-ghosted':
          return 'bg-red-100 text-red-800';
        case 'active':
          return 'bg-cyan-100 text-cyan-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    } catch (error) {
      console.warn('⚠️ Error getting status color:', error);
      return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      console.warn('⚠️ Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Handle empty or invalid notes
  if (!notes || notes.length === 0) {
    return null;
  }

  // Handle invalid notes array
  if (!Array.isArray(notes)) {
    console.warn('⚠️ Notes is not an array:', notes);
    return (
      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <p className="text-sm text-yellow-800">Unable to display notes</p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between p-2">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Notes ({notes.length})</span>
            </div>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {notes.map((note, index) => {
            try {
              return (
                <div key={note.id || `note-${index}`} className="p-2 bg-muted/50 rounded-md border-l-2 border-primary/20">
                  <div className="flex items-start gap-2 mb-1">
                    {getTypeIcon(note.noteType)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{getTypeLabel(note.noteType)}</span>
                        <Badge className={`${getStatusColor(note.status)} border-0 text-xs`}>
                          {note.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {note.content || 'No content'}
                      </p>
                      
                      {/* Show trial outcome metadata */}
                      {note.noteType === 'trial_outcome' && note.metadata && (
                        <div className="mt-2 space-y-1">
                          {note.metadata.studentBehavior && (
                            <div className="text-xs">
                              <span className="font-medium">Behavior: </span>
                              <span className="text-muted-foreground">{note.metadata.studentBehavior}</span>
                            </div>
                          )}
                          {note.metadata.recommendedPackage && (
                            <div className="text-xs">
                              <span className="font-medium">Recommended: </span>
                              <span className="text-muted-foreground">{note.metadata.recommendedPackage}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(note.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            } catch (error) {
              console.warn('⚠️ Error rendering note:', error, note);
              return (
                <div key={`error-${index}`} className="p-2 bg-red-50 rounded-md border border-red-200">
                  <p className="text-xs text-red-600">Error displaying note</p>
                </div>
              );
            }
          })}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <StickyNote className="h-4 w-4" />
            Student Journey Notes
            <Badge variant="outline">{notes.length}</Badge>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {notes.map((note, index) => {
          try {
            return (
              <div key={note.id || `note-${index}`} className="p-3 bg-muted/30 rounded-lg border-l-4 border-primary/30">
                <div className="flex items-start gap-3">
                  {getTypeIcon(note.noteType)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{getTypeLabel(note.noteType)}</span>
                      <Badge className={`${getStatusColor(note.status)} border-0`}>
                        {note.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm whitespace-pre-wrap mb-2">{note.content || 'No content'}</p>
                    
                    {/* Enhanced trial outcome display */}
                    {note.noteType === 'trial_outcome' && note.metadata && (
                      <div className="space-y-2 p-3 bg-background rounded-md border">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium text-sm">Trial Details</span>
                        </div>
                        
                        {note.metadata.studentBehavior && (
                          <div>
                            <span className="font-medium text-sm">Student Behavior & Engagement:</span>
                            <p className="text-sm text-muted-foreground mt-1">{note.metadata.studentBehavior}</p>
                          </div>
                        )}
                        
                        {note.metadata.recommendedPackage && (
                          <div>
                            <span className="font-medium text-sm">Recommended Package:</span>
                            <p className="text-sm text-muted-foreground mt-1">{note.metadata.recommendedPackage}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      {formatDate(note.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          } catch (error) {
            console.warn('⚠️ Error rendering note:', error, note);
            return (
              <div key={`error-${index}`} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-800">Error displaying note</p>
                </div>
              </div>
            );
          }
        })}
      </CardContent>
    </Card>
  );
};
