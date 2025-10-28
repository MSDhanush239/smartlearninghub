import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface AnnouncementsListProps {
  classroomId: string;
  refreshKey: number;
}

const AnnouncementsList = ({ classroomId, refreshKey }: AnnouncementsListProps) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, [classroomId, refreshKey]);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, profiles(*)')
      .eq('classroom_id', classroomId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading announcements...</div>;
  }

  if (announcements.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-12 text-center">
          <Megaphone className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Announcements Yet</h3>
          <p className="text-muted-foreground">
            Announcements from your instructor will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card key={announcement.id} className="shadow-card border-l-4 border-l-accent">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl">{announcement.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Posted by {announcement.profiles.full_name} •{' '}
                  {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="p-2 bg-accent/10 rounded-lg">
                <Megaphone className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{announcement.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnnouncementsList;
