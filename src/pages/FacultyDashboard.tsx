import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Plus, Users, BookOpen, Trophy } from 'lucide-react';
import CreateClassroomDialog from '@/components/CreateClassroomDialog';
import ClassroomCard from '@/components/ClassroomCard';

interface Classroom {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
  created_at: string;
}

const FacultyDashboard = () => {
  const { profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'faculty')) {
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
      .from('classrooms')
      .select('*')
      .eq('faculty_id', profile?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClassrooms(data);
      
      // Fetch total students across all classrooms
      if (data.length > 0) {
        const classroomIds = data.map(c => c.id);
        const { count } = await supabase
          .from('classroom_members')
          .select('*', { count: 'exact', head: true })
          .in('classroom_id', classroomIds);
        setTotalStudents(count || 0);

        // Fetch total quizzes
        const { count: quizCount } = await supabase
          .from('quizzes')
          .select('*', { count: 'exact', head: true })
          .eq('faculty_id', profile?.id);
        setTotalQuizzes(quizCount || 0);
      }
    }
    setLoadingData(false);
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
                Faculty Dashboard
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
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Classrooms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <p className="text-3xl font-bold">{classrooms.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-secondary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <p className="text-3xl font-bold">{totalStudents}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
                <p className="text-3xl font-bold">{totalQuizzes}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Classrooms Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Classrooms</h2>
          <Button 
            onClick={() => setShowCreateDialog(true)} 
            className="gap-2 bg-gradient-primary hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Create Classroom
          </Button>
        </div>

        {classrooms.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Classrooms Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first classroom to get started with online learning
              </p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="gap-2 bg-gradient-primary hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Create Your First Classroom
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <ClassroomCard 
                key={classroom.id} 
                classroom={classroom}
                onUpdate={fetchClassrooms}
              />
            ))}
          </div>
        )}
      </main>

      <CreateClassroomDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchClassrooms}
      />
    </div>
  );
};

export default FacultyDashboard;
