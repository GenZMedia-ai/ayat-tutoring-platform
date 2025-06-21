import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { useTeacherAvailability } from '@/hooks/useTeacherAvailability';
import { useServerDate } from '@/hooks/useServerDate';
import { useTeacherTrialSessions } from '@/hooks/useTeacherTrialSessions';
import { Trash2, Lock, Eye } from 'lucide-react';
import EnhancedTeacherDashboard from './EnhancedTeacherDashboard';

const TeacherDashboard: React.FC = () => {
  return <EnhancedTeacherDashboard />;
};

export default TeacherDashboard;
