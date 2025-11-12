import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Award, TrendingUp, Target, Plus } from 'lucide-react';
import { mockPerformance } from '@/lib/mockData';

export default function Performance() {
  const avgRating = (mockPerformance.reduce((sum, p) => sum + p.overallRating, 0) / mockPerformance.length).toFixed(1);
  const totalGoals = mockPerformance.reduce((sum, p) => sum + p.goals.length, 0);
  const completedGoals = mockPerformance.reduce((sum, p) => sum + p.goals.filter(g => g.status === 'completed').length, 0);

  const getGoalStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-success/10 text-success',
      on_track: 'bg-primary/10 text-primary',
      at_risk: 'bg-destructive/10 text-destructive',
    };
    return colors[status as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Management</h1>
          <p className="text-muted-foreground mt-1">Track employee goals and performance reviews</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Review
        </Button>
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
                <p className="text-sm text-muted-foreground">Total Goals</p>
                <p className="text-3xl font-bold">{totalGoals}</p>
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
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">{completedGoals}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {mockPerformance.map((performance) => (
          <Card key={performance.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${performance.employeeName}`}
                    alt={performance.employeeName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <CardTitle className="text-xl">{performance.employeeName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Review Period: {performance.reviewPeriod}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  <span className="text-2xl font-bold text-accent">{performance.overallRating}</span>
                  <span className="text-muted-foreground">/5.0</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Goals & Achievements</h4>
                <div className="space-y-4">
                  {performance.goals.map((goal) => (
                    <div key={goal.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="font-medium">{goal.title}</h5>
                          <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                        </div>
                        <Badge className={`ml-4 capitalize ${getGoalStatusColor(goal.status)}`}>
                          {goal.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{goal.achieved}% of {goal.target}%</span>
                        </div>
                        <Progress value={goal.achieved} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Manager Feedback</h4>
                <p className="text-muted-foreground p-4 bg-muted/50 rounded-lg">{performance.feedback}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Reviewed on {new Date(performance.reviewDate).toLocaleDateString()}
                </p>
              </div>

              <Button variant="outline" className="w-full">
                View Full Review
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
