import { useLang } from '@/contexts/LanguageContext';
import { useVoice } from '@/hooks/useVoice';
import { parseVoiceCommand } from '@/lib/voiceCommands';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mic, MicOff } from 'lucide-react';
import HamburgerMenu from './HamburgerMenu';

export default function TopBar() {
  const { isUrdu } = useLang();
  const navigate = useNavigate();

  const { listening, toggle, isSupported } = useVoice({
    onCommand: (transcript) => {
      const cmd = parseVoiceCommand(transcript);
      if ((cmd.type === 'navigate' || cmd.type === 'search') && cmd.route) {
        toast.success(`🎤 "${transcript}"`);
        navigate(cmd.route);
      } else {
        toast.info(`🎤 "${transcript}"`);
      }
    },
  });

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        {/* Shop name */}
        <h1 className="text-lg font-black tracking-tight select-none">
          {isUrdu ? 'کراچی ٹیلرز' : 'Karachi Tailors'}
        </h1>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {isSupported && (
            <button
              onClick={toggle}
              className={`p-2 rounded-lg touch-target transition-all ${listening
                  ? 'bg-destructive text-destructive-foreground animate-pulse'
                  : 'hover:bg-primary/80'
                }`}
              title={isUrdu ? 'وائس کمانڈ' : 'Voice Command'}
            >
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
          <HamburgerMenu />
        </div>
      </div>

      {listening && (
        <div className="bg-destructive/90 text-destructive-foreground text-center py-1.5 text-xs font-semibold animate-pulse">
          🎤 {isUrdu ? 'بولیں... "احمد کا سوٹ دکھاؤ"' : 'Speak... "show Ahmed\'s suit"'}
        </div>
      )}
    </header>
  );
}
