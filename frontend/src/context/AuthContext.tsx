import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api.js';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'FARMER' | 'OWNER' | 'ADMIN';
  is_active?: boolean;
  profile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; role?: string }>;
  register: (data: any) => Promise<{ success: boolean; message: string; role?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from localStorage and verify with backend /api/auth/me
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('agrorent_token');
      const savedUserStr = localStorage.getItem('agrorent_user');

      if (savedToken) {
        setToken(savedToken);
        if (savedUserStr) {
          try {
            setUser(JSON.parse(savedUserStr));
          } catch (e) {
            // ignore parse error
          }
        }

        try {
          // Fetch fresh authenticated user details from server
          const response = await authApi.getMe();
          if (response.data?.success && response.data?.user) {
            setUser(response.data.user);
            localStorage.setItem('agrorent_user', JSON.stringify(response.data.user));
          }
        } catch (error) {
          console.warn('[Auth] Stored session invalid or expired. Clearing auth state.');
          localStorage.removeItem('agrorent_token');
          localStorage.removeItem('agrorent_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      const data = response.data;

      if (data.success && data.token && data.user) {
        localStorage.setItem('agrorent_token', data.token);
        localStorage.setItem('agrorent_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true, message: data.message, role: data.user.role };
      }

      return {
        success: false,
        message: data.message || 'Login failed',
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message };
    }
  };

  const register = async (data: any) => {
    try {
      const response = await authApi.register(data);
      const resData = response.data;

      if (resData.success && resData.token && resData.user) {
        localStorage.setItem('agrorent_token', resData.token);
        localStorage.setItem('agrorent_user', JSON.stringify(resData.user));
        setToken(resData.token);
        setUser(resData.user);
        return { success: true, message: resData.message, role: resData.user.role };
      }

      return {
        success: false,
        message: resData.message || 'Registration failed',
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please check your input.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Ignore network failure on logout
    } finally {
      localStorage.removeItem('agrorent_token');
      localStorage.removeItem('agrorent_user');
      setUser(null);
      setToken(null);
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await authApi.getMe();
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('agrorent_user', JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.error('[Auth] Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
