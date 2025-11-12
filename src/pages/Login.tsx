import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2 } from 'lucide-react';
import { UserRole } from '@/types';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password, role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-extralight tracking-wider">ELEVATE</h1>
            <p className="text-muted-foreground mt-3 font-light tracking-wide">Sign in to your account</p>
          </div>
        </div>

        <Card className="border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-light tracking-wide">Access Portal</CardTitle>
            <CardDescription className="font-light">Choose your role and enter credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <Tabs value={role} onValueChange={(value) => setRole(value as UserRole)} className="w-full">
                <TabsList className="grid w-full grid-cols-4 font-light">
                  <TabsTrigger value="employee">Employee</TabsTrigger>
                  <TabsTrigger value="hr">HR</TabsTrigger>
                  <TabsTrigger value="department_head">Manager</TabsTrigger>
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-light">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="font-light"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-light">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-light"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full font-light tracking-wide" size="lg">
                Sign In
              </Button>

              <p className="text-xs text-center text-muted-foreground font-light">
                Demo: Use any email/password combination to login
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
