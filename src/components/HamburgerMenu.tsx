import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { exportBackup } from '@/lib/store';
import { validateBackupData } from '@/lib/validation';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    X, Sun, Moon, Monitor, Languages, Download, Upload,
    Settings2, Store, Palette, LogOut, RefreshCw, Check
} from 'lucide-react';

const ACCENT_KEY = 'kt-custom-accent';

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function applyAccentColor(hex: string) {
    const hsl = hexToHsl(hex);
    if (!hsl) return;
    const root = document.documentElement;
    root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    root.style.setProperty('--primary-foreground', hsl.l > 55 ? '0 0% 10%' : '0 0% 100%');
    localStorage.setItem(ACCENT_KEY, hex);
}

export function loadSavedAccent() {
    const saved = localStorage.getItem(ACCENT_KEY);
    if (saved) applyAccentColor(saved);
}

const presets = [
    { color: '#1a6b4a', label: 'Forest Green' },
    { color: '#1d4ed8', label: 'Royal Blue' },
    { color: '#7c3aed', label: 'Violet' },
    { color: '#b45309', label: 'Amber' },
    { color: '#dc2626', label: 'Red' },
    { color: '#0891b2', label: 'Teal' },
    { color: '#be185d', label: 'Pink' },
    { color: '#374151', label: 'Slate' },
];

const spring = { type: 'spring' as const, stiffness: 320, damping: 30 };

