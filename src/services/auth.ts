import { AuthResponse, UserProfile } from '../types/auth';

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL;

class AuthService {
  async checkAuth(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/auth/me`, {
        credentials: 'include',
      });

      if (!response.ok) {
        return { authenticated: false };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Auth check failed:', error);
      return { authenticated: false };
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      return response.ok;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  redirectToLogin(): void {
    window.location.href = `${AUTH_BASE_URL}/auth/login`;
  }

  redirectToLogout(): void {
    window.location.href = `${AUTH_BASE_URL}/auth/logout`;
  }

  async handleCallback(): Promise<AuthResponse> {
    try {
      // Optionally call callback endpoint if needed
      await fetch(`${AUTH_BASE_URL}/auth/callback`, {
        credentials: 'include',
      });
    } catch (error) {
      console.error('Callback handling failed:', error);
    }

    // Always check auth status after callback
    return this.checkAuth();
  }
}

export const authService = new AuthService();