import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  question: string;
  options: string[];
  correct: string;
}

const QuizTake = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;

      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizData) {
        setQuiz(quizData);
        
        // Check if student already attempted
        const { data: attempt } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('quiz_id', quizId)
          .eq('student_id', user?.id)
          .maybeSingle();

        if (attempt) {
          toast.error('You have already attempted this quiz');
          navigate(-1);
          return;
        }

        // Select random 10 questions
        const allQuestions = Array.isArray(quizData.questions) ? quizData.questions as unknown as Question[] : [];
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(10, allQuestions.length));
        setSelectedQuestions(selected);
        setTimeLeft(quizData.duration_minutes * 60);
      }
      setLoading(false);
    };

    fetchQuiz();
  }, [quizId, user, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    let score = 0;
    selectedQuestions.forEach((q, idx) => {
      if (answers[idx] === q.correct) {
        score++;
      }
    });

    const timeTaken = (quiz.duration_minutes * 60) - timeLeft;

    const { error } = await supabase.from('quiz_attempts').insert([{
      quiz_id: quizId!,
      student_id: user!.id,
      answers: answers as any,
      selected_questions: selectedQuestions as any,
      score: score,
      total_questions: selectedQuestions.length,
      time_taken_seconds: timeTaken,
    }]);

    if (error) {
      toast.error('Failed to submit quiz');
      setSubmitting(false);
      return;
    }

    toast.success(`Quiz submitted! Score: ${score}/${selectedQuestions.length}`);
    navigate(-1);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading quiz...</p>
      </div>
    );
  }

  if (!quiz || profile?.role !== 'student') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Quiz not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="w-5 h-5" />
            <span className={timeLeft < 60 ? 'text-destructive' : ''}>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="space-y-6">
          {selectedQuestions.map((q, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {idx + 1}: {q.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers[idx] || ''}
                  onValueChange={(value) => setAnswers({ ...answers, [idx]: value })}
                >
                  {q.options.map((option, optIdx) => (
                    <div key={optIdx} className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value={option} id={`q${idx}-opt${optIdx}`} />
                      <Label htmlFor={`q${idx}-opt${optIdx}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            size="lg"
            className="bg-gradient-primary"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Submit Quiz
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizTake;
