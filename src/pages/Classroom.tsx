import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus } from 'lucide-react';
import AnnouncementsList from '@/components/AnnouncementsList';
import QuizzesList from '@/components/QuizzesList';
import LeaderboardView from '@/components/LeaderboardView';
import CreateAnnouncementDialog from '@/components/CreateAnnouncementDialog';
import CreateQuizDialog from '@/components/CreateQuizDialog';

const Classroom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [classroom, setClassroom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchClassroom();
  }, [id]);

  const fetchClassroom = async () => {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*, profiles(*)')
      .eq('id', id)
      .single();

    if (!error && data) {
      setClassroom(data);
    }
    setLoading(false);
  };

  const isFaculty = profile?.role === 'faculty' && classroom?.faculty_id === profile?.id;

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="shadow-elegant">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Classroom Not Found</h2>
            <p className="text-muted-foreground mb-6">This classroom does not exist or you don't have access to it.</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {classroom.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Instructor: {classroom.profiles?.full_name}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="announcements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="mt-6">
            {isFaculty && (
              <div className="mb-6">
                <Button
                  onClick={() => setShowAnnouncementDialog(true)}
                  className="gap-2 bg-gradient-primary hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  Create Announcement
                </Button>
              </div>
            )}
            <AnnouncementsList classroomId={id!} refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="quizzes" className="mt-6">
            {isFaculty && (
              <div className="mb-6">
                <Button
                  onClick={() => setShowQuizDialog(true)}
                  className="gap-2 bg-gradient-primary hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  Create Quiz
                </Button>
              </div>
            )}
            <QuizzesList classroomId={id!} isFaculty={isFaculty} refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <LeaderboardView classroomId={id!} />
          </TabsContent>
        </Tabs>
      </main>

      {isFaculty && (
        <>
          <CreateAnnouncementDialog
            open={showAnnouncementDialog}
            onOpenChange={setShowAnnouncementDialog}
            classroomId={id!}
            onSuccess={handleRefresh}
          />
          <CreateQuizDialog
            open={showQuizDialog}
            onOpenChange={setShowQuizDialog}
            classroomId={id!}
            onSuccess={handleRefresh}
          />
        </>
      )}
    </div>
  );
};

export default Classroom;
