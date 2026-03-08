import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const { isUrdu } = useLang();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-20 left-2 right-2 max-w-lg mx-auto z-50 bg-primary text-primary-foreground rounded-xl shadow-lg p-4 flex items-center gap-3 animate-in slide-in-from-bottom">
      <Download size={24} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">
          {isUrdu ? 'ایپ انسٹال کریں' : 'Install App'}
        </p>
        <p className="text-xs opacity-80">
          {isUrdu ? 'ہوم اسکرین پر شامل کریں، آف لائن استعمال کریں' : 'Add to home screen, use offline'}
        </p>
      </div>
      <button onClick={handleInstall} className="bg-primary-foreground text-primary px-3 py-1.5 rounded-lg text-sm font-semibold shrink-0">
        {isUrdu ? 'انسٹال' : 'Install'}
      </button>
      <button onClick={() => setDismissed(true)} className="p-1 opacity-70 hover:opacity-100">
        <X size={18} />
      </button>
    </div>
  );
}
