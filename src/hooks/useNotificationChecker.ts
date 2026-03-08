import { useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { useLang } from '@/contexts/LanguageContext';
import { getDeadlineStatus } from '@/lib/store';
import { requestNotificationPermission, sendBrowserNotification } from '@/lib/notifications';
import { runAutoBackupCheck } from '@/lib/autoBackup';

const CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour
const NOTIFIED_KEY = 'kt-notified-orders';

function getNotifiedSet(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]'));
  } catch { return new Set(); }
}

function markNotified(ids: string[]) {
  const existing = getNotifiedSet();
  ids.forEach(id => existing.add(id));
  // Keep only last 200 entries
  const arr = [...existing].slice(-200);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(arr));
}

export function useNotificationChecker() {
  const { data } = useData();
  const { lang } = useLang();
  const initialRef = useRef(false);

  useEffect(() => {
    // Request permission on mount
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const check = () => {
      // Auto backup check
      runAutoBackupCheck(data, lang);

      // Deadline notifications
      const notified = getNotifiedSet();
      const newNotifications: string[] = [];

      for (const order of data.orders) {
        if (order.deliveredAt) continue;
        const customer = data.customers.find(c => c.id === order.customerId);
        if (!customer) continue;

        const dlStatus = getDeadlineStatus(order.deadline);
        const notifKey = `${order.id}-${dlStatus}`;

        // Deadline alerts
        if ((dlStatus === 'overdue' || dlStatus === 'urgent') && !notified.has(notifKey)) {
          const title = dlStatus === 'overdue'
            ? (lang === 'ur' ? '⚠️ ڈیڈ لائن گزر گئی!' : '⚠️ Deadline Overdue!')
            : (lang === 'ur' ? '🔥 آج ڈیڈ لائن ہے!' : '🔥 Deadline Today!');
          const body = lang === 'ur'
            ? `${customer.name} کا آرڈر - ${new Date(order.deadline).toLocaleDateString()}`
            : `${customer.name}'s order - Due ${new Date(order.deadline).toLocaleDateString()}`;
          sendBrowserNotification(title, body);
          newNotifications.push(notifKey);
        }

        // Ready for pickup alerts
        const allReady = order.suits.every(s => s.status === 'ready' || s.status === 'delivered');
        const readyKey = `${order.id}-ready`;
        if (allReady && !order.deliveredAt && !notified.has(readyKey)) {
          sendBrowserNotification(
            lang === 'ur' ? '✅ سوٹ تیار ہے!' : '✅ Suit Ready for Pickup!',
            lang === 'ur' ? `${customer.name} کا سوٹ تیار ہے` : `${customer.name}'s suit is ready`
          );
          newNotifications.push(readyKey);
        }
      }

      if (newNotifications.length > 0) markNotified(newNotifications);
    };

    // Run immediately on first load, then on interval
    if (!initialRef.current) {
      initialRef.current = true;
      // Small delay to let the page settle
      setTimeout(check, 2000);
    }

    const interval = setInterval(check, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [data, lang]);
}
