import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Copy, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClassroomCardProps {
  classroom: {
    id: string;
    name: string;
    description: string | null;
    join_code: string;
    created_at: string;
  };
  isStudent?: boolean;
  onUpdate: () => void;
}

const ClassroomCard = ({ classroom, isStudent = false, onUpdate }: ClassroomCardProps) => {
  const navigate = useNavigate();

  const copyJoinCode = () => {
    navigator.clipboard.writeText(classroom.join_code);
    toast.success('Join code copied to clipboard!');
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this classroom?')) return;

    const { error } = await supabase
      .from('classrooms')
      .delete()
      .eq('id', classroom.id);

    if (error) {
      toast.error('Failed to delete classroom');
      return;
    }

    toast.success('Classroom deleted successfully');
    onUpdate();
  };

  return (
    <Card className="shadow-card hover:shadow-elegant transition-all duration-300 border-l-4 border-l-primary group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl group-hover:text-primary transition-colors">
              {classroom.name}
            </CardTitle>
            <CardDescription className="mt-2">
              {classroom.description || 'No description provided'}
            </CardDescription>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isStudent && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Join Code</p>
              <p className="font-mono font-bold text-lg tracking-wider">{classroom.join_code}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyJoinCode}
              className="hover:bg-background"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-gradient-primary hover:opacity-90"
            onClick={() => navigate(`/classroom/${classroom.id}`)}
          >
            Open Classroom
          </Button>
          {!isStudent && (
            <Button
              size="icon"
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassroomCard;
