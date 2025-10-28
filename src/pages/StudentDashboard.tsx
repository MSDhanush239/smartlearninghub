import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogOut, Plus, BookOpen, Trophy, Clock } from 'lucide-react';
import { toast } from 'sonner';
import ClassroomCard from '@/components/ClassroomCard';

interface Classroom {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
  created_at: string;
}

const StudentDashboard = () => {
  const { profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'student')) {
      navigate('/auth');
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    if (profile) {
      fetchClassrooms();
    }
  }, [profile]);

  const fetchClassrooms = async () => {
    const { data, error } = await supabase
      .from('classroom_members')
      .select('classroom_id, classrooms(*)')
      .eq('student_id', profile?.id);

    if (!error && data) {
      setClassrooms(data.map((item: any) => item.classrooms));
    }
    setLoadingData(false);
  };

  const handleJoinClassroom = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a join code');
      return;
    }

    const { data: classroom } = await supabase
      .from('classrooms')
      .select('id')
      .eq('join_code', joinCode.toUpperCase())
      .single();

    if (!classroom) {
      toast.error('Invalid join code');
      return;
    }

    const { error } = await supabase
      .from('classroom_members')
      .insert({
        classroom_id: classroom.id,
        student_id: profile?.id,
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('You are already enrolled in this classroom');
      } else {
        toast.error('Failed to join classroom');
      }
      return;
    }

    toast.success('Successfully joined classroom!');
    setShowJoinDialog(false);
    setJoinCode('');
    fetchClassrooms();
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Student Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {profile?.full_name}!
              </p>
            </div>
            <Button onClick={signOut} variant="outline" className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enrolled Classes</p>
                  <p className="text-2xl font-bold">{classrooms.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-secondary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Trophy className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quizzes Completed</p>
                  <p className="text-2xl font-bold">--</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-accent">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold">--%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Classrooms Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Classes</h2>
          <Button 
            onClick={() => setShowJoinDialog(true)} 
            className="gap-2 bg-gradient-primary hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Join Class
          </Button>
        </div>

        {classrooms.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Classes Yet</h3>
              <p className="text-muted-foreground mb-6">
                Join your first classroom using a code from your instructor
              </p>
              <Button 
                onClick={() => setShowJoinDialog(true)}
                className="gap-2 bg-gradient-primary hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Join Your First Class
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <ClassroomCard 
                key={classroom.id} 
                classroom={classroom}
                isStudent={true}
                onUpdate={fetchClassrooms}
              />
            ))}
          </div>
        )}
      </main>

      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Classroom</DialogTitle>
            <DialogDescription>
              Enter the join code provided by your instructor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="joinCode">Join Code</Label>
              <Input
                id="joinCode"
                placeholder="Enter 6-character code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="uppercase"
              />
            </div>
            <Button 
              onClick={handleJoinClassroom} 
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              Join Classroom
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;
