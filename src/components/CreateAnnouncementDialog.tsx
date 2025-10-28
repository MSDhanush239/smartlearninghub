import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomId: string;
  onSuccess: () => void;
}

const CreateAnnouncementDialog = ({ open, onOpenChange, classroomId, onSuccess }: CreateAnnouncementDialogProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('announcements').insert({
      classroom_id: classroomId,
      faculty_id: profile?.id,
      title,
      content,
    });

    setLoading(false);

    if (error) {
      toast.error('Failed to create announcement');
      return;
    }

    toast.success('Announcement posted successfully!');
    setTitle('');
    setContent('');
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
          <DialogDescription>
            Share important updates with your students
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Announcement title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your announcement here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
            />
          </div>
          <Button 
            onClick={handleCreate} 
            disabled={loading}
            className="w-full bg-gradient-primary hover:opacity-90"
          >
            {loading ? 'Posting...' : 'Post Announcement'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAnnouncementDialog;
