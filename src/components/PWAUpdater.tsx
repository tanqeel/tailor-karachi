import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/contexts/LanguageContext';

export default function PWAUpdater() {
    const { isUrdu } = useLang();
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ', r);
        },
        onRegisterError(error) {
            console.error('SW registration error', error);
        }
    });

    useEffect(() => {
        if (needRefresh) {
            toast.info(isUrdu ? 'نئی اپ ڈیٹ دستیاب ہے!' : 'New Update Available!', {
                description: isUrdu ? 'تازہ ترین فیچرز حاصل کرنے کے لیے ابھی ریفریش کریں۔' : 'Refresh now to get the latest features.',
                duration: 10000,
                action: {
                    label: isUrdu ? 'ریفریش' : 'Refresh',
                    onClick: () => updateServiceWorker(true),
                },
                cancel: {
                    label: isUrdu ? 'بعد میں' : 'Later',
                    onClick: () => setNeedRefresh(false),
                },
            });
        }
    }, [needRefresh, updateServiceWorker, setNeedRefresh, isUrdu]);

    return null;
}
