
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTrialOutcomes } from '@/hooks/useTrialOutcomes';
import { Student } from '@/types';

interface TrialOutcomeFormProps {
  student: Student;
  sessionId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TrialOutcomeForm: React.FC<TrialOutcomeFormProps> = ({
  student,
  sessionId,
  onSuccess,
  onCancel
}) => {
  const [outcome, setOutcome] = useState<'completed' | 'ghosted' | 'rescheduled'>('completed');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [studentBehavior, setStudentBehavior] = useState('');
  const [recommendedPackage, setRecommendedPackage] = useState('');
  
  const { submitTrialOutcome, isSubmitting } = useTrialOutcomes();

  const handleSubmit = async () => {
    try {
      await submitTrialOutcome(
        student.id,
        sessionId,
        outcome,
        teacherNotes || undefined,
        studentBehavior || undefined,
        recommendedPackage || undefined
      );
      
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit trial outcome:', error);
    }
  };

  const getOutcomeIcon = (outcomeType: string) => {
    switch (outcomeType) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'ghosted':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'rescheduled':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getOutcomeDescription = (outcomeType: string) => {
    switch (outcomeType) {
      case 'completed':
        return 'Student attended and completed the trial session';
      case 'ghosted':
        return 'Student did not show up or respond';
      case 'rescheduled':
        return 'Session needs to be rescheduled';
      default:
        return '';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Submit Trial Outcome
        </CardTitle>
        <CardDescription>
          Mark the trial session outcome for {student.name}. This will return control to the Sales team for follow-up.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">Trial Outcome</Label>
          <RadioGroup
            value={outcome}
            onValueChange={(value) => setOutcome(value as 'completed' | 'ghosted' | 'rescheduled')}
            className="mt-3"
          >
            {(['completed', 'ghosted', 'rescheduled'] as const).map((option) => (
              <div key={option} className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value={option} id={option} />
                <div className="flex items-center gap-2 flex-1">
                  {getOutcomeIcon(option)}
                  <div>
                    <Label htmlFor={option} className="font-medium capitalize cursor-pointer">
                      {option}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {getOutcomeDescription(option)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="teacherNotes">Session Notes</Label>
          <Textarea
            id="teacherNotes"
            placeholder="Describe how the session went, what was covered, any observations..."
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="studentBehavior">Student Behavior & Engagement</Label>
          <Textarea
            id="studentBehavior"
            placeholder="How engaged was the student? Any behavioral notes or learning style observations..."
            value={studentBehavior}
            onChange={(e) => setStudentBehavior(e.target.value)}
            rows={3}
          />
        </div>

        {outcome === 'completed' && (
          <div className="space-y-2">
            <Label htmlFor="recommendedPackage">Recommended Package</Label>
            <Select value={recommendedPackage} onValueChange={setRecommendedPackage}>
              <SelectTrigger>
                <SelectValue placeholder="Select recommended package for this student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic-4">Basic Package (4 sessions)</SelectItem>
                <SelectItem value="standard-8">Standard Package (8 sessions)</SelectItem>
                <SelectItem value="premium-12">Premium Package (12 sessions)</SelectItem>
                <SelectItem value="intensive-16">Intensive Package (16 sessions)</SelectItem>
                <SelectItem value="custom">Custom Package</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Outcome'}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialOutcomeForm;
