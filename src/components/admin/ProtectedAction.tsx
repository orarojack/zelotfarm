import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../lib/permissions';

interface ProtectedActionProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ProtectedAction({
  resource,
  action,
  children,
  fallback = null,
}: ProtectedActionProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  const canPerform = hasPermission(user.role, resource, action);

  if (!canPerform) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

