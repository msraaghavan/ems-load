import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

type UserRole = 'admin' | 'hr' | 'department_head' | 'employee' | null;

export function useUserRole() {
  const { user } = useSupabaseAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setRole(null);
      setCompanyId(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;

    try {
      // First get company_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);

        // Then get role from user_roles
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('company_id', profile.company_id)
          .single();

        setRole(roleData?.role || 'employee');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('employee'); // Default to employee if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === 'admin';
  const isHR = role === 'hr';
  const isAdminOrHR = isAdmin || isHR;
  const isDepartmentHead = role === 'department_head';
  const isEmployee = role === 'employee';

  return {
    role,
    companyId,
    loading,
    isAdmin,
    isHR,
    isAdminOrHR,
    isDepartmentHead,
    isEmployee,
  };
}
