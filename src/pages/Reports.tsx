import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, TrendingUp, Users, Clock, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function Reports() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [generating, setGenerating] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchCompanyId();
    }
  }, [user]);

  const fetchCompanyId = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user?.id)
      .single();
    
    if (profile?.company_id) {
      setCompanyId(profile.company_id);
    }
  };

  const handleGenerateReport = async (reportType: string, reportId: number) => {
    if (!companyId) {
      toast.error('Company not found');
      return;
    }

    setGenerating(reportId);
    
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          company_id: companyId,
          report_type: reportType,
          start_date: startDate,
          end_date: endDate
        }
      });

      if (error) throw error;

      toast.success(`${reportType} report generated successfully`);
      
      // Download the report as JSON
      downloadReport(data.report, reportType);
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const downloadReport = (reportData: any, reportType: string) => {
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reportTypes = [
    {
      id: 1,
      title: 'Monthly Attendance Report',
      description: 'Comprehensive attendance data for all employees',
      icon: Clock,
      category: 'Attendance',
      type: 'attendance',
      lastGenerated: '2025-01-10',
    },
    {
      id: 2,
      title: 'Leave Analytics',
      description: 'Leave patterns and balance tracking report',
      icon: Calendar,
      category: 'Leave',
      type: 'leave',
      lastGenerated: '2025-01-09',
    },
    {
      id: 3,
      title: 'Performance Overview',
      description: 'Employee performance metrics and ratings',
      icon: TrendingUp,
      category: 'Performance',
      type: 'performance',
      lastGenerated: '2025-01-07',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Generate and export various reports</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-3xl font-bold">{reportTypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Download className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Types</p>
                <p className="text-3xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Report Types</p>
                <p className="text-3xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription className="mt-1">{report.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="font-medium">{report.category}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{report.type}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    className="flex-1 gap-2" 
                    onClick={() => handleGenerateReport(report.type, report.id)}
                    disabled={generating === report.id}
                  >
                    <FileText className="w-4 h-4" />
                    {generating === report.id ? 'Generating...' : 'Generate & Download'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}