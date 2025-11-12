import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, DollarSign, Plus, TrendingUp } from 'lucide-react';
import { mockDepartments, mockEmployees } from '@/lib/mockData';

export default function Departments() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-muted-foreground mt-1">Manage organizational structure</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Department
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {mockDepartments.map((dept) => (
          <Card key={dept.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{dept.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Head: {dept.headName}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Employees</p>
                  </div>
                  <p className="text-2xl font-bold">{dept.employeeCount}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <p className="text-sm text-muted-foreground">Budget</p>
                  </div>
                  <p className="text-2xl font-bold">${(dept.budget / 1000000).toFixed(1)}M</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-3">Team Members</h4>
                <div className="flex -space-x-2">
                  {mockEmployees
                    .filter(e => e.department === dept.name)
                    .slice(0, 5)
                    .map((emp) => (
                      <img
                        key={emp.id}
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-8 h-8 rounded-full border-2 border-background"
                        title={emp.name}
                      />
                    ))}
                  {mockEmployees.filter(e => e.department === dept.name).length > 5 && (
                    <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                      +{mockEmployees.filter(e => e.department === dept.name).length - 5}
                    </div>
                  )}
                </div>
              </div>

              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockDepartments.map((dept) => {
              const growth = Math.floor(Math.random() * 20) + 5;
              const isPositive = growth > 10;
              return (
                <div
                  key={dept.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{dept.name}</p>
                      <p className="text-sm text-muted-foreground">{dept.employeeCount} employees</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Budget Utilization</p>
                      <p className="font-medium">{Math.floor(Math.random() * 30) + 70}%</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Growth</p>
                      <p className={`font-medium flex items-center gap-1 ${isPositive ? 'text-success' : 'text-warning'}`}>
                        <TrendingUp className="w-4 h-4" />
                        {growth}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
