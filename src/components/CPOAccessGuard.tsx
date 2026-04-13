import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface CPOAccessGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const CPOAccessGuard: React.FC<CPOAccessGuardProps> = ({ children, fallback }) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setHasAccess(false);
        return;
      }

      setUser(user);

      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['cpo', 'admin'])
        .maybeSingle();

      setHasAccess(!error && (data?.role === 'cpo' || data?.role === 'admin'));
    };

    checkAccess();
  }, []);

  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !hasAccess) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">CPO Access Required</h1>
        <p className="text-muted-foreground">You need Chief Partnership Officer privileges to access this area.</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default CPOAccessGuard;
