import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateClassroomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateClassroomDialog = ({ open, onOpenChange, onSuccess }: CreateClassroomDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  const generateJoinCode = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_join_code');
    if (error || !data) {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    return data;
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a classroom name');
      return;
    }

    setLoading(true);
    const joinCode = await generateJoinCode();

    const { error } = await supabase.from('classrooms').insert({
      name,
      description,
      join_code: joinCode,
      faculty_id: profile?.id,
    });

    setLoading(false);

    if (error) {
      toast.error('Failed to create classroom');
      return;
    }

    toast.success('Classroom created successfully!');
    setName('');
    setDescription('');
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Classroom</DialogTitle>
          <DialogDescription>
            Set up a new classroom for your students
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Classroom Name</Label>
            <Input
              id="name"
              placeholder="e.g., Computer Science 101"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the classroom"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <Button 
            onClick={handleCreate} 
            disabled={loading}
            className="w-full bg-gradient-primary hover:opacity-90"
          >
            {loading ? 'Creating...' : 'Create Classroom'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClassroomDialog;
