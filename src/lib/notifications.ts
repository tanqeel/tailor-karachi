// Browser Notification + WhatsApp link utilities

const NOTIFICATION_PERMISSION_KEY = 'kt-notification-permission';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendBrowserNotification(title: string, body: string, onClick?: () => void) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const n = new Notification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: title, // prevents duplicate notifications
  });
  if (onClick) n.onclick = () => { window.focus(); onClick(); };
}

// WhatsApp message link generator
export function getWhatsAppLink(phone: string, message: string): string {
  // Normalize Pakistani phone number
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '92' + cleaned.slice(1);
  if (!cleaned.startsWith('92')) cleaned = '92' + cleaned;
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

// Pre-built WhatsApp messages
export function getDeadlineReminderMessage(customerName: string, deadline: string, lang: 'en' | 'ur'): string {
  const dl = new Date(deadline).toLocaleDateString();
  if (lang === 'ur') {
    return `السلام علیکم ${customerName}، آپ کا آرڈر ${dl} تک تیار ہونا ہے۔ شکریہ - کراچی ٹیلرز`;
  }
  return `Assalam o Alaikum ${customerName}, your order is due by ${dl}. Thank you - Karachi Tailors`;
}

export function getReadyForPickupMessage(customerName: string, lang: 'en' | 'ur'): string {
  if (lang === 'ur') {
    return `السلام علیکم ${customerName}، آپ کا سوٹ تیار ہے! براہ کرم دکان سے لے لیں۔ شکریہ - کراچی ٹیلرز`;
  }
  return `Assalam o Alaikum ${customerName}, your suit is ready for pickup! Please visit the shop. Thank you - Karachi Tailors`;
}

export function getPaymentReminderMessage(customerName: string, balance: number, lang: 'en' | 'ur'): string {
  if (lang === 'ur') {
    return `السلام علیکم ${customerName}، آپ کی بقایا رقم Rs ${balance.toLocaleString()} ہے۔ براہ کرم ادائیگی کریں۔ شکریہ - کراچی ٹیلرز`;
  }
  return `Assalam o Alaikum ${customerName}, your pending balance is Rs ${balance.toLocaleString()}. Please arrange payment. Thank you - Karachi Tailors`;
}
