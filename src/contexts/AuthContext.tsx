import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearAuthSession,
  DEFAULT_AUTH_SETTINGS,
  hashSecret,
  isAuthConfigured,
  loadAuthSession,
  loadAuthSettings,
  saveAuthSession,
  saveAuthSettings,
  verifyPassword,
  verifyPin,
} from '@/lib/auth';
import type { AuthMethod, AuthSettings } from '@/lib/auth';

interface SetupPayload {
  phoneNumber: string;
  password: string;
  pin: string;
  enabledMethods: AuthMethod[];
  googleClientId?: string;
  googleAllowedEmail?: string;
}

interface UpdatePayload {
  phoneNumber?: string;
  password?: string;
  pin?: string;
  enabledMethods?: AuthMethod[];
  googleClientId?: string;
  googleAllowedEmail?: string;
}

interface AuthContextType {
  settings: AuthSettings;
  loading: boolean;
  isAuthenticated: boolean;
  needsSetup: boolean;
  sessionMethod: AuthMethod | null;
  setupAuth: (payload: SetupPayload) => Promise<boolean>;
  updateAuth: (payload: UpdatePayload) => Promise<boolean>;
  loginWithPassword: (phoneNumber: string, password: string) => Promise<boolean>;
  loginWithPin: (pin: string) => Promise<boolean>;
  loginWithGoogle: (email: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AuthSettings>(DEFAULT_AUTH_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionMethod, setSessionMethod] = useState<AuthMethod | null>(null);

  useEffect(() => {
    const nextSettings = loadAuthSettings();
    const nextSession = loadAuthSession();
    setSettings(nextSettings);
    setIsAuthenticated(Boolean(nextSession?.authenticated));
    setSessionMethod(nextSession?.method || null);
    setLoading(false);
  }, []);

  const persistSettings = useCallback((nextSettings: AuthSettings) => {
    setSettings(nextSettings);
    saveAuthSettings(nextSettings);
  }, []);

  const setupAuth = useCallback(async (payload: SetupPayload) => {
    const enabledMethods = payload.enabledMethods.length > 0 ? payload.enabledMethods : ['phone_password'];
    const nextSettings: AuthSettings = {
      phoneNumber: payload.phoneNumber.trim(),
      passwordHash: payload.password ? await hashSecret(payload.password) : '',
      pin: payload.pin.trim(),
      enabledMethods,
      googleClientId: payload.googleClientId?.trim() || '',
      googleAllowedEmail: payload.googleAllowedEmail?.trim() || '',
    };

    if (!isAuthConfigured(nextSettings)) {
      return false;
    }

    persistSettings(nextSettings);
    const method = enabledMethods.includes('phone_password')
      ? 'phone_password'
      : enabledMethods.includes('pin')
      ? 'pin'
      : 'google';
    saveAuthSession(method);
    setIsAuthenticated(true);
    setSessionMethod(method);
    return true;
  }, [persistSettings]);

  const updateAuth = useCallback(async (payload: UpdatePayload) => {
    const enabledMethods = payload.enabledMethods || settings.enabledMethods;
    const nextSettings: AuthSettings = {
      ...settings,
      phoneNumber: payload.phoneNumber !== undefined ? payload.phoneNumber.trim() : settings.phoneNumber,
      pin: payload.pin !== undefined ? payload.pin.trim() : settings.pin,
      enabledMethods,
      googleClientId: payload.googleClientId !== undefined ? payload.googleClientId.trim() : settings.googleClientId,
      googleAllowedEmail: payload.googleAllowedEmail !== undefined ? payload.googleAllowedEmail.trim() : settings.googleAllowedEmail,
      passwordHash: settings.passwordHash,
    };

    if (payload.password !== undefined && payload.password.trim()) {
      nextSettings.passwordHash = await hashSecret(payload.password);
    }

    if (!isAuthConfigured(nextSettings)) {
      return false;
    }

    persistSettings(nextSettings);
    return true;
  }, [persistSettings, settings]);

  const loginWithPassword = useCallback(async (phoneNumber: string, password: string) => {
    const ok = await verifyPassword(phoneNumber, password, settings);
    if (!ok) return false;
    saveAuthSession('phone_password');
    setIsAuthenticated(true);
    setSessionMethod('phone_password');
    return true;
  }, [settings]);

  const loginWithPin = useCallback(async (pin: string) => {
    const ok = verifyPin(pin, settings);
    if (!ok) return false;
    saveAuthSession('pin');
    setIsAuthenticated(true);
    setSessionMethod('pin');
    return true;
  }, [settings]);

  const loginWithGoogle = useCallback(async (email: string) => {
    if (!settings.enabledMethods.includes('google')) return false;
    if (!settings.googleAllowedEmail) return false;
    const ok = settings.googleAllowedEmail.toLowerCase() === email.trim().toLowerCase();
    if (!ok) return false;
    saveAuthSession('google');
    setIsAuthenticated(true);
    setSessionMethod('google');
    return true;
  }, [settings]);

  const logout = useCallback(() => {
    clearAuthSession();
    setIsAuthenticated(false);
    setSessionMethod(null);
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    settings,
    loading,
    isAuthenticated,
    needsSetup: !isAuthConfigured(settings),
    sessionMethod,
    setupAuth,
    updateAuth,
    loginWithPassword,
    loginWithPin,
    loginWithGoogle,
    logout,
  }), [settings, loading, isAuthenticated, sessionMethod, setupAuth, updateAuth, loginWithPassword, loginWithPin, loginWithGoogle, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
