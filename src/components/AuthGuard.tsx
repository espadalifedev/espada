'use client';

import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SignupFlow } from './SignupFlow';
import { Dashboard } from './Dashboard';

export function AuthGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <SignupFlow />;
}