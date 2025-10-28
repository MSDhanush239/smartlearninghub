import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AttemptData {
  quiz_id: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  completed_at: string;
  accuracy: number;
}

const StudentPerformance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    averageAccuracy: 0,
    bestScore: 0,
  });

  useEffect(() => {
    fetchPerformance();
  }, [user]);

  const fetchPerformance = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('quiz_attempts')
      .select('*, quizzes(title)')
      .eq('student_id', user.id)
      .order('completed_at', { ascending: false });

    if (data) {
      const attemptsData: AttemptData[] = data.map((a: any) => ({
        quiz_id: a.quiz_id,
        quiz_title: a.quizzes?.title || 'Unknown Quiz',
        score: a.score,
        total_questions: a.total_questions,
        completed_at: a.completed_at,
        accuracy: (a.score / a.total_questions) * 100,
      }));

      setAttempts(attemptsData);

      // Calculate statistics
      if (attemptsData.length > 0) {
        const totalScore = attemptsData.reduce((sum, a) => sum + a.score, 0);
        const totalQuestions = attemptsData.reduce((sum, a) => sum + a.total_questions, 0);
        const avgScore = totalScore / attemptsData.length;
        const avgAccuracy = (totalScore / totalQuestions) * 100;
        const bestScore = Math.max(...attemptsData.map((a) => (a.score / a.total_questions) * 100));

        setStats({
          totalQuizzes: attemptsData.length,
          averageScore: avgScore,
          averageAccuracy: avgAccuracy,
          bestScore: bestScore,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-8">My Performance</h1>

        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageAccuracy.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Best Score</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bestScore.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quiz History</CardTitle>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No quizzes attempted yet</p>
            ) : (
              <div className="space-y-4">
                {attempts.map((attempt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-semibold">{attempt.quiz_title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attempt.completed_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {attempt.score}/{attempt.total_questions}
                      </p>
                      <p className="text-sm text-muted-foreground">{attempt.accuracy.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}

                <div className="mt-6">
                  <h3 className="font-semibold mb-4">Performance Trend</h3>
                  <div className="flex items-end gap-2 h-40">
                    {attempts.slice(0, 10).reverse().map((attempt, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-gradient-primary rounded-t"
                          style={{ height: `${attempt.accuracy}%` }}
                        />
                        <p className="text-xs mt-2 text-muted-foreground">
                          Q{attempts.length - idx}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentPerformance;
