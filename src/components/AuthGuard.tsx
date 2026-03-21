import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { UserRole } from '../types';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-500 animate-pulse">Autenticando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Special case for admin email
    if (user.email === 'paulttechh@gmail.com' && allowedRoles.includes('admin')) {
      return <>{children}</>;
    }

    // Redirect based on actual role if they try to access unauthorized area
    if (profile.role === 'admin') return <Navigate to="/admin" replace />;
    if (profile.role === 'motoboy') return <Navigate to="/motoboy" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
