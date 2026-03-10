import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, KeyRound, Eye, EyeOff, Scissors } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const spring = { type: 'spring' as const, stiffness: 300, damping: 28 };

type Tab = 'login' | 'signup';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isUrdu } = useLang();
  const { settings, loading, isAuthenticated, needsSetup, setupAuth, loginWithPassword, loginWithPin, loginWithGoogle } = useAuth();

  const [tab, setTab] = useState<Tab>(needsSetup ? 'signup' : 'login');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  // Signup fields
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [suPin, setSuPin] = useState('');

  // Login fields
  const [liEmail, setLiEmail] = useState(settings.phoneNumber || '');
  const [liPassword, setLiPassword] = useState('');
  const [liPin, setLiPin] = useState('');
  const [liMode, setLiMode] = useState<'password' | 'pin'>('password');

  const isConfigured = useMemo(() =>
    !needsSetup && settings.enabledMethods.length > 0,
    [needsSetup, settings.enabledMethods]
  );

  const hasPin = settings.enabledMethods.includes('pin');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center animate-pulse">
            <ShieldCheck size={28} />
          </div>
          <p className="font-semibold">{isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading Karachi Tailors...'}</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  const handleSignup = async () => {
    if (!suEmail.trim()) {
      toast.error(isUrdu ? 'ای میل / فون درج کریں' : 'Enter email or phone');
      return;
    }
    if (suPassword.length < 6) {
      toast.error(isUrdu ? 'پاس ورڈ کم از کم 6 حروف' : 'Password must be at least 6 characters');
      return;
    }
    if (suPassword !== suConfirm) {
      toast.error(isUrdu ? 'پاس ورڈ میل نہیں کھاتے' : 'Passwords do not match');
      return;
    }
    setBusy(true);
    const methods = suPin.length === 4
      ? ['phone_password', 'pin'] as const
      : ['phone_password'] as const;
    const ok = await setupAuth({
      phoneNumber: suEmail,
      password: suPassword,
      pin: suPin,
      enabledMethods: [...methods],
      googleAllowedEmail: suEmail,
      googleClientId: '',
    });
    setBusy(false);
    if (!ok) {
      toast.error(isUrdu ? 'رجسٹریشن ناکام' : 'Registration failed');
      return;
    }
    toast.success(isUrdu ? '✅ اکاؤنٹ بن گیا! خوش آمدید' : '✅ Account created! Welcome');
  };

  const handleLogin = async () => {
    setBusy(true);
    let ok = false;
    if (liMode === 'pin') {
      ok = await loginWithPin(liPin);
    } else {
      ok = await loginWithPassword(liEmail, liPassword);
    }
    setBusy(false);
    if (!ok) {
      toast.error(isUrdu ? 'لاگ ان ناکام — ای میل یا پاس ورڈ غلط ہے' : 'Login failed — incorrect credentials');
      return;
    }
    toast.success(isUrdu ? 'خوش آمدید! 👋' : 'Welcome back! 👋');
  };

  const handleGoogle = async () => {
    setBusy(true);
    // For signup: save the email as allowed google email first
    if (tab === 'signup' && suEmail) {
      await setupAuth({
        phoneNumber: suEmail,
        password: '',
        pin: '',
        enabledMethods: ['google'],
        googleAllowedEmail: suEmail,
        googleClientId: '',
      });
    }
    const emailToCheck = tab === 'signup' ? suEmail : (settings.googleAllowedEmail || liEmail);
    const ok = await loginWithGoogle(emailToCheck);
    setBusy(false);
    if (!ok) {
      toast.error(isUrdu ? 'گوگل لاگ ان ناکام' : 'Google sign-in failed — email not authorised');
      return;
    }
    toast.success(isUrdu ? 'گوگل سے لاگ ان کامیاب ✅' : 'Signed in with Google ✅');
  };

  const inputClass = "w-full rounded-xl border border-border bg-background py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'radial-gradient(ellipse at top, hsl(var(--primary)/0.12), transparent 60%), hsl(var(--background))' }}>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground mx-auto flex items-center justify-center shadow-lg mb-3">
            <Scissors size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight">{isUrdu ? 'کراچی ٹیلرز' : 'Karachi Tailors'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isUrdu ? 'آف لائن شاپ مینجمنٹ سسٹم' : 'Offline shop management'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          {/* Tabs — only shown when auth is already configured (login mode) */}
          {isConfigured && (
            <div className="flex border-b border-border">
              {(['login', 'signup'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-3.5 text-sm font-bold transition-colors ${tab === t
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {t === 'login'
                    ? (isUrdu ? 'لاگ ان' : 'Log In')
                    : (isUrdu ? 'نیا اکاؤنٹ' : 'Sign Up')
                  }
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: tab === 'login' ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === 'login' ? 16 : -16 }}
              transition={{ duration: 0.18 }}
              className="px-6 py-6 space-y-4"
            >
              {/* ─── SIGN UP ─── */}
              {(tab === 'signup' || needsSetup) && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      {isUrdu ? 'ای میل / فون نمبر *' : 'Email or Phone *'}
                    </label>
                    <input
                      value={suEmail}
                      onChange={e => setSuEmail(e.target.value)}
                      className={inputClass}
                      placeholder={isUrdu ? 'example@gmail.com یا 0300...' : 'example@gmail.com or 0300...'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      {isUrdu ? 'پاس ورڈ *' : 'Password *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={suPassword}
                        onChange={e => setSuPassword(e.target.value)}
                        className={inputClass + ' pr-11'}
                        placeholder={isUrdu ? 'کم از کم 6 حروف' : 'At least 6 characters'}
                      />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      {isUrdu ? 'پاس ورڈ تصدیق کریں *' : 'Confirm Password *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={suConfirm}
                        onChange={e => setSuConfirm(e.target.value)}
                        className={inputClass + ' pr-11'}
                        placeholder={isUrdu ? 'دوبارہ پاس ورڈ' : 'Re-enter password'}
                      />
                      <button type="button" onClick={() => setShowConfirm(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      {isUrdu ? '4 ہندسوں کا PIN (اختیاری)' : '4-digit PIN (optional)'}
                    </label>
                    <div className="relative">
                      <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={suPin}
                        onChange={e => setSuPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        inputMode="numeric"
                        className={inputClass + ' pl-10 tracking-[0.4em]'}
                        placeholder="1234"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSignup}
                    disabled={busy}
                    className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
                  >
                    {busy
                      ? (isUrdu ? 'بن رہا ہے...' : 'Creating account...')
                      : (isUrdu ? 'اکاؤنٹ بنائیں' : 'Create Account')}
                  </button>

                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">{isUrdu ? 'یا' : 'or'}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <button
                    onClick={handleGoogle}
                    disabled={busy}
                    className="w-full rounded-2xl border border-border bg-background py-3.5 text-sm font-semibold flex items-center justify-center gap-3 hover:bg-muted transition active:scale-[0.98] disabled:opacity-60"
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    {isUrdu ? 'گوگل سے رجسٹریشن' : 'Sign up with Google'}
                  </button>
                </>
              )}

              {/* ─── LOG IN ─── */}
              {tab === 'login' && !needsSetup && (
                <>
                  {/* Mode toggle */}
                  {hasPin && (
                    <div className="flex bg-muted rounded-xl p-1 gap-1">
                      {(['password', 'pin'] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => setLiMode(m)}
                          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${liMode === m ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
                            }`}
                        >
                          {m === 'password'
                            ? (isUrdu ? '🔐 پاس ورڈ' : '🔐 Password')
                            : (isUrdu ? '🔢 PIN' : '🔢 PIN')
                          }
                        </button>
                      ))}
                    </div>
                  )}

                  {liMode === 'password' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                          {isUrdu ? 'ای میل / فون' : 'Email or Phone'}
                        </label>
                        <input
                          value={liEmail}
                          onChange={e => setLiEmail(e.target.value)}
                          className={inputClass}
                          placeholder={settings.phoneNumber || (isUrdu ? 'ای میل یا فون' : 'Email or phone')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                          {isUrdu ? 'پاس ورڈ' : 'Password'}
                        </label>
                        <div className="relative">
                          <input
                            type={showPass ? 'text' : 'password'}
                            value={liPassword}
                            onChange={e => setLiPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            className={inputClass + ' pr-11'}
                            placeholder={isUrdu ? 'پاس ورڈ' : 'Password'}
                          />
                          <button type="button" onClick={() => setShowPass(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {liMode === 'pin' && (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        {isUrdu ? '4 ہندسوں کا PIN' : '4-digit PIN'}
                      </label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={liPin}
                          onChange={e => setLiPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          onKeyDown={e => e.key === 'Enter' && handleLogin()}
                          inputMode="numeric"
                          className={inputClass + ' pl-10 tracking-[0.5em] text-center text-lg'}
                          placeholder="••••"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleLogin}
                    disabled={busy}
                    className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
                  >
                    {busy
                      ? (isUrdu ? 'لاگ ان ہو رہا ہے...' : 'Signing in...')
                      : (isUrdu ? 'لاگ ان کریں' : 'Log In')}
                  </button>

                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">{isUrdu ? 'یا' : 'or'}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <button
                    onClick={handleGoogle}
                    disabled={busy}
                    className="w-full rounded-2xl border border-border bg-background py-3.5 text-sm font-semibold flex items-center justify-center gap-3 hover:bg-muted transition active:scale-[0.98] disabled:opacity-60"
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    {isUrdu ? 'گوگل سے لاگ ان' : 'Sign in with Google'}
                  </button>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {isUrdu ? '🔒 آف لائن · تمام ڈیٹا صرف آپ کے فون پر' : '🔒 Offline-first · All data stays on your device'}
        </p>
      </motion.div>
    </div>
  );
}
