
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle } from 'lucide-react';
import { useTrialOutcomes } from '@/hooks/useTrialOutcomes';
import { TrialStudent } from '@/hooks/useTeacherTrialSessions';

interface TrialOutcomeFormProps {
  student: TrialStudent;
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
        studentBehavior || undefined,
        recommendedPackage || undefined
      );
      
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit trial outcome:', error);
    }
  };

  const getOutcomeIcon = () => {
    return initialOutcome === 'completed' 
      ? <CheckCircle className="w-5 h-5 text-green-600" />
      : <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getOutcomeTitle = () => {
    return initialOutcome === 'completed' 
      ? 'Mark Trial as Completed'
      : 'Mark Trial as Ghosted';
  };

  const getOutcomeDescription = () => {
    return initialOutcome === 'completed'
      ? 'The student attended and completed the trial session. Please provide details about the session.'
      : 'The student did not show up for the trial session. This will return control to the Sales team.';
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getOutcomeIcon()}
          {getOutcomeTitle()}
        </CardTitle>
        <CardDescription>
          {getOutcomeDescription()} Control will be returned to the Sales team for follow-up with {student.name}.
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
                : "Please note any attempts made to contact the student or other relevant information..."
            }
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            rows={3}
          />
        </div>

        {initialOutcome === 'completed' && (
          <>
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
          </>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : `Mark as ${initialOutcome === 'completed' ? 'Completed' : 'Ghosted'}`}
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
