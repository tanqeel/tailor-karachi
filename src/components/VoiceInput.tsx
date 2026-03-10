import { Mic, MicOff } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { useLang } from '@/contexts/LanguageContext';
import { useCallback } from 'react';

interface VoiceInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
  inputMode?: string;
  rows?: number;
  multiline?: boolean;
  dir?: string;
  readOnly?: boolean;
  append?: boolean; // append to existing value instead of replacing
}

export default function VoiceInput({
  value, onChange, placeholder, className = '', type, inputMode, rows, multiline, dir, readOnly, append = false
}: VoiceInputProps) {
  const { isUrdu } = useLang();

  const handleResult = useCallback((transcript: string) => {
    if (append && value) {
      onChange(value + ' ' + transcript);
    } else {
      onChange(transcript);
    }
  }, [append, value, onChange]);

  const { listening, transcript, toggle, isSupported } = useVoice({
    onResult: handleResult,
  });

  const baseClass = `w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target ${isSupported ? 'pr-11' : ''} ${className}`;

  return (
    <div className="relative">
      {multiline ? (
        <textarea
          value={listening && transcript ? transcript : value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${baseClass} resize-none`}
          rows={rows || 2}
          dir={dir || (isUrdu ? 'rtl' : 'ltr')}
          readOnly={readOnly || listening}
        />
      ) : (
        <input
          type={type || 'text'}
          inputMode={inputMode as React.InputHTMLAttributes<HTMLInputElement>['inputMode']}
          value={listening && transcript ? transcript : value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
          dir={dir || (isUrdu ? 'rtl' : 'ltr')}
          readOnly={readOnly || listening}
        />
      )}
      {isSupported && (
        <button
          type="button"
          onClick={toggle}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${listening
              ? 'bg-destructive text-destructive-foreground animate-pulse-soft'
              : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
            }`}
          title={listening ? (isUrdu ? 'بند کریں' : 'Stop') : (isUrdu ? '🎤 بولیں' : '🎤 Speak')}
        >
          {listening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      )}
    </div>
  );
}
