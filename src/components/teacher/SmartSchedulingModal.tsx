
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompleteRegistration, SessionData } from '@/hooks/useCompleteRegistration';
import { Calendar, Clock, User, Package, Repeat, CalendarDays } from 'lucide-react';
import { format, addWeeks, addDays } from 'date-fns';

interface SmartSchedulingModalProps {
  student: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type SchedulingPattern = 'weekly' | 'custom' | 'manual';

interface WeeklyPattern {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  time: string;
  startDate: string;
}

interface CustomDayPattern {
  days: number[]; // Array of day numbers (0-6)
  time: string;
  startDate: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' }
];

const QUICK_PATTERNS = [
  { name: 'Mon/Wed/Fri', days: [1, 3, 5] },
  { name: 'Tue/Thu/Sat', days: [2, 4, 6] },
  { name: 'Mon/Thu', days: [1, 4] },
  { name: 'Wed/Sat', days: [3, 6] },
  { name: 'Weekends', days: [5, 6] }
];

export const SmartSchedulingModal: React.FC<SmartSchedulingModalProps> = ({
  student,
  open,
  onClose,
  onSuccess
}) => {
  const { completeRegistration, loading } = useCompleteRegistration();
  const [schedulingPattern, setSchedulingPattern] = useState<SchedulingPattern>('weekly');
  const [sessions, setSessions] = useState<SessionData[]>([]);
  
  // Weekly pattern state
  const [weeklyPattern, setWeeklyPattern] = useState<WeeklyPattern>({
    dayOfWeek: 1, // Monday
    time: '16:00',
    startDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Custom pattern state
  const [customPattern, setCustomPattern] = useState<CustomDayPattern>({
    days: [1, 3], // Mon, Wed
    time: '16:00',
    startDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Initialize sessions when student changes
  useEffect(() => {
    if (student) {
      const sessionCount = student.packageSessionCount || 8;
      const initialSessions: SessionData[] = Array.from(
        { length: sessionCount },
        (_, index) => ({
          sessionNumber: index + 1,
          date: '',
          time: ''
        })
      );
      setSessions(initialSessions);
    }
  }, [student]);

  const generateWeeklySchedule = () => {
    const sessionCount = student.packageSessionCount || 8;
    const startDate = new Date(weeklyPattern.startDate);
    const generatedSessions: SessionData[] = [];

    for (let i = 0; i < sessionCount; i++) {
      const sessionDate = addWeeks(startDate, i);
      generatedSessions.push({
        sessionNumber: i + 1,
        date: format(sessionDate, 'yyyy-MM-dd'),
        time: weeklyPattern.time
      });
    }

    setSessions(generatedSessions);
  };

  const generateCustomSchedule = () => {
    const sessionCount = student.packageSessionCount || 8;
    const startDate = new Date(customPattern.startDate);
    const generatedSessions: SessionData[] = [];
    
    let currentDate = new Date(startDate);
    let sessionIndex = 0;

    while (sessionIndex < sessionCount) {
      const dayOfWeek = currentDate.getDay();
      
      if (customPattern.days.includes(dayOfWeek)) {
        generatedSessions.push({
          sessionNumber: sessionIndex + 1,
          date: format(currentDate, 'yyyy-MM-dd'),
          time: customPattern.time
        });
        sessionIndex++;
      }
      
      currentDate = addDays(currentDate, 1);
    }

    setSessions(generatedSessions);
  };

  const applyQuickPattern = (days: number[]) => {
    setCustomPattern(prev => ({ ...prev, days }));
  };

  const updateSession = (index: number, field: keyof SessionData, value: string) => {
    setSessions(prev => prev.map((session, i) => 
      i === index ? { ...session, [field]: value } : session
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const invalidSessions = sessions.filter(s => !s.date || !s.time);
    if (invalidSessions.length > 0) {
      alert('Please fill in all session dates and times');
      return;
    }

    const success = await completeRegistration(student.id, sessions);
    if (success) {
      onSuccess();
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Sessions - {student.name}
          </DialogTitle>
          <DialogDescription>
            Create a schedule for all {student.packageSessionCount} sessions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Summary - No Money Info */}
          <Card className="bg-slate-50 dark:bg-slate-900/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">PAID STUDENT</Badge>
                <span className="font-medium">{student.name}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">Age {student.age}</span>
                {student.isFamilyMember && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="outline">Family Member</Badge>
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  <span className="font-semibold text-primary">
                    {student.packageSessionCount} sessions
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Platform: {student.platform}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Country: {student.country}</span>
                </div>
              </div>
              
              {student.parentName && (
                <div className="text-sm text-muted-foreground mt-2">
                  Parent: {student.parentName}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Smart Scheduling Options */}
          <Tabs value={schedulingPattern} onValueChange={(value) => setSchedulingPattern(value as SchedulingPattern)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Weekly Pattern
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Custom Days
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Recurring Pattern</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={weeklyPattern.startDate}
                        onChange={(e) => setWeeklyPattern(prev => ({ ...prev, startDate: e.target.value }))}
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="day-of-week">Day of Week</Label>
                      <select
                        id="day-of-week"
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                        value={weeklyPattern.dayOfWeek}
                        onChange={(e) => setWeeklyPattern(prev => ({ ...prev, dayOfWeek: Number(e.target.value) }))}
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="weekly-time">Time</Label>
                      <Input
                        id="weekly-time"
                        type="time"
                        value={weeklyPattern.time}
                        onChange={(e) => setWeeklyPattern(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button onClick={generateWeeklySchedule} className="w-full">
                    Generate Weekly Schedule
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Custom Days Pattern</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Pattern Buttons */}
                  <div>
                    <Label className="text-sm font-medium">Quick Patterns</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {QUICK_PATTERNS.map((pattern) => (
                        <Button
                          key={pattern.name}
                          variant="outline"
                          size="sm"
                          onClick={() => applyQuickPattern(pattern.days)}
                          className={`${
                            JSON.stringify(customPattern.days) === JSON.stringify(pattern.days)
                              ? 'bg-primary text-white'
                              : ''
                          }`}
                        >
                          {pattern.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="custom-start-date">Start Date</Label>
                      <Input
                        id="custom-start-date"
                        type="date"
                        value={customPattern.startDate}
                        onChange={(e) => setCustomPattern(prev => ({ ...prev, startDate: e.target.value }))}
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                    <div>
                      <Label>Selected Days</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {DAYS_OF_WEEK.map((day) => (
                          <Button
                            key={day.value}
                            variant={customPattern.days.includes(day.value) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setCustomPattern(prev => ({
                                ...prev,
                                days: prev.days.includes(day.value)
                                  ? prev.days.filter(d => d !== day.value)
                                  : [...prev.days, day.value].sort()
                              }));
                            }}
                          >
                            {day.label.slice(0, 3)}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="custom-time">Time</Label>
                      <Input
                        id="custom-time"
                        type="time"
                        value={customPattern.time}
                        onChange={(e) => setCustomPattern(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button onClick={generateCustomSchedule} className="w-full">
                    Generate Custom Schedule
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Manual Session Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set individual dates and times for each session
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Generated Sessions Preview */}
          {sessions.some(s => s.date && s.time) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Schedule Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 max-h-60 overflow-y-auto">
                  {sessions.map((session, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Session {session.sessionNumber}</span>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="date"
                          value={session.date}
                          onChange={(e) => updateSession(index, 'date', e.target.value)}
                          min={format(new Date(), 'yyyy-MM-dd')}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="time"
                          value={session.time}
                          onChange={(e) => updateSession(index, 'time', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || sessions.some(s => !s.date || !s.time)}
            >
              {loading ? 'Completing Registration...' : 'Complete Registration'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
