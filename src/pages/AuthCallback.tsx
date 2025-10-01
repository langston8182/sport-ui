import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from '../components/ui/Loader';

export function AuthCallback() {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const authResponse = await authService.handleCallback();
        
        if (authResponse.authenticated) {
          // Refresh the auth context
          await refreshAuth();
          // Redirect to home
          navigate('/', { replace: true });
        } else {
          // Authentication failed, redirect to login
          authService.redirectToLogin();
        }
      } catch (error) {
        console.error('Callback handling failed:', error);
        authService.redirectToLogin();
      }
    };

    handleCallback();
  }, [navigate, refreshAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Loader size="lg" />
        <p className="text-white mt-4 text-lg">Authentification en cours...</p>
      </div>
    </div>
  );
}