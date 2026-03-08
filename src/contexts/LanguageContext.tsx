import React, { createContext, useContext, useState, useCallback } from 'react';

type Lang = 'en' | 'ur';

const translations: Record<string, Record<Lang, string>> = {
  'app.name': { en: 'Karachi Tailors', ur: 'کراچی ٹیلرز' },
  'nav.dashboard': { en: 'Dashboard', ur: 'ڈیش بورڈ' },
  'nav.customers': { en: 'Customers', ur: 'گاہک' },
  'nav.orders': { en: 'Orders', ur: 'آرڈرز' },
  'nav.workers': { en: 'Workers', ur: 'کاریگر' },
  'nav.portal': { en: 'Portal', ur: 'پورٹل' },
  'nav.measurements': { en: 'Measurements', ur: 'ناپ' },
  'nav.payments': { en: 'Payments', ur: 'ادائیگیاں' },
  'nav.ready': { en: 'Ready Suits', ur: 'تیار سوٹ' },
  'nav.reports': { en: 'Reports', ur: 'رپورٹس' },
  'nav.settings': { en: 'Settings', ur: 'ترتیبات' },
  'dashboard.today': { en: "Today's Orders", ur: 'آج کے آرڈرز' },
  'dashboard.urgent': { en: 'Urgent Deadlines', ur: 'فوری ڈیڈ لائنز' },
  'dashboard.pending': { en: 'Pending Payments', ur: 'بقایا ادائیگیاں' },
  'dashboard.workers': { en: 'Worker Activity', ur: 'کاریگر سرگرمی' },
  'common.search': { en: 'Search by name, ID or phone...', ur: '...نام، آئی ڈی یا فون سے تلاش کریں' },
  'common.add': { en: 'Add New', ur: 'نیا شامل کریں' },
  'common.save': { en: 'Save', ur: 'محفوظ کریں' },
  'common.cancel': { en: 'Cancel', ur: 'منسوخ' },
  'common.delete': { en: 'Delete', ur: 'حذف کریں' },
  'common.edit': { en: 'Edit', ur: 'ترمیم' },
  'common.back': { en: 'Back', ur: 'واپس' },
  'common.name': { en: 'Name', ur: 'نام' },
  'common.phone': { en: 'Phone', ur: 'فون' },
  'common.amount': { en: 'Amount', ur: 'رقم' },
  'common.date': { en: 'Date', ur: 'تاریخ' },
  'common.status': { en: 'Status', ur: 'حالت' },
  'common.total': { en: 'Total', ur: 'کل' },
  'common.advance': { en: 'Advance', ur: 'پیشگی' },
  'common.balance': { en: 'Balance', ur: 'بقایا' },
  'common.paid': { en: 'Paid', ur: 'ادا شدہ' },
  'common.deadline': { en: 'Deadline', ur: 'ڈیڈ لائن' },
  'common.export': { en: 'Export Backup', ur: 'بیک اپ' },
  'common.import': { en: 'Restore', ur: 'بحال کریں' },
  'customer.id': { en: 'Customer ID', ur: 'گاہک آئی ڈی' },
  'measurements.title': { en: 'Measurements', ur: 'ناپ' },
  'measurements.kameez': { en: 'Kameez', ur: 'قمیض' },
  'measurements.shalwar': { en: 'Shalwar', ur: 'شلوار' },
  'measurements.length': { en: 'Length', ur: 'لمبائی' },
  'measurements.chest': { en: 'Chest', ur: 'سینہ' },
  'measurements.shoulder': { en: 'Shoulder', ur: 'کندھا' },
  'measurements.sleeve': { en: 'Sleeve', ur: 'آستین' },
  'measurements.collar': { en: 'Collar', ur: 'کالر' },
  'measurements.daman': { en: 'Daman', ur: 'دامن' },
  'measurements.waist': { en: 'Waist', ur: 'کمر' },
  'measurements.hip': { en: 'Hip', ur: 'ہپ' },
  'measurements.pancha': { en: 'Pancha', ur: 'پانچا' },
  'order.new': { en: 'New Order', ur: 'نیا آرڈر' },
  'order.suits': { en: 'Suits', ur: 'سوٹ' },
  'order.delivery': { en: 'Delivery Date', ur: 'تاریخ حوالگی' },
  'status.received': { en: 'Received', ur: 'موصول' },
  'status.cutting': { en: 'Cutting', ur: 'کٹنگ' },
  'status.stitching': { en: 'Stitching', ur: 'سلائی' },
  'status.finishing': { en: 'Finishing', ur: 'فنشنگ' },
  'status.packed': { en: 'Packed', ur: 'پیکڈ' },
  'status.ready': { en: 'Ready', ur: 'تیار' },
  'status.delivered': { en: 'Delivered', ur: 'حوالے' },
  'worker.name': { en: 'Worker Name', ur: 'کاریگر کا نام' },
  'worker.rate.kameez': { en: 'Kameez Rate', ur: 'قمیض ریٹ' },
  'worker.rate.shalwar': { en: 'Shalwar Rate', ur: 'شلوار ریٹ' },
  'worker.rate.suit': { en: 'Full Suit Rate', ur: 'فل سوٹ ریٹ' },
  'worker.rate.design': { en: 'Design Rate', ur: 'ڈیزائن ریٹ' },
  'worker.advances': { en: 'Advances', ur: 'پیشگی' },
  'worker.hisaab': { en: 'Weekly Hisaab', ur: 'ہفتہ وار حساب' },
  'portal.welcome': { en: 'Welcome to Karachi Tailors', ur: 'کراچی ٹیلرز میں خوش آمدید' },
  'portal.designs': { en: 'Our Designs', ur: 'ہمارے ڈیزائنز' },
  'portal.prices': { en: 'Prices', ur: 'قیمتیں' },
  'portal.track': { en: 'Track Order', ur: 'آرڈر ٹریک کریں' },
  'portal.contact': { en: 'Contact Us', ur: 'رابطہ کریں' },
};

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
  isUrdu: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('kt-lang') as Lang) || 'ur');

  // Set dir and font on html element based on language
  useEffect(() => {
    const html = document.documentElement;
    if (lang === 'ur') {
      html.setAttribute('dir', 'rtl');
      html.classList.add('font-urdu');
      html.style.fontFamily = "'Noto Nastaliq Urdu', serif";
    } else {
      html.setAttribute('dir', 'ltr');
      html.classList.remove('font-urdu');
      html.style.fontFamily = "'Inter', sans-serif";
    }
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'ur' : 'en';
      localStorage.setItem('kt-lang', next);
      return next;
    });
  }, []);

  const t = useCallback((key: string) => translations[key]?.[lang] || key, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, isUrdu: lang === 'ur' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
};
