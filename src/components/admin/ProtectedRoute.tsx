import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessRoute, canAccessModule } from '../../lib/permissions';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, supabaseUser, loading } = useAuth();
  const location = useLocation();
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setCheckingPermissions(false);
        return;
      }

      // First check default permissions
      const defaultAccess = canAccessRoute(user.role, location.pathname);
      
      if (defaultAccess) {
        setHasAccess(true);
        setCheckingPermissions(false);
        return;
      }

      // If not in default list, check dynamic permissions for custom roles
      try {
        const dynamicAccess = await canAccessModule(user.role, location.pathname);
        setHasAccess(dynamicAccess);
      } catch (error) {
        console.error('Error checking dynamic permissions:', error);
        setHasAccess(false);
      } finally {
        setCheckingPermissions(false);
      }
    };

    if (!loading && user) {
      checkAccess();
    } else if (!loading && !user) {
      setCheckingPermissions(false);
    }
  }, [user, location.pathname, loading]);

  if (loading || checkingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Check if user is authenticated (Supabase auth user exists)
  if (!supabaseUser) {
    return <Navigate to="/admin/login" replace />;
  }

  // If user record doesn't exist in users table, show a message
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Setup Required</h2>
          <p className="text-gray-600 mb-4">
            Your account is authenticated, but your user record is not found in the system.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Please contact your administrator to set up your account in the users table.
          </p>
          <button
            onClick={() => {
              // Sign out and redirect to login
              window.location.href = '/admin/login';
            }}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Check if user has permission to access this route
  if (!hasAccess) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

