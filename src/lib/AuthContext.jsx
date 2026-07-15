import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { auth } from '@/api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const loadUser = useCallback(async () => {
    try {
      const profile = await auth.me();
      if (profile.is_suspended) {
        await auth.logout();
        setUser(null);
        setIsAuthenticated(false);
        window.location.assign('/suspended');
        return;
      }
      setUser(profile);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (error.status && error.status !== 401) {
        setAuthError({ type: 'unknown', message: error.message });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) loadUser();
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [loadUser]);

  // Stable references: useSessionTimeout depends on logout, and an unstable
  // reference would reset its 24h session clock on every token refresh.
  const logout = useCallback(async (shouldRedirect = true) => {
    await auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) window.location.assign('/');
  }, []);

  const navigateToLogin = useCallback(
    () => auth.redirectToLogin(window.location.pathname),
    [],
  );

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      // kept so existing pages destructuring these don't crash:
      isLoadingPublicSettings: false,
      appPublicSettings: null,
      authError,
      logout,
      navigateToLogin,
      checkAppState: loadUser,
      loadUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
