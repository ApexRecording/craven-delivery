import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ChiefPartnershipAccessGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ChiefPartnershipAccessGuard: React.FC<ChiefPartnershipAccessGuardProps> = ({
  children,
  fallback,
}) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setHasAccess(false);
        return;
      }

      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['cpo', 'admin']);

      setHasAccess(!error && data && data.length > 0);
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

  if (!hasAccess) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
        <p className="text-muted-foreground">
          The Chief Partnership Portal requires CPO or Admin privileges.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ChiefPartnershipAccessGuard;
