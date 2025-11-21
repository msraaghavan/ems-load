import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useState, useEffect } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';

interface Department {
  id: string;
  name: string;
  head_name: string | null;
  employee_count: number;
  budget: number | null;
}

export default function Departments() {
  const { user } = useSupabaseAuth();
  const { isAdminOrHR, isDepartmentHead } = useUserRole();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authorized
  useEffect(() => {
    if (!loading && !isAdminOrHR && !isDepartmentHead) {
      navigate('/dashboard');
    }
  }, [isAdminOrHR, isDepartmentHead, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDepartments();
    }
  }, [user]);

  const fetchDepartments = async () => {
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

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', profile.company_id);

      if (error) throw error;

      setDepartments(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }
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

      {departments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No departments found</p>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create First Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((dept) => (
              <Card key={dept.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{dept.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Head: {dept.head_name || 'Not assigned'}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Employees</span>
                    <span className="font-semibold">{dept.employee_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Budget</span>
                    <span className="font-semibold">${dept.budget?.toLocaleString() || '0'}</span>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        View Details
                      </Button>
                    </div>
                  </div>
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
                {departments.map((dept) => {
                  const budgetUtilization = Math.floor(Math.random() * 100);
                  const growth = (Math.random() * 20 - 5).toFixed(1);
                  const isPositive = parseFloat(growth) > 0;

                  return (
                    <div key={dept.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex-1">
                        <p className="font-medium">{dept.name}</p>
                        <p className="text-sm text-muted-foreground">{dept.employee_count} employees</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Budget Utilization</p>
                          <p className="font-semibold">{budgetUtilization}%</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4 text-success" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-warning" />
                          )}
                          <span className={isPositive ? 'text-success' : 'text-warning'}>
                            {growth}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
