import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InviteCode {
  id: string;
  code: string;
  role: string;
  max_uses: number;
  current_uses: number;
  expires_at: string | null;
  created_at: string;
}

export default function InviteCodes() {
  const { user, isAuthenticated } = useSupabaseAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  
  const [selectedRole, setSelectedRole] = useState<string>("employee");
  const [maxUses, setMaxUses] = useState<string>("1");
  const [expiresInDays, setExpiresInDays] = useState<string>("");

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, user, navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    } else {
      checkUserRole();
      fetchInviteCodes();
    }
  }, [isAuthenticated, navigate]);

  const checkUserRole = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      toast({
        title: "No Company",
        description: "You need to create or join a company first.",
        variant: "destructive",
      });
      navigate("/company-setup");
      return;
    }

    setCompanyId(profile.company_id);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("company_id", profile.company_id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only admins can manage invite codes.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  };

  const fetchInviteCodes = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return;

    const { data, error } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invite codes:", error);
      toast({
        title: "Error",
        description: "Failed to load invite codes.",
        variant: "destructive",
      });
      return;
    }

    setInviteCodes(data || []);
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-invite", {
        body: {
          company_id: companyId,
          role: selectedRole,
          max_uses: parseInt(maxUses) || 1,
          expires_in_days: expiresInDays ? parseInt(expiresInDays) : null,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invite code generated successfully!",
      });

      setMaxUses("1");
      setExpiresInDays("");
      fetchInviteCodes();
    } catch (error: any) {
      console.error("Error generating invite code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate invite code.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard.",
    });
  };

  const deleteCode = async (id: string) => {
    const { error } = await supabase
      .from("invite_codes")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete invite code.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Deleted",
      description: "Invite code deleted successfully.",
    });
    fetchInviteCodes();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "hr":
        return "default";
      default:
        return "secondary";
    }
  };

  const isCodeExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isCodeMaxedOut = (code: InviteCode) => {
    return code.current_uses >= code.max_uses;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Invite Code Management</h1>
        <p className="text-muted-foreground">
          Generate and manage invite codes for your team members.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Generate New Invite Code
          </CardTitle>
          <CardDescription>
            Create invite codes for HR staff or employees to join your company.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateCode} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maxUses">Max Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="1"
                />
              </div>

              <div>
                <Label htmlFor="expiresIn">Expires In (Days)</Label>
                <Input
                  id="expiresIn"
                  type="number"
                  min="1"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  placeholder="Never"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate Code"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Invite Codes</CardTitle>
          <CardDescription>
            Manage your existing invite codes. Share these with team members to join your company.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inviteCodes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No invite codes yet. Generate one above to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {inviteCodes.map((code) => {
                const expired = isCodeExpired(code.expires_at);
                const maxedOut = isCodeMaxedOut(code);
                const inactive = expired || maxedOut;

                return (
                  <div
                    key={code.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      inactive ? "opacity-50 bg-muted/50" : "bg-card"
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-mono font-bold">
                          {code.code}
                        </code>
                        <Badge variant={getRoleBadgeVariant(code.role)}>
                          {code.role.toUpperCase()}
                        </Badge>
                        {expired && (
                          <Badge variant="outline" className="text-destructive">
                            Expired
                          </Badge>
                        )}
                        {maxedOut && (
                          <Badge variant="outline" className="text-destructive">
                            Max Uses Reached
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Uses: {code.current_uses}/{code.max_uses} •{" "}
                        {code.expires_at
                          ? `Expires: ${new Date(code.expires_at).toLocaleDateString()}`
                          : "Never expires"}{" "}
                        • Created: {new Date(code.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!inactive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCode(code.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
