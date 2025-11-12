import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CompanySetup() {
  const [companyName, setCompanyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasCompany, setHasCompany] = useState(false);
  const { user, isAuthenticated } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    checkUserCompany();
  }, [isAuthenticated, navigate, user]);

  const checkUserCompany = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profile?.company_id) {
      setHasCompany(true);
      navigate('/dashboard');
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-company', {
        body: { name: companyName },
      });

      if (error) throw error;

      toast({
        title: 'Company created!',
        description: `${companyName} has been created successfully`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create company',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('join-company', {
        body: { code: inviteCode },
      });

      if (error) throw error;

      toast({
        title: 'Joined company!',
        description: `Welcome to ${data.company?.name}`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to join company',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-extralight tracking-wider">Company Setup</h1>
            <p className="text-muted-foreground mt-3 font-light tracking-wide">
              Create a new company or join an existing one
            </p>
          </div>
        </div>

        <Card className="border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-light tracking-wide">Get Started</CardTitle>
            <CardDescription className="font-light">
              Choose how you'd like to proceed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2 font-light mb-6">
                <TabsTrigger value="create">Create Company</TabsTrigger>
                <TabsTrigger value="join">Join Company</TabsTrigger>
              </TabsList>

              <TabsContent value="create">
                <form onSubmit={handleCreateCompany} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name" className="font-light">
                      Company Name
                    </Label>
                    <Input
                      id="company-name"
                      type="text"
                      placeholder="Acme Corporation"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="font-light"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full font-light tracking-wide"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Company'}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground font-light">
                    You'll be assigned as the company admin
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="join">
                <form onSubmit={handleJoinCompany} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-code" className="font-light">
                      Invite Code
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="invite-code"
                        type="text"
                        placeholder="XXXX-XXXX"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        className="font-light pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full font-light tracking-wide"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? 'Joining...' : 'Join Company'}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground font-light">
                    Enter the invite code provided by your admin
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
