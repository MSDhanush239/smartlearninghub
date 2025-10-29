import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuizzesList = ({ classroomId, isFaculty, refreshKey }: any) => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data } = await supabase
        .from('quizzes')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });
      if (data) setQuizzes(data);
    };
    fetchQuizzes();
  }, [classroomId, refreshKey]);

  if (quizzes.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">No Quizzes Yet</h3>
      </CardContent></Card>
    );
  }

  return (
    <div className="grid gap-4">
      {quizzes.map((quiz) => (
        <Card key={quiz.id} className="shadow-card">
          <CardHeader>
            <CardTitle>{quiz.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              <Clock className="w-4 h-4 inline mr-1" />
              {quiz.duration_minutes} minutes • {quiz.total_questions} questions
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate(isFaculty ? `/quiz-results/${quiz.id}` : `/quiz/${quiz.id}`)} 
              className="bg-gradient-primary"
            >
              {isFaculty ? 'View Results' : 'Take Quiz'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuizzesList;
