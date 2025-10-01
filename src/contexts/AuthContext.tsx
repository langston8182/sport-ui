import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types/auth';
import { authService } from '../services/auth';
import { Loader } from '../components/ui/Loader';

interface AuthContextType {
  isAuthenticated: boolean;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const authResponse = await authService.checkAuth();

      if (authResponse.authenticated && authResponse.profile) {
        setIsAuthenticated(true);
        setProfile(authResponse.profile);
      } else {
        const refreshed = await authService.refreshToken();

        if (refreshed) {
          const newAuthResponse = await authService.checkAuth();
          if (newAuthResponse.authenticated && newAuthResponse.profile) {
            setIsAuthenticated(true);
            setProfile(newAuthResponse.profile);
          } else {
            setIsAuthenticated(false);
            setProfile(null);
            authService.redirectToLogin();
          }
        } else {
          setIsAuthenticated(false);
          setProfile(null);
          authService.redirectToLogin();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setProfile(null);
      authService.redirectToLogin();
    } finally {
      setLoading(false);
    }
  };

  const refreshAuth = async () => {
    await checkAuth();
  };

  const logout = () => {
    authService.redirectToLogout();
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
      <AuthContext.Provider value={{
        isAuthenticated,
        profile,
        loading,
        logout,
        refreshAuth
      }}>
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}