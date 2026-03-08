import { useLang } from '@/contexts/LanguageContext';
import { Languages, Download, Upload } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { exportBackup } from '@/lib/store';
import { useRef } from 'react';
import type { AppData } from '@/lib/store';

export default function TopBar() {
  const { t, toggleLang, lang } = useLang();
  const { data, setData } = useData();
  const fileRef = useRef<HTMLInputElement>(null);

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

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <h1 className="text-lg font-bold tracking-tight">{t('app.name')}</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => exportBackup(data)} className="p-2 rounded-lg hover:bg-primary/80 touch-target" title={t('common.export')}>
            <Download size={18} />
          </button>
          <button onClick={() => fileRef.current?.click()} className="p-2 rounded-lg hover:bg-primary/80 touch-target" title={t('common.import')}>
            <Upload size={18} />
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button onClick={toggleLang} className="p-2 rounded-lg hover:bg-primary/80 touch-target flex items-center gap-1 text-sm font-semibold">
            <Languages size={18} />
            {lang === 'en' ? 'اردو' : 'EN'}
          </button>
        </div>
      </div>
    </header>
  );
}
