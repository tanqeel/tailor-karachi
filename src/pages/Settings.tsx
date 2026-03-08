import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { exportBackup } from '@/lib/store';
import { listBackups, restoreBackup } from '@/lib/autoBackup';
import type { AppData } from '@/lib/store';
import { Settings2, Download, Upload, Languages, Database, Trash2, RotateCcw } from 'lucide-react';
import { useRef } from 'react';

export default function Settings() {
  const { lang, toggleLang, isUrdu } = useLang();
  const { data, setData } = useData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showBackups, setShowBackups] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const backups = listBackups();

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported: AppData = JSON.parse(reader.result as string);
        if (imported.customers && imported.orders && imported.workers) {
          setData(imported);
        }
      } catch {}
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRestore = (key: string) => {
    const restored = restoreBackup(key);
    if (restored) {
      setData(restored);
      setShowBackups(false);
    }
  };

  const handleClearAll = () => {
    setData({ customers: [], orders: [], workers: [] });
    setShowClear(false);
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2 mb-1">
        <Settings2 size={22} className="text-primary" />
        <h2 className="text-lg font-bold">{isUrdu ? 'ترتیبات' : 'Settings'}</h2>
      </div>

      {/* Language */}
      <button onClick={toggleLang} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-primary/10">
          <Languages size={22} className="text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{isUrdu ? 'زبان تبدیل کریں' : 'Change Language'}</p>
          <p className="text-xs text-muted-foreground">{lang === 'en' ? 'English → اردو' : 'اردو → English'}</p>
        </div>
      </button>

      {/* Export */}
      <button onClick={() => exportBackup(data)} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-success/10">
          <Download size={22} className="text-success" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{isUrdu ? 'بیک اپ ڈاؤنلوڈ' : 'Export Backup'}</p>
          <p className="text-xs text-muted-foreground">{isUrdu ? 'JSON فائل میں ڈیٹا محفوظ کریں' : 'Save data as JSON file'}</p>
        </div>
      </button>

      {/* Import */}
      <button onClick={() => fileRef.current?.click()} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-info/10">
          <Upload size={22} className="text-info" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{isUrdu ? 'بیک اپ بحال کریں' : 'Import Backup'}</p>
          <p className="text-xs text-muted-foreground">{isUrdu ? 'JSON فائل سے ڈیٹا بحال کریں' : 'Restore data from JSON file'}</p>
        </div>
      </button>
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {/* Auto Backups */}
      <button onClick={() => setShowBackups(!showBackups)} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-warning/10">
          <Database size={22} className="text-warning" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{isUrdu ? 'خودکار بیک اپ' : 'Auto Backups'}</p>
          <p className="text-xs text-muted-foreground">{backups.length} {isUrdu ? 'بیک اپ محفوظ' : 'backups saved'}</p>
        </div>
      </button>

      {showBackups && backups.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-2">
          {backups.map(b => (
            <div key={b.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{b.date}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(b.timestamp).toLocaleString()}</p>
              </div>
              <button onClick={() => handleRestore(b.key)} className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold touch-target active:scale-95">
                <RotateCcw size={14} className="inline mr-1" /> {isUrdu ? 'بحال' : 'Restore'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Clear All Data */}
      <button onClick={() => setShowClear(true)} className="w-full bg-card rounded-xl p-4 border border-destructive/30 flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-destructive/10">
          <Trash2 size={22} className="text-destructive" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm text-destructive">{isUrdu ? 'تمام ڈیٹا صاف کریں' : 'Clear All Data'}</p>
          <p className="text-xs text-muted-foreground">{isUrdu ? 'تمام گاہک، آرڈرز اور کاریگر حذف ہوں گے' : 'Delete all customers, orders and workers'}</p>
        </div>
      </button>

      {/* Data Stats */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-semibold text-sm mb-3">{isUrdu ? 'ڈیٹا' : 'Data Summary'}</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">{isUrdu ? 'گاہک' : 'Customers'}</span><span className="font-bold">{data.customers.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{isUrdu ? 'آرڈرز' : 'Orders'}</span><span className="font-bold">{data.orders.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{isUrdu ? 'کاریگر' : 'Workers'}</span><span className="font-bold">{data.workers.length}</span></div>
        </div>
      </div>

      {/* Clear Confirmation */}
      {showClear && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4" onClick={() => setShowClear(false)}>
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-center">{isUrdu ? '⚠️ تصدیق' : '⚠️ Confirm'}</h3>
            <p className="text-sm text-center text-muted-foreground">{isUrdu ? 'کیا آپ واقعی تمام ڈیٹا حذف کرنا چاہتے ہیں؟ یہ واپس نہیں ہو سکتا۔' : 'Are you sure you want to delete all data? This cannot be undone.'}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClear(false)} className="flex-1 py-3 rounded-xl border border-border font-semibold touch-target active:scale-95">
                {isUrdu ? 'منسوخ' : 'Cancel'}
              </button>
              <button onClick={handleClearAll} className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold touch-target active:scale-95">
                {isUrdu ? 'حذف کریں' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
