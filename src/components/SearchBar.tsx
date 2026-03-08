import { Search, Mic, MicOff } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useVoice } from '@/hooks/useVoice';
import { parseVoiceCommand } from '@/lib/voiceCommands';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { toast } from 'sonner';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder }: Props) {
  const { t, isUrdu } = useLang();
  const navigate = useNavigate();

  const handleVoiceResult = useCallback((transcript: string) => {
    const cmd = parseVoiceCommand(transcript);

    if (cmd.type === 'navigate' && cmd.route) {
      toast.success(isUrdu ? `"${transcript}" — جا رہے ہیں...` : `"${transcript}" — Navigating...`);
      navigate(cmd.route);
      if (cmd.searchTerm) {
        // Small delay to let page mount before setting search
        setTimeout(() => onChange(cmd.searchTerm!), 150);
      }
    } else if (cmd.type === 'search') {
      if (cmd.route) {
        toast.success(isUrdu ? `"${transcript}" — تلاش کر رہے ہیں...` : `"${transcript}" — Searching...`);
        navigate(cmd.route);
        setTimeout(() => onChange(cmd.searchTerm || transcript), 150);
      } else {
        onChange(cmd.searchTerm || transcript);
      }
    } else {
      // Fallback: use as search text
      onChange(transcript);
    }
  }, [isUrdu, navigate, onChange]);

  const { listening, transcript, toggle, isSupported } = useVoice({
    onCommand: handleVoiceResult,
  });

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={listening && transcript ? transcript : value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || t('common.search')}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target"
          dir={isUrdu ? 'rtl' : 'ltr'}
          readOnly={listening}
        />
        {listening && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-destructive font-semibold animate-pulse">
            {isUrdu ? '🎤 سن رہے ہیں...' : '🎤 Listening...'}
          </span>
        )}
      </div>
      {isSupported && (
        <button
          onClick={toggle}
          className={`p-3 rounded-xl border border-border touch-target transition-all ${
            listening
              ? 'bg-destructive text-destructive-foreground animate-pulse-soft shadow-lg shadow-destructive/30'
              : 'bg-card text-muted-foreground hover:text-primary hover:border-primary/30'
          }`}
          title={listening ? (isUrdu ? 'بند کریں' : 'Stop') : (isUrdu ? 'بولیں' : 'Voice Search')}
        >
          {listening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
      )}
    </div>
  );
}
