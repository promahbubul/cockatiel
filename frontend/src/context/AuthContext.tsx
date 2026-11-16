import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../services/api';
import { socketService } from '../services/socket';
import { CURRENT_USER } from '../constants/mockData';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  about?: string;
  isOnline?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (profile: { displayName?: string; about?: string; avatarUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => false,
  logout: async () => {},
  updateUser: async () => {},
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
            setIsLoading(false);
            return;
          }
        }

        // Auto demo login for seamless local development
        try {
          const verifyRes = await api.auth.verifyOtp('alex@cockatiel.app', '123456');
          if (verifyRes.success && verifyRes.token) {
            await setAuthToken(verifyRes.token);
            setToken(verifyRes.token);
            setUser(verifyRes.user);
            socketService.connect(verifyRes.user.id);
            setIsLoading(false);
            return;
          }
        } catch {
          // Fallback to offline mock user
          setUser({
            id: CURRENT_USER.id,
            email: CURRENT_USER.email,
            displayName: CURRENT_USER.name,
            avatarUrl: CURRENT_USER.avatar,
            about: CURRENT_USER.about || '',
            isOnline: true,
          });
        }
      } catch (err) {
        console.warn('[AuthContext] Auth init fallback to mock user', err);
        setUser({
          id: CURRENT_USER.id,
          email: CURRENT_USER.email,
          displayName: CURRENT_USER.name,
          avatarUrl: CURRENT_USER.avatar,
          about: CURRENT_USER.about || '',
          isOnline: true,
        });
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, code: string): Promise<boolean> => {
    try {
      const res = await api.auth.verifyOtp(email, code);
      if (res.success && res.token) {
        await setAuthToken(res.token);
        setToken(res.token);
        setUser(res.user);
        socketService.connect(res.user.id);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      return false;
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

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
