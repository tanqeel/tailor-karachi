import { useLang } from '@/contexts/LanguageContext';
import { Languages, Download, Upload, Mic, MicOff } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { exportBackup } from '@/lib/store';
import { useRef } from 'react';
import type { AppData } from '@/lib/store';
import { useVoice } from '@/hooks/useVoice';
import { parseVoiceCommand } from '@/lib/voiceCommands';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function TopBar() {
  const { t, toggleLang, lang, isUrdu } = useLang();
  const { data, setData } = useData();
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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

  const { listening, toggle, isSupported } = useVoice({
    onCommand: (transcript) => {
      const cmd = parseVoiceCommand(transcript);
      if (cmd.type === 'navigate' && cmd.route) {
        toast.success(isUrdu ? `🎤 "${transcript}"` : `🎤 "${transcript}"`);
        navigate(cmd.route);
      } else if (cmd.type === 'search' && cmd.route) {
        toast.success(isUrdu ? `🎤 "${transcript}"` : `🎤 "${transcript}"`);
        navigate(cmd.route);
      } else {
        toast.info(isUrdu ? `🎤 "${transcript}"` : `🎤 "${transcript}"`);
      }
    },
  });

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <h1 className="text-lg font-bold tracking-tight">{t('app.name')}</h1>
        <div className="flex items-center gap-1">
          {isSupported && (
            <button
              onClick={toggle}
              className={`p-2 rounded-lg touch-target transition-all ${
                listening
                  ? 'bg-destructive text-destructive-foreground animate-pulse-soft'
                  : 'hover:bg-primary/80'
              }`}
              title={isUrdu ? 'وائس کمانڈ' : 'Voice Command'}
            >
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
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
      {listening && (
        <div className="bg-destructive/90 text-destructive-foreground text-center py-1.5 text-xs font-semibold animate-pulse">
          🎤 {isUrdu ? 'بولیں... "Ahmed ka suit dikhao"' : 'Speak... "Ahmed ka suit dikhao"'}
        </div>
      )}
    </header>
  );
}
