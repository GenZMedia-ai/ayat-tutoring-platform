
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TrialSessionFlowStudent } from '@/types/trial';
import { useSalesPermissions } from '@/hooks/useSalesPermissions';

interface StudentEditModalProps {
  student: TrialSessionFlowStudent;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentEditModal: React.FC<StudentEditModalProps> = ({
  student,
  open,
  onClose,
  onSuccess
}) => {
  const permissions = useSalesPermissions(student.status);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: student.name,
    age: student.age,
    phone: student.phone,
    country: student.country,
    platform: student.platform,
    parentName: student.parentName || '',
    notes: student.notes || ''
  });

  const handleSave = async () => {
    if (!permissions.canEdit) {
      toast.error('You do not have permission to edit this student');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: formData.name,
          age: formData.age,
          phone: formData.phone,
          country: formData.country,
          platform: formData.platform,
          parent_name: formData.parentName || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id);

      if (error) {
        console.error('Error updating student:', error);
        toast.error('Failed to update student information');
        return;
      }

      toast.success('Student information updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student information');
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.canEdit) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Edit Student</DialogTitle>
            <DialogDescription>
              {permissions.statusMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Student Information</DialogTitle>
          <DialogDescription>
            Update student details for {student.uniqueId}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Student Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter student name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                placeholder="Enter age"
                min="3"
                max="18"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (WhatsApp)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Enter country"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="google-meet">Google Meet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent Name (Optional)</Label>
              <Input
                id="parentName"
                value={formData.parentName}
                onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                placeholder="Enter parent name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
