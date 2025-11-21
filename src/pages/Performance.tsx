import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, TrendingUp, Target, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useState, useEffect } from 'react';
import { useUserRole } from '@/hooks/useUserRole';

interface PerformanceReview {
  id: string;
  rating: number | null;
  feedback: string | null;
  achievements: string | null;
  goals: string | null;
  review_period_start: string;
  review_period_end: string;
  profiles: {
    full_name: string | null;
    department: string | null;
    position: string | null;
  } | null;
}

export default function Performance() {
  const { user } = useSupabaseAuth();
  const { isAdminOrHR, isDepartmentHead } = useUserRole();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPerformanceReviews();
    }
  }, [user]);

  const fetchPerformanceReviews = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      const { data: reviewsData, error } = await supabase
        .from('performance_reviews')
        .select('*')
        .eq('company_id', profile.company_id)
        // If not admin/HR/department head, only fetch own reviews
        .eq(isAdminOrHR || isDepartmentHead ? 'company_id' : 'user_id', isAdminOrHR || isDepartmentHead ? profile.company_id : user?.id)
        .order('review_period_end', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (reviewsData && reviewsData.length > 0) {
        const userIds = [...new Set(reviewsData.map(r => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, department, position')
          .in('id', userIds);

        if (profilesData) {
          const enrichedReviews = reviewsData.map(review => ({
            ...review,
            profiles: profilesData.find(p => p.id === review.user_id) || null
          }));
          setReviews(enrichedReviews as any);
        }
      } else {
        setReviews([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching performance reviews:', error);
      setLoading(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, p) => sum + (p.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{isAdminOrHR || isDepartmentHead ? 'Performance Management' : 'My Performance Reviews'}</h1>
          <p className="text-muted-foreground mt-1">
            {isAdminOrHR || isDepartmentHead ? 'Track employee performance reviews' : 'View your performance history'}
          </p>
        </div>
        {(isAdminOrHR || isDepartmentHead) && (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Review
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-accent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-3xl font-bold">{avgRating}</p>
                <p className="text-xs text-muted-foreground mt-1">out of 5.0</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="text-3xl font-bold">{reviews.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Performers</p>
                <p className="text-3xl font-bold">{reviews.filter(r => (r.rating || 0) >= 4).length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No performance reviews yet</p>
              {(isAdminOrHR || isDepartmentHead) && (
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Review
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.profiles?.full_name}`}
                      alt={review.profiles?.full_name || 'Employee'}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <CardTitle className="text-xl">{review.profiles?.full_name || 'Unknown'}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {review.profiles?.position || 'No position'} • {review.profiles?.department || 'No department'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Review Period: {new Date(review.review_period_start).toLocaleDateString()} - {new Date(review.review_period_end).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" />
                    <span className="text-2xl font-bold text-accent">{review.rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-muted-foreground">/5.0</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {review.achievements && (
                  <div>
                    <h4 className="font-semibold mb-2">Achievements</h4>
                    <p className="text-muted-foreground p-4 bg-muted/50 rounded-lg">{review.achievements}</p>
                  </div>
                )}

                {review.goals && (
                  <div>
                    <h4 className="font-semibold mb-2">Goals</h4>
                    <p className="text-muted-foreground p-4 bg-muted/50 rounded-lg">{review.goals}</p>
                  </div>
                )}

                {review.feedback && (
                  <div>
                    <h4 className="font-semibold mb-2">Manager Feedback</h4>
                    <p className="text-muted-foreground p-4 bg-muted/50 rounded-lg">{review.feedback}</p>
                  </div>
                )}

                <Button variant="outline" className="w-full">
                  View Full Review
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}