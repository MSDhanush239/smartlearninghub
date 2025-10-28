import { Card, CardContent } from '@/components/ui/card';

const QuizTake = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full"><CardContent className="py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Quiz Feature</h2>
        <p className="text-muted-foreground">Quiz taking functionality will be available soon</p>
      </CardContent></Card>
    </div>
  );
};

export default QuizTake;
