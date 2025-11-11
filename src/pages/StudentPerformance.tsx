import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Target, BarChart3, Award, Clock, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface AttemptData {
  quiz_id: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  completed_at: string;
  accuracy: number;
  time_taken_seconds?: number;
}

interface ComparisonData {
  classAverage: number;
  topScore: number;
  myRank: number;
  totalStudents: number;
}

const StudentPerformance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    averageAccuracy: 0,
    bestScore: 0,
    totalTimeSpent: 0,
    improvementRate: 0,
  });

  useEffect(() => {
    fetchPerformance();
  }, [user]);

  const fetchPerformance = async () => {
    if (!user) return;

    // Fetch student attempts
    const { data } = await supabase
      .from('quiz_attempts')
      .select('*, quizzes(title, classroom_id)')
      .eq('student_id', user.id)
      .order('completed_at', { ascending: false });

    if (data && data.length > 0) {
      const attemptsData: AttemptData[] = data.map((a: any) => ({
        quiz_id: a.quiz_id,
        quiz_title: a.quizzes?.title || 'Unknown Quiz',
        score: a.score,
        total_questions: a.total_questions,
        completed_at: a.completed_at,
        accuracy: (a.score / a.total_questions) * 100,
        time_taken_seconds: a.time_taken_seconds || 0,
      }));

      setAttempts(attemptsData);

      // Calculate statistics
      const totalScore = attemptsData.reduce((sum, a) => sum + a.score, 0);
      const totalQuestions = attemptsData.reduce((sum, a) => sum + a.total_questions, 0);
      const avgScore = totalScore / attemptsData.length;
      const avgAccuracy = (totalScore / totalQuestions) * 100;
      const bestScore = Math.max(...attemptsData.map((a) => (a.score / a.total_questions) * 100));
      const totalTime = attemptsData.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0);

      // Calculate improvement rate (last 5 vs first 5 quizzes)
      let improvementRate = 0;
      if (attemptsData.length >= 5) {
        const recent5 = attemptsData.slice(0, 5);
        const first5 = attemptsData.slice(-5);
        const recentAvg = recent5.reduce((sum, a) => sum + a.accuracy, 0) / 5;
        const firstAvg = first5.reduce((sum, a) => sum + a.accuracy, 0) / 5;
        improvementRate = ((recentAvg - firstAvg) / firstAvg) * 100;
      }

      setStats({
        totalQuizzes: attemptsData.length,
        averageScore: avgScore,
        averageAccuracy: avgAccuracy,
        bestScore: bestScore,
        totalTimeSpent: totalTime,
        improvementRate: improvementRate,
      });

      // Fetch comparison data (all students in same classrooms)
      const classroomIds = [...new Set(data.map((a: any) => a.quizzes?.classroom_id).filter(Boolean))];
      
      if (classroomIds.length > 0) {
        const { data: allAttempts } = await supabase
          .from('quiz_attempts')
          .select('student_id, score, total_questions, quizzes!inner(classroom_id)')
          .in('quizzes.classroom_id', classroomIds);

        if (allAttempts && allAttempts.length > 0) {
          const studentScores = new Map<string, number[]>();
          allAttempts.forEach((a: any) => {
            const accuracy = (a.score / a.total_questions) * 100;
            if (!studentScores.has(a.student_id)) {
              studentScores.set(a.student_id, []);
            }
            studentScores.get(a.student_id)!.push(accuracy);
          });

          const studentAverages = Array.from(studentScores.entries()).map(([id, scores]) => ({
            student_id: id,
            average: scores.reduce((sum, s) => sum + s, 0) / scores.length,
          })).sort((a, b) => b.average - a.average);

          const myAverage = avgAccuracy;
          const myRank = studentAverages.findIndex(s => s.student_id === user.id) + 1;
          const classAvg = studentAverages.reduce((sum, s) => sum + s.average, 0) / studentAverages.length;
          const topScore = studentAverages[0]?.average || 0;

          setComparison({
            classAverage: classAvg,
            topScore: topScore,
            myRank: myRank,
            totalStudents: studentAverages.length,
          });
        }
      }
    }
  };

  const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))'];

  // Prepare chart data
  const lineChartData = attempts.slice(0, 10).reverse().map((attempt, idx) => ({
    name: `Quiz ${attempts.length - idx}`,
    accuracy: attempt.accuracy,
    score: attempt.score,
  }));

  const timeDistributionData = attempts.slice(0, 5).map((attempt, idx) => ({
    name: attempt.quiz_title.substring(0, 20) + (attempt.quiz_title.length > 20 ? '...' : ''),
    time: Math.round((attempt.time_taken_seconds || 0) / 60),
  }));

  const accuracyDistribution = [
    { name: 'Correct', value: stats.averageAccuracy, color: 'hsl(var(--success))' },
    { name: 'Incorrect', value: 100 - stats.averageAccuracy, color: 'hsl(var(--destructive))' },
  ];

  const skillLevelData = [
    { skill: 'Accuracy', value: stats.averageAccuracy, fullMark: 100 },
    { skill: 'Consistency', value: attempts.length >= 3 ? 100 - (Math.max(...attempts.map(a => a.accuracy)) - Math.min(...attempts.map(a => a.accuracy))) : 50, fullMark: 100 },
    { skill: 'Speed', value: stats.totalTimeSpent > 0 ? Math.min((stats.totalQuizzes * 600) / stats.totalTimeSpent * 100, 100) : 50, fullMark: 100 },
    { skill: 'Improvement', value: Math.max(0, Math.min(stats.improvementRate + 50, 100)), fullMark: 100 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent">My Performance Dashboard</h1>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-secondary" />
                <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                <div className="text-2xl font-bold">{stats.averageAccuracy.toFixed(1)}%</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Best Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-success" />
                <div className="text-2xl font-bold">{stats.bestScore.toFixed(1)}%</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                <div className="text-2xl font-bold">{Math.round(stats.totalTimeSpent / 60)}m</div>
              </div>
            </CardContent>
          </Card>

          {comparison && (
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Class Rank</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <div className="text-2xl font-bold">#{comparison.myRank}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">of {comparison.totalStudents}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {attempts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No quizzes attempted yet. Start taking quizzes to see your performance!</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={lineChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Legend />
                        <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} name="Accuracy %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Skill Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={skillLevelData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="skill" stroke="hsl(var(--muted-foreground))" />
                        <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
                        <Radar name="Your Skills" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {comparison && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                        <p className="text-sm text-muted-foreground mb-2">Your Average</p>
                        <p className="text-3xl font-bold text-secondary">{stats.averageAccuracy.toFixed(1)}%</p>
                      </div>
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm text-muted-foreground mb-2">Class Average</p>
                        <p className="text-3xl font-bold text-primary">{comparison.classAverage.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stats.averageAccuracy > comparison.classAverage ? '↑' : '↓'} {Math.abs(stats.averageAccuracy - comparison.classAverage).toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                        <p className="text-sm text-muted-foreground mb-2">Top Performer</p>
                        <p className="text-3xl font-bold text-accent">{comparison.topScore.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground mt-1">Gap: {(comparison.topScore - stats.averageAccuracy).toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Charts Tab */}
            <TabsContent value="charts" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Quiz Scores (Bar Chart)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={lineChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Legend />
                        <Bar dataKey="score" fill="hsl(var(--primary))" name="Score" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Time Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={timeDistributionData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" width={100} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Bar dataKey="time" fill="hsl(var(--warning))" name="Time (mins)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Accuracy Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={accuracyDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                          outerRadius={100}
                          fill="hsl(var(--primary))"
                          dataKey="value"
                        >
                          {accuracyDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Line Graph</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={lineChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Legend />
                        <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--accent))" strokeWidth={3} name="Accuracy %" />
                        <Line type="monotone" dataKey="score" stroke="hsl(var(--secondary))" strokeWidth={2} name="Raw Score" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Comparison Tab */}
            <TabsContent value="comparison" className="space-y-6">
              {comparison ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Performance Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Your Performance</span>
                            <span className="text-sm font-bold">{stats.averageAccuracy.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3">
                            <div 
                              className="bg-gradient-primary h-3 rounded-full transition-all" 
                              style={{ width: `${stats.averageAccuracy}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Class Average</span>
                            <span className="text-sm font-bold">{comparison.classAverage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3">
                            <div 
                              className="bg-primary h-3 rounded-full transition-all" 
                              style={{ width: `${comparison.classAverage}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Top Performer</span>
                            <span className="text-sm font-bold">{comparison.topScore.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3">
                            <div 
                              className="bg-accent h-3 rounded-full transition-all" 
                              style={{ width: `${comparison.topScore}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Strengths</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {stats.averageAccuracy > comparison.classAverage && (
                            <li className="flex items-start gap-2">
                              <TrendingUp className="w-5 h-5 text-success mt-0.5" />
                              <span className="text-sm">Above class average by {(stats.averageAccuracy - comparison.classAverage).toFixed(1)}%</span>
                            </li>
                          )}
                          {stats.improvementRate > 0 && (
                            <li className="flex items-start gap-2">
                              <TrendingUp className="w-5 h-5 text-success mt-0.5" />
                              <span className="text-sm">Showing improvement trend of {stats.improvementRate.toFixed(1)}%</span>
                            </li>
                          )}
                          {stats.bestScore > 90 && (
                            <li className="flex items-start gap-2">
                              <Trophy className="w-5 h-5 text-success mt-0.5" />
                              <span className="text-sm">Excellent best score of {stats.bestScore.toFixed(1)}%</span>
                            </li>
                          )}
                          {stats.totalQuizzes >= 10 && (
                            <li className="flex items-start gap-2">
                              <Award className="w-5 h-5 text-success mt-0.5" />
                              <span className="text-sm">Consistent practice with {stats.totalQuizzes} quizzes completed</span>
                            </li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Areas to Improve</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {stats.averageAccuracy < comparison.classAverage && (
                            <li className="flex items-start gap-2">
                              <Target className="w-5 h-5 text-warning mt-0.5" />
                              <span className="text-sm">Focus on reaching class average (gap: {(comparison.classAverage - stats.averageAccuracy).toFixed(1)}%)</span>
                            </li>
                          )}
                          {stats.bestScore < comparison.topScore && (
                            <li className="flex items-start gap-2">
                              <Trophy className="w-5 h-5 text-warning mt-0.5" />
                              <span className="text-sm">Aim for top performance (gap: {(comparison.topScore - stats.bestScore).toFixed(1)}%)</span>
                            </li>
                          )}
                          {stats.improvementRate < 0 && (
                            <li className="flex items-start gap-2">
                              <TrendingUp className="w-5 h-5 text-warning mt-0.5" />
                              <span className="text-sm">Recent performance declining - review and practice</span>
                            </li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Not enough data to show comparisons yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Attempt History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {attempts.map((attempt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 rounded-lg bg-card border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-semibold">{attempt.quiz_title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(attempt.completed_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            {attempt.score}/{attempt.total_questions}
                          </p>
                          <p className={`text-sm font-medium ${
                            attempt.accuracy >= 80 ? 'text-success' : 
                            attempt.accuracy >= 60 ? 'text-warning' : 
                            'text-destructive'
                          }`}>
                            {attempt.accuracy.toFixed(1)}%
                          </p>
                          {attempt.time_taken_seconds && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {Math.round(attempt.time_taken_seconds / 60)}m {attempt.time_taken_seconds % 60}s
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default StudentPerformance;
