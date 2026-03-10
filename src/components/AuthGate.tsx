import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Smartphone, KeyRound, Mail, Lock, SmartphoneCharging } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import type { AuthMethod } from '@/lib/auth';
import { toast } from 'sonner';

const spring = { type: 'spring' as const, stiffness: 260, damping: 24 };

function MethodChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      }`}
    >
      {children}
    </button>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isUrdu } = useLang();
  const { settings, loading, isAuthenticated, needsSetup, setupAuth, loginWithPassword, loginWithPin, loginWithGoogle } = useAuth();
  const [activeMethod, setActiveMethod] = useState<AuthMethod>('phone_password');
  const [setupMethods, setSetupMethods] = useState<AuthMethod[]>(['phone_password']);
  const [phone, setPhone] = useState(settings.phoneNumber || '');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [googleEmail, setGoogleEmail] = useState(settings.googleAllowedEmail || '');
  const [googleClientId, setGoogleClientId] = useState(settings.googleClientId || '');
  const [busy, setBusy] = useState(false);

  const enabledMethods = useMemo(() => {
    if (needsSetup) return setupMethods;
    return settings.enabledMethods;
  }, [needsSetup, settings.enabledMethods, setupMethods]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center animate-pulse-soft">
            <ShieldCheck size={28} />
          </div>
          <p className="font-semibold">{isUrdu ? 'کراچی ٹیلرز لوڈ ہو رہا ہے...' : 'Loading Karachi Tailors...'}</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const toggleSetupMethod = (method: AuthMethod) => {
    setSetupMethods((current) => {
      const exists = current.includes(method);
      if (exists) {
        const next = current.filter((item) => item !== method);
        return next.length > 0 ? next : ['phone_password'];
      }
      return [...current, method];
    });
  };

  const handleSetup = async () => {
    setBusy(true);
    const ok = await setupAuth({
      phoneNumber: phone,
      password,
      pin,
      enabledMethods: setupMethods,
      googleAllowedEmail: googleEmail,
      googleClientId,
    });
    setBusy(false);
    if (!ok) {
      toast.error(isUrdu ? 'براہ کرم منتخب لاگ ان طریقوں کی معلومات مکمل کریں' : 'Please complete the selected login method details');
      return;
    }
    toast.success(isUrdu ? 'سیکیورٹی سیٹ اپ مکمل ہو گیا' : 'Security setup complete');
  };

  const handleLogin = async () => {
    setBusy(true);
    let ok = false;

    if (activeMethod === 'phone_password') {
      ok = await loginWithPassword(phone, password);
    } else if (activeMethod === 'pin') {
      ok = await loginWithPin(pin);
    } else {
      ok = await loginWithGoogle(googleEmail);
    }

    setBusy(false);
    if (!ok) {
      toast.error(isUrdu ? 'لاگ ان ناکام رہا' : 'Login failed');
      return;
    }
    toast.success(isUrdu ? 'خوش آمدید' : 'Welcome back');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f4efe3,transparent_35%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)))] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="w-full max-w-md rounded-[2rem] border border-border bg-card/95 shadow-2xl overflow-hidden"
      >
        <div className="bg-primary text-primary-foreground px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
              <SmartphoneCharging size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">{isUrdu ? 'کراچی ٹیلرز' : 'Karachi Tailors'}</h1>
              <p className="text-sm text-primary-foreground/80">
                {needsSetup
                  ? (isUrdu ? 'پہلی بار سیکیورٹی سیٹ اپ کریں' : 'Set up shop security for first use')
                  : (isUrdu ? 'آف لائن شاپ لاگ ان' : 'Offline shop login')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{isUrdu ? 'آف لائن فرسٹ' : 'Offline First'}</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">IndexedDB</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">PWA</span>
          </div>
        </div>

        <div className="px-6 py-6 space-y-5">
          {needsSetup ? (
            <>
              <div className="space-y-2">
                <p className="text-sm font-semibold">{isUrdu ? 'لاگ ان طریقے منتخب کریں' : 'Choose login methods'}</p>
                <div className="flex flex-wrap gap-2">
                  <MethodChip active={setupMethods.includes('phone_password')} onClick={() => toggleSetupMethod('phone_password')}>
                    {isUrdu ? 'فون + پاس ورڈ' : 'Phone + Password'}
                  </MethodChip>
                  <MethodChip active={setupMethods.includes('pin')} onClick={() => toggleSetupMethod('pin')}>
                    {isUrdu ? 'پن' : 'PIN'}
                  </MethodChip>
                  <MethodChip active={setupMethods.includes('google')} onClick={() => toggleSetupMethod('google')}>
                    {isUrdu ? 'گوگل' : 'Google'}
                  </MethodChip>
                </div>
              </div>

              {(setupMethods.includes('phone_password') || setupMethods.includes('pin')) && (
                <div className="space-y-4 rounded-2xl bg-muted/60 p-4">
                  <label className="block text-sm font-medium">
                    {isUrdu ? 'فون نمبر' : 'Phone number'}
                    <div className="mt-2 relative">
                      <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="+92300..." />
                    </div>
                  </label>

                  {setupMethods.includes('phone_password') && (
                    <label className="block text-sm font-medium">
                      {isUrdu ? 'پاس ورڈ' : 'Password'}
                      <div className="mt-2 relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder={isUrdu ? 'کم از کم 6 حروف' : 'At least 6 characters'} />
                      </div>
                    </label>
                  )}

                  {setupMethods.includes('pin') && (
                    <label className="block text-sm font-medium">
                      {isUrdu ? '4 ہندسوں کا پن' : '4-digit PIN'}
                      <div className="mt-2 relative">
                        <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-indigo-400" inputMode="numeric" placeholder="1234" />
                      </div>
                    </label>
                  )}
                </div>
              )}

              {setupMethods.includes('google') && (
                <div className="space-y-4 rounded-2xl bg-muted/60 p-4 border border-dashed border-border">
                  <p className="text-sm font-semibold">{isUrdu ? 'اختیاری گوگل لاگ ان' : 'Optional Google login'}</p>
                  <label className="block text-sm font-medium">
                    {isUrdu ? 'اجازت یافتہ گوگل ای میل' : 'Allowed Google email'}
                    <div className="mt-2 relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input value={googleEmail} onChange={(e) => setGoogleEmail(e.target.value)} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="owner@gmail.com" />
                    </div>
                  </label>
                  <label className="block text-sm font-medium">
                    {isUrdu ? 'گوگل کلائنٹ آئی ڈی' : 'Google client ID'}
                    <input value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder={isUrdu ? 'بعد میں شامل کر سکتے ہیں' : 'Add later if needed'} />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {isUrdu ? 'گوگل سائن ان صرف آن لائن حالت میں فعال ہوگا۔' : 'Google sign-in can be activated later when online.'}
                  </p>
                </div>
              )}

              <button onClick={handleSetup} disabled={busy} className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground transition hover:scale-[1.01] disabled:opacity-60">
                {busy ? (isUrdu ? 'محفوظ ہو رہا ہے...' : 'Saving...') : (isUrdu ? 'سیٹ اپ مکمل کریں' : 'Complete Setup')}
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {enabledMethods.includes('phone_password') && (
                  <MethodChip active={activeMethod === 'phone_password'} onClick={() => setActiveMethod('phone_password')}>
                    {isUrdu ? 'فون + پاس ورڈ' : 'Phone + Password'}
                  </MethodChip>
                )}
                {enabledMethods.includes('pin') && (
                  <MethodChip active={activeMethod === 'pin'} onClick={() => setActiveMethod('pin')}>
                    {isUrdu ? 'پن' : 'PIN'}
                  </MethodChip>
                )}
                {enabledMethods.includes('google') && (
                  <MethodChip active={activeMethod === 'google'} onClick={() => setActiveMethod('google')}>
                    {isUrdu ? 'گوگل' : 'Google'}
                  </MethodChip>
                )}
              </div>

              {activeMethod === 'phone_password' && (
                <div className="space-y-4 rounded-2xl bg-muted/60 p-4">
                  <label className="block text-sm font-medium">
                    {isUrdu ? 'فون نمبر' : 'Phone number'}
                    <div className="mt-2 relative">
                      <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder={settings.phoneNumber || '+92300...'} />
                    </div>
                  </label>
                  <label className="block text-sm font-medium">
                    {isUrdu ? 'پاس ورڈ' : 'Password'}
                    <div className="mt-2 relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder={isUrdu ? 'پاس ورڈ درج کریں' : 'Enter password'} />
                    </div>
                  </label>
                </div>
              )}

              {activeMethod === 'pin' && (
                <div className="space-y-4 rounded-2xl bg-muted/60 p-4">
                  <label className="block text-sm font-medium">
                    {isUrdu ? 'پن' : 'PIN'}
                    <div className="mt-2 relative">
                      <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-indigo-400" inputMode="numeric" placeholder="1234" />
                    </div>
                  </label>
                </div>
              )}

              {activeMethod === 'google' && (
                <div className="space-y-4 rounded-2xl bg-muted/60 p-4 border border-dashed border-border">
                  <p className="text-sm font-medium">{isUrdu ? 'گوگل ای میل سے لاگ ان' : 'Login with allowed Google email'}</p>
                  <label className="block text-sm font-medium">
                    {isUrdu ? 'گوگل ای میل' : 'Google email'}
                    <div className="mt-2 relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input value={googleEmail} onChange={(e) => setGoogleEmail(e.target.value)} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder={settings.googleAllowedEmail || 'owner@gmail.com'} />
                    </div>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {isUrdu ? 'یہ موڈ لوکل اجازت یافتہ ای میل پر مبنی ہے۔ مکمل OAuth کلائنٹ آئی ڈی کے ساتھ بعد میں فعال کیا جا سکتا ہے۔' : 'This mode uses the configured allowed email locally. Full OAuth can be activated later with a client ID.'}
                  </p>
                </div>
              )}

              <button onClick={handleLogin} disabled={busy} className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground transition hover:scale-[1.01] disabled:opacity-60">
                {busy ? (isUrdu ? 'لاگ ان ہو رہا ہے...' : 'Signing in...') : (isUrdu ? 'لاگ ان کریں' : 'Log In')}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
