import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Index = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      if (profile.role === 'faculty') {
        navigate('/faculty-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    }
  }, [profile, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="text-center max-w-4xl animate-fade-in">
        <GraduationCap className="w-24 h-24 text-white mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-white mb-4">Smart Learning Hub</h1>
        <p className="text-2xl text-white/90 mb-8">
          Interactive online learning platform for classrooms, quizzes, and performance tracking
        </p>
        <Button 
          onClick={() => navigate('/auth')}
          size="lg"
          className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
