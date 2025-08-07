import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpcClient } from '../lib/trpcClient';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  onboarding_skipped: boolean;
  updated_at: string;
}

interface Session {
  user: User;
  token: string;
  refreshToken: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
};

import { config } from '../lib/config';

// API Configuration
const API_BASE_URL = config.server.url;

// API Helper Functions
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from storage on app start
  useEffect(() => {
    console.log('🔐 AuthProvider: Checking authentication...');
    
    const loadSession = async () => {
      try {
        console.log('📱 Loading session from AsyncStorage...');
        const [token, refreshToken, userData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
        ]);
        
        if (token && refreshToken && userData) {
          const user = JSON.parse(userData);
          const newSession: Session = {
            user,
            token,
            refreshToken,
          };
          console.log('✅ Found stored session for user:', user.email);
          setSession(newSession);
        } else {
          console.log('📱 No stored session found');
        }
      } catch (error) {
        console.error('❌ Error loading session from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Test server connection on startup
    const testConnection = async () => {
      try {
        console.log('🧪 Testing server connection on startup...');
        const result = await trpcClient.testConnection();
        if (result.success) {
          console.log('✅ Server connection successful on startup');
        } else {
          console.error('❌ Server connection failed on startup:', result.error);
        }
      } catch (error) {
        console.error('❌ Connection test error on startup:', error);
      }
    };
    
    testConnection();
    loadSession();
  }, []);

  const storeAuthData = async (user: User, tokens: { token: string; refreshToken: string }) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.token),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
      ]);

      const newSession: Session = {
        user,
        token: tokens.token,
        refreshToken: tokens.refreshToken,
      };

      setSession(newSession);
      console.log('✅ Auth data stored successfully');
    } catch (error) {
      console.error('❌ Error storing auth data:', error);
      throw error;
    }
  };

  const clearAuthData = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);

      setSession(null);
      console.log('🔐 User logged out, session cleared');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 Login attempt:', email);
      const response = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success && response.data) {
        await storeAuthData(response.data.user, {
          token: response.data.token,
          refreshToken: response.data.refreshToken,
        });
        console.log('✅ Login successful, session stored');
        return { success: true };
      } else {
        console.error('❌ Login failed:', response.error);
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred during login.' };
    }
  };

  const signup = async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 Signup attempt:', email);
      const response = await apiCall('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });

      if (response.success && response.data) {
        await storeAuthData(response.data.user, {
          token: response.data.token,
          refreshToken: response.data.refreshToken,
        });
        console.log('✅ Signup successful, session stored');
        return { success: true };
      } else {
        console.error('❌ Signup failed:', response.error);
        return { success: false, error: response.error || 'Signup failed' };
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred during signup.' };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint if user is authenticated
      if (session) {
        try {
          await apiCall('/api/auth/logout', { method: 'POST' });
        } catch (error) {
          console.error('❌ Logout API error:', error);
        }
      }
    } finally {
      await clearAuthData();
    }
  };

  const refreshAuth = async (): Promise<boolean> => {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        await storeAuthData(session!.user, {
          token: data.data.token,
          refreshToken: data.data.refreshToken,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      await clearAuthData();
      return false;
    }
  };

  // Don't render children until we've checked for stored session
  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider 
      value={{ 
        session, 
        user: session?.user || null, 
        login, 
        logout, 
        signup, 
        refreshAuth 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
