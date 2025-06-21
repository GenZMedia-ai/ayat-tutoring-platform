
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle } from 'lucide-react';
import { useTrialOutcomes } from '@/hooks/useTrialOutcomes';
import { Student } from '@/types';

interface TrialOutcomeFormProps {
  student: Student;
  sessionId: string;
  initialOutcome: 'completed' | 'ghosted';
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TrialOutcomeForm: React.FC<TrialOutcomeFormProps> = ({
  student,
  sessionId,
  initialOutcome,
  onSuccess,
  onCancel
}) => {
  const [teacherNotes, setTeacherNotes] = useState('');
  const [studentBehavior, setStudentBehavior] = useState('');
  const [recommendedPackage, setRecommendedPackage] = useState('');
  
  const { submitTrialOutcome, isSubmitting } = useTrialOutcomes();

  const handleSubmit = async () => {
    try {
      await submitTrialOutcome(
        student.id,
        sessionId,
        initialOutcome,
        teacherNotes || undefined,
        // Only include student behavior for completed trials
        initialOutcome === 'completed' ? (studentBehavior || undefined) : undefined,
        // Only include recommended package for completed trials
        initialOutcome === 'completed' ? (recommendedPackage || undefined) : undefined
      );
      
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit trial outcome:', error);
    }
  };

  const getFormTitle = () => {
    return initialOutcome === 'completed' 
      ? 'Submit Completed Trial Outcome' 
      : 'Submit Ghosted Trial Report';
  };

  const getFormDescription = () => {
    return initialOutcome === 'completed'
      ? `Mark the trial session as completed for ${student.name}. This will return control to the Sales team for follow-up.`
      : `Mark the trial session as ghosted for ${student.name}. The student did not attend or respond.`;
  };

  const getOutcomeIcon = () => {
    return initialOutcome === 'completed' 
      ? <CheckCircle className="w-6 h-6 text-green-600" />
      : <XCircle className="w-6 h-6 text-red-600" />;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getOutcomeIcon()}
          {getFormTitle()}
        </CardTitle>
        <CardDescription>
          {getFormDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="teacherNotes">Session Notes</Label>
          <Textarea
            id="teacherNotes"
            placeholder={
              initialOutcome === 'completed' 
                ? "Describe how the session went, what was covered, any observations..."
                : "Note any attempts to contact the student, reasons for no-show, etc..."
            }
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Only show student behavior field for completed trials */}
        {initialOutcome === 'completed' && (
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
        )}

        {/* Only show recommended package for completed trials */}
        {initialOutcome === 'completed' && (
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
            {isSubmitting ? 'Submitting...' : `Submit ${initialOutcome === 'completed' ? 'Completed' : 'Ghosted'} Trial`}
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
