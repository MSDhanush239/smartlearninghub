import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeaderboardEntry {
  student_id: string;
  student_name: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

const LeaderboardView = ({ classroomId }: { classroomId: string }) => {
  const [quizLeaderboard, setQuizLeaderboard] = useState<Record<string, LeaderboardEntry[]>>({});
  const [overallLeaderboard, setOverallLeaderboard] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);

  useEffect(() => {
    fetchLeaderboards();
  }, [classroomId]);

  const fetchLeaderboards = async () => {
    // Fetch quizzes
    const { data: quizzesData } = await supabase
      .from('quizzes')
      .select('*')
      .eq('classroom_id', classroomId)
      .order('created_at', { ascending: false });

    if (quizzesData) {
      setQuizzes(quizzesData);

      // Fetch attempts for each quiz
      const leaderboards: Record<string, LeaderboardEntry[]> = {};
      for (const quiz of quizzesData) {
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('*, profiles(full_name)')
          .eq('quiz_id', quiz.id)
          .order('score', { ascending: false });

        if (attempts) {
          leaderboards[quiz.id] = attempts.map((a: any) => ({
            student_id: a.student_id,
            student_name: a.profiles?.full_name || 'Unknown',
            score: a.score,
            total_questions: a.total_questions,
            completed_at: a.completed_at,
          }));
        }
      }
      setQuizLeaderboard(leaderboards);

      // Calculate overall leaderboard
      const studentScores: Record<string, { name: string; totalScore: number; attempts: number }> = {};
      Object.values(leaderboards).forEach((entries) => {
        entries.forEach((entry) => {
          if (!studentScores[entry.student_id]) {
            studentScores[entry.student_id] = {
              name: entry.student_name,
              totalScore: 0,
              attempts: 0,
            };
          }
          studentScores[entry.student_id].totalScore += entry.score;
          studentScores[entry.student_id].attempts += 1;
        });
      });

      const overall = Object.entries(studentScores)
        .map(([id, data]) => ({
          student_id: id,
          student_name: data.name,
          totalScore: data.totalScore,
          attempts: data.attempts,
          average: data.totalScore / data.attempts,
        }))
        .sort((a, b) => b.totalScore - a.totalScore);

      setOverallLeaderboard(overall);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 text-center font-semibold">{rank + 1}</span>;
  };

  if (quizzes.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-12 text-center">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Quizzes Yet</h3>
          <p className="text-muted-foreground">Leaderboard will appear after quizzes are completed</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="overall" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overall">Overall</TabsTrigger>
        <TabsTrigger value="quizzes">By Quiz</TabsTrigger>
      </TabsList>

      <TabsContent value="overall">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Overall Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overallLeaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No attempts yet</p>
            ) : (
              <div className="space-y-3">
                {overallLeaderboard.map((entry, idx) => (
                  <div
                    key={entry.student_id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-4">
                      {getRankIcon(idx)}
                      <div>
                        <p className="font-semibold">{entry.student_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.attempts} quiz{entry.attempts > 1 ? 'zes' : ''} attempted
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{entry.totalScore}</p>
                      <p className="text-sm text-muted-foreground">
                        Avg: {entry.average.toFixed(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="quizzes">
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="shadow-card">
              <CardHeader>
                <CardTitle>{quiz.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {quizLeaderboard[quiz.id]?.length === 0 || !quizLeaderboard[quiz.id] ? (
                  <p className="text-center text-muted-foreground py-4">No attempts yet</p>
                ) : (
                  <div className="space-y-2">
                    {quizLeaderboard[quiz.id].map((entry, idx) => (
                      <div
                        key={entry.student_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
                        <div className="flex items-center gap-3">
                          {getRankIcon(idx)}
                          <p className="font-medium">{entry.student_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {entry.score}/{entry.total_questions}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {((entry.score / entry.total_questions) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default LeaderboardView;
