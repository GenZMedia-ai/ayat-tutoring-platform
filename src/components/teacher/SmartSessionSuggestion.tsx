import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, Clock, Users, Calendar, Zap } from 'lucide-react';

interface SmartSuggestion {
  type: 'consecutive_slots' | 'family_batch' | 'optimal_timing' | 'conflict_resolution';
  title: string;
  description: string;
  benefit: string;
  suggestedSlots?: Array<{
    date: string;
    time: string;
    studentName?: string;
  }>;
  confidence: number;
}

interface SmartSessionSuggestionProps {
  familyStudents?: Array<{
    name: string;
    age: number;
    sessionCount: number;
  }>;
  onAcceptSuggestion: (suggestion: SmartSuggestion) => void;
  onDismiss: () => void;
}

export const SmartSessionSuggestion: React.FC<SmartSessionSuggestionProps> = ({
  familyStudents = [],
  onAcceptSuggestion,
  onDismiss
}) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SmartSuggestion | null>(null);

  useEffect(() => {
    generateSmartSuggestions();
  }, [familyStudents]);

  const generateSmartSuggestions = () => {
    const newSuggestions: SmartSuggestion[] = [];

    // Family Consecutive Slots Suggestion
    if (familyStudents.length > 1) {
      newSuggestions.push({
        type: 'consecutive_slots',
        title: 'Schedule Family Sessions Consecutively',
        description: `Schedule ${familyStudents.length} family members in consecutive 30-minute slots`,
        benefit: 'Saves travel time and creates a routine for the family',
        suggestedSlots: familyStudents.map((student, index) => ({
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
          time: `16:${(index * 30).toString().padStart(2, '0')}:00`, // Starting at 4 PM
          studentName: student.name
        })),
        confidence: 92
      });
    }

    // Optimal Timing Based on Age
    const youngStudents = familyStudents.filter(s => s.age <= 8);
    if (youngStudents.length > 0) {
      newSuggestions.push({
        type: 'optimal_timing',
        title: 'Optimal Schedule for Young Learners',
        description: 'Schedule younger students (age ≤8) in afternoon slots when they\'re most attentive',
        benefit: 'Improved engagement and learning outcomes',
        confidence: 87
      });
    }

    // Family Batch Processing
    if (familyStudents.length >= 3) {
      newSuggestions.push({
        type: 'family_batch',
        title: 'Family Learning Block',
        description: 'Create a 2-hour family learning block with 15-minute breaks between sessions',
        benefit: 'Maximizes family engagement and minimizes scheduling complexity',
        confidence: 89
      });
    }

    setSuggestions(newSuggestions);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 80) return 'text-blue-600 bg-blue-100';
    return 'text-orange-600 bg-orange-100';
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'consecutive_slots':
        return <Clock className="h-5 w-5" />;
      case 'family_batch':
        return <Users className="h-5 w-5" />;
      case 'optimal_timing':
        return <Calendar className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Zap className="h-5 w-5" />
          Smart Scheduling Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-primary/30 bg-primary/5">
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            Our AI has analyzed your family's needs and suggests these optimal scheduling patterns.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md animate-fade-in ${
                selectedSuggestion?.type === suggestion.type
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setSelectedSuggestion(suggestion)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  {getSuggestionIcon(suggestion.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">{suggestion.title}</h4>
                    <Badge className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                      {suggestion.confidence}% match
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  <div className="p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs font-medium text-green-700">
                      ✓ {suggestion.benefit}
                    </p>
                  </div>
                  
                  {suggestion.suggestedSlots && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Suggested Schedule:</p>
                      {suggestion.suggestedSlots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="text-xs bg-muted/50 p-2 rounded flex items-center justify-between">
                          <span className="font-medium">{slot.studentName}</span>
                          <span className="text-muted-foreground">
                            {new Date(slot.date).toLocaleDateString()} at {slot.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={() => selectedSuggestion && onAcceptSuggestion(selectedSuggestion)}
            disabled={!selectedSuggestion}
            className="flex-1 bg-primary hover:bg-primary/90 hover-scale"
          >
            <Zap className="h-4 w-4 mr-2" />
            Apply Smart Schedule
          </Button>
          <Button
            variant="outline"
            onClick={onDismiss}
            className="border-muted-foreground/30 hover-scale"
          >
            Maybe Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};