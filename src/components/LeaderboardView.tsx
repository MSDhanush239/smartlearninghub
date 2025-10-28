import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

const LeaderboardView = ({ classroomId }: { classroomId: string }) => {
  return (
    <Card className="shadow-card">
      <CardContent className="py-12 text-center">
        <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Leaderboard Coming Soon</h3>
        <p className="text-muted-foreground">Rankings will appear here after quizzes are completed</p>
      </CardContent>
    </Card>
  );
};

export default LeaderboardView;
