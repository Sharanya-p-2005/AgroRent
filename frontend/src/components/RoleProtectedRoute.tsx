import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Loading } from './Loading.js';
import { Unauthorized } from './Unauthorized.js';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'FARMER' | 'OWNER' | 'ADMIN'>;
}

/**
 * RoleProtectedRoute enforces both authentication and role verification.
 * Non-authenticated users are redirected to /login.
 * Authenticated users with an unauthorized role see the Unauthorized screen with "Go to Dashboard".
 */
export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading message="Verifying role permissions..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Unauthorized requiredRoles={allowedRoles} />;
  }

  return <>{children}</>;
};
