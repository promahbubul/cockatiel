import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../services/api';
import { socketService } from '../services/socket';
import { registerForPushNotificationsAsync } from '../services/pushNotification';
import { CURRENT_USER } from '../constants/mockData';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  about?: string;
  isOnline?: boolean;
  settings?: {
    showNotifications?: boolean;
    messagePreviews?: boolean;
    sounds?: boolean;
    vibrate?: boolean;
    readReceipts?: boolean;
    lastSeenPrivacy?: 'everyone' | 'contacts' | 'nobody';
  };
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (displayName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (profile: { displayName?: string; about?: string; avatarUrl?: string }) => Promise<void>;
  updateSettings: (settings: Record<string, any>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  verifyEmail: async () => ({ success: false }),
  forgotPassword: async () => ({ success: false }),
  resetPassword: async () => ({ success: false }),
  logout: async () => {},
  updateUser: async () => {},
  updateSettings: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth on launch
  useEffect(() => {
    async function initAuth() {
      try {
        const savedToken = await getAuthToken();
        if (savedToken) {
          setToken(savedToken);
          const res = await api.auth.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            socketService.connect(res.user.id);
            registerForPushNotificationsAsync().catch(() => {});
            setIsLoading(false);
            return;
          } else {
            // Token expired or invalid
            await setAuthToken(null);
            setToken(null);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('[AuthContext] Auth init check failed:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  // Login
  const login = async (email: string, password: string = 'password123'): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.auth.login({ email, password });
      if (res.success && res.token) {
        await setAuthToken(res.token);
        setToken(res.token);
        setUser(res.user);
        socketService.connect(res.user.id);
        registerForPushNotificationsAsync().catch(() => {});
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid credentials' };
    }
  };

  // Register
  const register = async (
    displayName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.auth.register({ displayName, email, password });
      if (res.success) {
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  // Verify Email
  const verifyEmail = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.auth.verifyEmail({ email, code });
      if (res.success && res.token) {
        await setAuthToken(res.token);
        setToken(res.token);
        setUser(res.user);
        socketService.connect(res.user.id);
        registerForPushNotificationsAsync().catch(() => {});
        return { success: true };
      }
      return { success: false, error: 'Verification failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid verification code' };
    }
  };

  // Forgot Password
  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.auth.forgotPassword(email);
      if (res.success) {
        return { success: true };
      }
      return { success: false, error: 'Request failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Request failed' };
    }
  };

  // Reset Password
  const resetPassword = async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.auth.resetPassword({ email, code, newPassword });
      if (res.success) {
        return { success: true };
      }
      return { success: false, error: 'Reset failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Reset failed' };
    }
  };

  const logout = async () => {
    await setAuthToken(null);
    setToken(null);
    setUser(null);
    socketService.disconnect();
  };

  const updateUser = async (profile: { displayName?: string; about?: string; avatarUrl?: string }) => {
    try {
      const res = await api.auth.updateProfile(profile);
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('[AuthContext] Update user error:', err);
    }
  };

  const updateSettings = async (settings: Record<string, any>) => {
    try {
      setUser((prev) => (prev ? { ...prev, settings: { ...(prev.settings || {}), ...settings } } : prev));
      const res = await api.users.updateSettings(settings);
      if (res.success && res.settings) {
        setUser((prev) => (prev ? { ...prev, settings: res.settings } : prev));
      }
    } catch (err) {
      console.error('[AuthContext] Update settings error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        verifyEmail,
        forgotPassword,
        resetPassword,
        logout,
        updateUser,
        updateSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