export default function HamburgerMenu() {
    const [open, setOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const { toggleLang, lang, isUrdu } = useLang();
    const { data, setData } = useData();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const fileRef = useRef<HTMLInputElement>(null);
    const [accent, setAccent] = useState(localStorage.getItem(ACCENT_KEY) || '#1a6b4a');

    useEffect(() => { loadSavedAccent(); }, []);

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result as string);
                const result = validateBackupData(parsed);
                if (result.valid && result.data) {
                    setData(result.data);
                    toast.success(isUrdu ? 'ڈیٹا درآمد ہو گیا!' : 'Data imported!');
                } else {
                    toast.error(isUrdu ? `غلط فائل: ${result.error}` : `Invalid: ${result.error}`);
                }
            } catch {
                toast.error(isUrdu ? 'فائل خرابی' : 'Parse error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
        setOpen(false);
    };

    const close = () => setOpen(false);

    const go = (path: string) => { navigate(path); close(); };

    const themeOptions = [
        { value: 'system', icon: Monitor, label: isUrdu ? 'سسٹم' : 'System' },
        { value: 'light', icon: Sun, label: isUrdu ? 'روشن' : 'Light' },
        { value: 'dark', icon: Moon, label: isUrdu ? 'تاریک' : 'Dark' },
    ];

    return (
        <>
            {/* Trigger button — rendered inside TopBar */}
            <button
                id="hamburger-trigger"
                onClick={() => setOpen(true)}
                className="p-2 rounded-lg hover:bg-primary/80 touch-target flex flex-col gap-[5px] items-center justify-center"
                aria-label="Menu"
            >
                <span className="w-5 h-0.5 bg-primary-foreground rounded-full" />
                <span className="w-5 h-0.5 bg-primary-foreground rounded-full" />
                <span className="w-5 h-0.5 bg-primary-foreground rounded-full" />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                            onClick={close}
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={spring}
                            className="fixed top-0 right-0 bottom-0 z-50 w-[85%] max-w-sm bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-primary text-primary-foreground">
                                <h2 className="font-bold text-base">{isUrdu ? 'ترتیبات' : 'Settings'}</h2>
                                <button onClick={close} className="p-1.5 rounded-lg hover:bg-primary/80">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                                {/* Theme */}
                                <section>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                        {isUrdu ? 'تھیم' : 'Theme'}
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {themeOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setTheme(opt.value)}
                                                className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-colors text-xs font-semibold ${theme === opt.value
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                                                    }`}
                                            >
                                                <opt.icon size={18} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Custom Accent Color */}
                                <section>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Palette size={13} /> {isUrdu ? 'رنگ تھیم' : 'Accent Color'}
                                    </p>
                                    {/* Preset swatches */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {presets.map(p => (
                                            <button
                                                key={p.color}
                                                onClick={() => { setAccent(p.color); applyAccentColor(p.color); }}
                                                title={p.label}
                                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${accent === p.color ? 'border-foreground scale-110' : 'border-transparent'
                                                    }`}
                                                style={{ backgroundColor: p.color }}
                                            />
                                        ))}
                                    </div>
                                    {/* Custom picker */}
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 cursor-pointer flex-1 px-3 py-2.5 rounded-xl border border-border bg-background hover:bg-muted transition">
                                            <span
                                                className="w-5 h-5 rounded-full border border-border"
                                                style={{ backgroundColor: accent }}
                                            />
                                            <span className="text-sm font-medium flex-1">{isUrdu ? 'کسٹم رنگ' : 'Custom color'}</span>
                                            <input
                                                type="color"
                                                value={accent}
                                                onChange={e => { setAccent(e.target.value); applyAccentColor(e.target.value); }}
                                                className="w-0 h-0 opacity-0 absolute"
                                            />
                                            <span className="text-xs text-muted-foreground font-mono">{accent}</span>
                                        </label>
                                    </div>
                                </section>

                                {/* Language */}
                                <section>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Languages size={13} /> {isUrdu ? 'زبان' : 'Language'}
                                    </p>
                                    <button
                                        onClick={toggleLang}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted transition"
                                    >
                                        <span className="text-sm font-semibold">
                                            {lang === 'en' ? '🇵🇰 اردو میں بدلیں' : '🇺🇸 Switch to English'}
                                        </span>
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                            {lang === 'en' ? 'اردو' : 'EN'}
                                        </span>
                                    </button>
                                </section>

                                {/* Data */}
                                <section>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Download size={13} /> {isUrdu ? 'ڈیٹا' : 'Data'}
                                    </p>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => { exportBackup(data); close(); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted transition text-sm font-medium"
                                        >
                                            <Download size={16} className="text-primary" />
                                            {isUrdu ? 'ڈیٹا ایکسپورٹ کریں' : 'Export Backup'}
                                        </button>
                                        <button
                                            onClick={() => fileRef.current?.click()}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted transition text-sm font-medium"
                                        >
                                            <Upload size={16} className="text-primary" />
                                            {isUrdu ? 'ڈیٹا امپورٹ کریں' : 'Import Backup'}
                                        </button>
                                        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                                    </div>
                                </section>

                                {/* Quick Navigation */}
                                <section>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                        {isUrdu ? 'ناوی گیشن' : 'Navigate'}
                                    </p>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => go('/settings')}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted transition text-sm font-medium"
                                        >
                                            <Settings2 size={16} className="text-primary" />
                                            {isUrdu ? 'ترتیبات' : 'Settings'}
                                        </button>
                                        <button
                                            onClick={() => go('/portal')}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted transition text-sm font-medium"
                                        >
                                            <Store size={16} className="text-primary" />
                                            {isUrdu ? 'کسٹمر پورٹل' : 'Customer Portal'}
                                        </button>
                                    </div>
                                </section>

                                {/* Update */}
                                <section>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <RefreshCw size={13} /> {isUrdu ? 'اپ ڈیٹ' : 'Update'}
                                    </p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <RefreshCw size={16} className="text-primary" />
                                            <span className="text-sm font-medium">{isUrdu ? 'اپ ڈیٹ چیک کریں' : 'Check for Update'}</span>
                                        </div>
                                    </button>
                                </section>
                            </div>

                            {/* Logout footer */}
                            <div className="p-4 border-t border-border">
                                <button
                                    onClick={() => { logout(); close(); }}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm hover:bg-destructive/20 transition"
                                >
                                    <LogOut size={16} />
                                    {isUrdu ? 'لاگ آؤٹ' : 'Log Out'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
