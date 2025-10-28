import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const CreateQuizDialog = ({ open, onOpenChange, classroomId, onSuccess }: any) => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { profile } = useAuth();

  const handleCreate = async () => {
    if (!title || !file) {
      toast.error('Please fill in all fields');
      return;
    }

    const text = await file.text();
    const questions = JSON.parse(text);

    const { error } = await supabase.from('quizzes').insert({
      classroom_id: classroomId,
      faculty_id: profile?.id,
      title,
      questions,
      total_questions: 10,
      duration_minutes: 10,
    });

    if (error) {
      toast.error('Failed to create quiz');
      return;
    }

    toast.success('Quiz created!');
    setTitle('');
    setFile(null);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Quiz</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div><Label>Questions JSON File</Label>
            <Input type="file" accept=".json" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <Button onClick={handleCreate} className="w-full bg-gradient-primary">Create Quiz</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuizDialog;
