import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';

interface StudentPerformance {
  student_id: string;
  student_name: string;
  total_quizzes: number;
  average_score: number;
  average_accuracy: number;
  total_time: number;
  improvement_rate: number;
}

interface ClassPerformanceViewProps {
  classroomId: string;
}

const ClassPerformanceView = ({ classroomId }: ClassPerformanceViewProps) => {
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [classStats, setClassStats] = useState({
    totalStudents: 0,
    averageAccuracy: 0,
    totalAttempts: 0,
    lowPerformers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassPerformance();
  }, [classroomId]);

  const fetchClassPerformance = async () => {
    setLoading(true);

    // Fetch all quiz attempts for this classroom
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*, quizzes!inner(classroom_id), profiles!quiz_attempts_student_id_fkey(full_name)')
      .eq('quizzes.classroom_id', classroomId)
      .order('completed_at', { ascending: false });

    if (attempts && attempts.length > 0) {
      // Group by student
      const studentMap = new Map<string, any[]>();
      attempts.forEach((attempt: any) => {
        if (!studentMap.has(attempt.student_id)) {
          studentMap.set(attempt.student_id, []);
        }
        studentMap.get(attempt.student_id)!.push(attempt);
      });

      // Calculate performance for each student
      const studentsData: StudentPerformance[] = Array.from(studentMap.entries()).map(([studentId, studentAttempts]) => {
        const totalScore = studentAttempts.reduce((sum, a) => sum + a.score, 0);
        const totalQuestions = studentAttempts.reduce((sum, a) => sum + a.total_questions, 0);
        const avgAccuracy = (totalScore / totalQuestions) * 100;
        const totalTime = studentAttempts.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0);

        // Calculate improvement rate
        let improvementRate = 0;
        if (studentAttempts.length >= 3) {
          const recent = studentAttempts.slice(0, Math.min(3, studentAttempts.length));
          const older = studentAttempts.slice(-Math.min(3, studentAttempts.length));
          const recentAvg = recent.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) / recent.length;
          const olderAvg = older.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) / older.length;
          improvementRate = ((recentAvg - olderAvg) / olderAvg) * 100;
        }

        return {
          student_id: studentId,
          student_name: studentAttempts[0].profiles?.full_name || 'Unknown Student',
          total_quizzes: studentAttempts.length,
          average_score: totalScore / studentAttempts.length,
          average_accuracy: avgAccuracy,
          total_time: totalTime,
          improvement_rate: improvementRate,
        };
      });

      studentsData.sort((a, b) => b.average_accuracy - a.average_accuracy);
      setStudents(studentsData);

      // Calculate class stats
      const classAvgAccuracy = studentsData.reduce((sum, s) => sum + s.average_accuracy, 0) / studentsData.length;
      const lowPerformers = studentsData.filter(s => s.average_accuracy < 60).length;

      setClassStats({
        totalStudents: studentsData.length,
        averageAccuracy: classAvgAccuracy,
        totalAttempts: attempts.length,
        lowPerformers: lowPerformers,
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading class performance...</p>
        </CardContent>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No student performance data available yet</p>
        </CardContent>
      </Card>
    );
  }

  const barChartData = students.slice(0, 10).map(s => ({
    name: s.student_name.split(' ')[0],
    accuracy: s.average_accuracy,
  }));

  const getPerformanceColor = (accuracy: number) => {
    if (accuracy >= 80) return 'hsl(var(--success))';
    if (accuracy >= 60) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  return (
    <div className="space-y-6">
      {/* Class Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <div className="text-2xl font-bold">{classStats.totalStudents}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Class Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              <div className="text-2xl font-bold">{classStats.averageAccuracy.toFixed(1)}%</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              <div className="text-2xl font-bold">{classStats.totalAttempts}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Need Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div className="text-2xl font-bold">{classStats.lowPerformers}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Below 60% accuracy</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="accuracy" name="Accuracy %">
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.accuracy)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {students.slice(0, 5).map((student, idx) => (
                    <div key={student.student_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}</span>
                        <span className="font-medium truncate max-w-[150px]">{student.student_name}</span>
                      </div>
                      <span className="font-bold text-success">{student.average_accuracy.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Most Improved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {students
                    .filter(s => s.improvement_rate > 0)
                    .sort((a, b) => b.improvement_rate - a.improvement_rate)
                    .slice(0, 5)
                    .map((student, idx) => (
                      <div key={student.student_id} className="flex items-center justify-between">
                        <span className="font-medium truncate max-w-[150px]">{student.student_name}</span>
                        <span className="font-bold text-accent">↑ {student.improvement_rate.toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Most Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {students
                    .sort((a, b) => b.total_quizzes - a.total_quizzes)
                    .slice(0, 5)
                    .map((student, idx) => (
                      <div key={student.student_id} className="flex items-center justify-between">
                        <span className="font-medium truncate max-w-[150px]">{student.student_name}</span>
                        <span className="font-bold text-primary">{student.total_quizzes} quizzes</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rankings Tab */}
        <TabsContent value="rankings">
          <Card>
            <CardHeader>
              <CardTitle>Complete Student Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-4 pb-2 border-b font-semibold text-sm text-muted-foreground">
                  <div>Rank</div>
                  <div className="col-span-2">Student Name</div>
                  <div className="text-right">Quizzes</div>
                  <div className="text-right">Avg Accuracy</div>
                </div>
                {students.map((student, idx) => (
                  <div
                    key={student.student_id}
                    className="grid grid-cols-5 gap-4 p-3 rounded-lg hover:bg-secondary/10 transition-colors"
                  >
                    <div className="font-bold">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </div>
                    <div className="col-span-2 font-medium">{student.student_name}</div>
                    <div className="text-right text-muted-foreground">{student.total_quizzes}</div>
                    <div className={`text-right font-bold ${
                      student.average_accuracy >= 80 ? 'text-success' : 
                      student.average_accuracy >= 60 ? 'text-warning' : 
                      'text-destructive'
                    }`}>
                      {student.average_accuracy.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Students Needing Support</CardTitle>
              </CardHeader>
              <CardContent>
                {students.filter(s => s.average_accuracy < 60).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">All students performing well! 🎉</p>
                ) : (
                  <div className="space-y-3">
                    {students
                      .filter(s => s.average_accuracy < 60)
                      .map((student) => (
                        <div key={student.student_id} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{student.student_name}</span>
                            <span className="font-bold text-destructive">{student.average_accuracy.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {student.total_quizzes} quizzes • 
                            {student.improvement_rate > 0 ? ' Improving ↑' : ' Needs attention ⚠️'}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Class Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="font-semibold mb-1">Overall Performance</p>
                    <p className="text-sm text-muted-foreground">
                      {classStats.averageAccuracy >= 75 ? 'Excellent! Class is performing above expectations.' : 
                       classStats.averageAccuracy >= 60 ? 'Good performance. Some room for improvement.' : 
                       'Class needs more support and practice.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                    <p className="font-semibold mb-1">Engagement</p>
                    <p className="text-sm text-muted-foreground">
                      Average {(classStats.totalAttempts / classStats.totalStudents).toFixed(1)} quizzes per student
                    </p>
                  </div>

                  {classStats.lowPerformers > 0 && (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="font-semibold mb-1">Action Required</p>
                      <p className="text-sm text-muted-foreground">
                        {classStats.lowPerformers} student{classStats.lowPerformers > 1 ? 's' : ''} scoring below 60% - consider additional support
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClassPerformanceView;
