import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseUserRoleReturn {
  role: string | null;
  hasRole: (r: string) => boolean;
  loading: boolean;
}

export const useUserRole = (): UseUserRoleReturn => {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (!error && data) {
        setRoles(data.map((r: { role: string }) => r.role));
      }

      setLoading(false);
    };

    fetchRoles();
  }, []);

  return {
    role: roles[0] ?? null,
    hasRole: (r: string) => roles.includes(r),
    loading,
  };
};
