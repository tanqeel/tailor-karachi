export type AuthMethod = 'phone_password' | 'pin' | 'google';

export interface AuthSettings {
  phoneNumber: string;
  passwordHash: string;
  pin: string;
  enabledMethods: AuthMethod[];
  googleClientId: string;
  googleAllowedEmail: string;
}

export interface AuthSession {
  authenticated: boolean;
  method: AuthMethod;
  loginAt: string;
}

const SETTINGS_KEY = 'kt-auth-settings';
const SESSION_KEY = 'kt-auth-session';

export const DEFAULT_AUTH_SETTINGS: AuthSettings = {
  phoneNumber: '',
  passwordHash: '',
  pin: '',
  enabledMethods: ['phone_password'],
  googleClientId: '',
  googleAllowedEmail: '',
};

export function loadAuthSettings(): AuthSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_AUTH_SETTINGS;
    return { ...DEFAULT_AUTH_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AUTH_SETTINGS;
  }
}

export function saveAuthSettings(settings: AuthSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.authenticated || !parsed?.method) return null;
    return parsed as AuthSession;
  } catch {
    return null;
  }
}

export function saveAuthSession(method: AuthMethod) {
  const session: AuthSession = {
    authenticated: true,
    method,
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthConfigured(settings: AuthSettings): boolean {
  const hasPassword = settings.enabledMethods.includes('phone_password')
    ? Boolean(settings.phoneNumber && settings.passwordHash)
    : true;
  const hasPin = settings.enabledMethods.includes('pin') ? Boolean(settings.pin) : true;
  const hasGoogle = settings.enabledMethods.includes('google')
    ? Boolean(settings.googleAllowedEmail)
    : true;
  return settings.enabledMethods.length > 0 && hasPassword && hasPin && hasGoogle;
}

export async function hashSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(secret);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(phoneNumber: string, password: string, settings: AuthSettings): Promise<boolean> {
  if (!settings.phoneNumber || !settings.passwordHash) return false;
  if (settings.phoneNumber.trim() !== phoneNumber.trim()) return false;
  const hashed = await hashSecret(password);
  return hashed === settings.passwordHash;
}

export function verifyPin(pin: string, settings: AuthSettings): boolean {
  if (!settings.pin) return false;
  return settings.pin === pin.trim();
}

