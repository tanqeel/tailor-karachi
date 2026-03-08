import { Search, Mic } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder }: Props) {
  const { t, isUrdu } = useLang();
  const [listening, setListening] = useState(false);

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = isUrdu ? 'ur-PK' : 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      onChange(e.results[0][0].transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || t('common.search')}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target"
          dir={isUrdu ? 'rtl' : 'ltr'}
        />
      </div>
      <button
        onClick={startVoice}
        className={`p-3 rounded-xl border border-border touch-target transition-colors ${
          listening ? 'bg-destructive text-destructive-foreground animate-pulse-soft' : 'bg-card text-muted-foreground hover:text-primary'
        }`}
      >
        <Mic size={20} />
      </button>
    </div>
  );
}
