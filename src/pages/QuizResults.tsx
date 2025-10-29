import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, TrendingUp, Clock, Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AttemptData {
  id: string;
  student_id: string;
  student_name: string;
  score: number;
  total_questions: number;
  accuracy: number;
  time_taken_seconds: number;
  completed_at: string;
}

const QuizResults = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    averageAccuracy: 0,
    averageTime: 0,
    passRate: 0,
  });

  useEffect(() => {
    fetchQuizData();
  }, [quizId]);

  const fetchQuizData = async () => {
    if (!quizId) return;

    // Fetch quiz details
    const { data: quizData } = await supabase
      .from('quizzes')
      .select('*, classrooms(name)')
      .eq('id', quizId)
      .single();

    if (quizData) {
      setQuiz(quizData);

      // Fetch all attempts
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select('*, profiles(full_name)')
        .eq('quiz_id', quizId)
        .order('score', { ascending: false });

      if (attemptsData) {
        const formattedAttempts: AttemptData[] = attemptsData.map((a: any) => ({
          id: a.id,
          student_id: a.student_id,
          student_name: a.profiles?.full_name || 'Unknown',
          score: a.score,
          total_questions: a.total_questions,
          accuracy: (a.score / a.total_questions) * 100,
          time_taken_seconds: a.time_taken_seconds || 0,
          completed_at: a.completed_at,
        }));

        setAttempts(formattedAttempts);

        // Calculate statistics
        if (formattedAttempts.length > 0) {
          const totalScore = formattedAttempts.reduce((sum, a) => sum + a.score, 0);
          const totalQuestions = formattedAttempts.reduce((sum, a) => sum + a.total_questions, 0);
          const totalTime = formattedAttempts.reduce((sum, a) => sum + a.time_taken_seconds, 0);
          const passCount = formattedAttempts.filter(a => a.accuracy >= 60).length;

          setStats({
            totalAttempts: formattedAttempts.length,
            averageScore: totalScore / formattedAttempts.length,
            averageAccuracy: (totalScore / totalQuestions) * 100,
            averageTime: totalTime / formattedAttempts.length,
            passRate: (passCount / formattedAttempts.length) * 100,
          });
        }
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 1) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 text-center font-semibold text-sm">{rank + 1}</span>;
  };

  if (!quiz || profile?.role !== 'faculty') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Classroom
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{quiz.title}</h1>
          <p className="text-muted-foreground">
            {quiz.classrooms?.name} • {quiz.duration_minutes} minutes • {quiz.total_questions} questions
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttempts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
              <Trophy className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageAccuracy.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(Math.round(stats.averageTime))}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.passRate.toFixed(0)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Results Tabs */}
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="details">Detailed Results</TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                {attempts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No attempts yet</p>
                ) : (
                  <div className="space-y-3">
                    {attempts.map((attempt, idx) => (
                      <div
                        key={attempt.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                      >
                        <div className="flex items-center gap-4">
                          {getRankIcon(idx)}
                          <div>
                            <p className="font-semibold">{attempt.student_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(attempt.completed_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            {attempt.score}/{attempt.total_questions}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {attempt.accuracy.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                {attempts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No attempts yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Student</th>
                          <th className="text-center py-3 px-4 font-semibold">Score</th>
                          <th className="text-center py-3 px-4 font-semibold">Accuracy</th>
                          <th className="text-center py-3 px-4 font-semibold">Time Taken</th>
                          <th className="text-left py-3 px-4 font-semibold">Completed At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attempts.map((attempt) => (
                          <tr key={attempt.id} className="border-b hover:bg-secondary/30">
                            <td className="py-3 px-4">{attempt.student_name}</td>
                            <td className="text-center py-3 px-4 font-semibold">
                              {attempt.score}/{attempt.total_questions}
                            </td>
                            <td className="text-center py-3 px-4">
                              <span
                                className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                                  attempt.accuracy >= 80
                                    ? 'bg-green-500/20 text-green-700'
                                    : attempt.accuracy >= 60
                                    ? 'bg-yellow-500/20 text-yellow-700'
                                    : 'bg-red-500/20 text-red-700'
                                }`}
                              >
                                {attempt.accuracy.toFixed(1)}%
                              </span>
                            </td>
                            <td className="text-center py-3 px-4">
                              {formatTime(attempt.time_taken_seconds)}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {new Date(attempt.completed_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QuizResults;
