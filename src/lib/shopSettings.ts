// Shop settings stored in localStorage
const SHOP_KEY = 'karachi-tailors-shop';
const GALLERY_KEY = 'karachi-tailors-gallery';
const REVIEWS_KEY = 'karachi-tailors-reviews';

export interface ShopSettings {
  name: string;
  phone: string;
  address: string;
  hours: string;
  tagline: string;
  prices: PriceItem[];
}

export interface PriceItem {
  id: string;
  nameEn: string;
  nameUr: string;
  price: string;
  duration: string;
}

export interface GalleryImage {
  id: string;
  dataUrl: string; // base64
  nameEn: string;
  nameUr: string;
  price: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number; // 1-5
  text: string;
  date: string;
}

const defaultPrices: PriceItem[] = [
  { id: '1', nameEn: 'Simple Shalwar Kameez', nameUr: 'سادہ شلوار قمیض', price: 'Rs 2,500', duration: '3-5 days' },
  { id: '2', nameEn: 'Design Shalwar Kameez', nameUr: 'ڈیزائن شلوار قمیض', price: 'Rs 3,500', duration: '5-7 days' },
  { id: '3', nameEn: 'Waistcoat', nameUr: 'واسکٹ', price: 'Rs 2,000', duration: '3-5 days' },
  { id: '4', nameEn: 'Kurta Pajama', nameUr: 'کرتا پاجامہ', price: 'Rs 3,000', duration: '5-7 days' },
  { id: '5', nameEn: 'Sherwani', nameUr: 'شیروانی', price: 'Rs 15,000+', duration: '10-15 days' },
  { id: '6', nameEn: 'Pant Coat', nameUr: 'پینٹ کوٹ', price: 'Rs 8,000+', duration: '7-10 days' },
];

const defaultSettings: ShopSettings = {
  name: 'Karachi Tailors',
  phone: '+923001234567',
  address: 'Shop #12, Tariq Road, Karachi',
  hours: 'Everyday 7 AM to 7 PM',
  tagline: 'Quality Tailoring Since 1995',
  prices: defaultPrices,
};

export function loadShopSettings(): ShopSettings {
  try {
    const raw = localStorage.getItem(SHOP_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return defaultSettings;
}

export function saveShopSettings(s: ShopSettings) {
  localStorage.setItem(SHOP_KEY, JSON.stringify(s));
}

export function loadGalleryImages(): GalleryImage[] {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveGalleryImages(imgs: GalleryImage[]) {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(imgs));
}

export function loadReviews(): Review[] {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    { id: '1', name: 'Ahmed Khan', rating: 5, text: 'Best tailor in Karachi! Perfect stitching every time.', date: '2025-12-15' },
    { id: '2', name: 'Bilal Shah', rating: 5, text: 'Great design work on my sherwani for the wedding.', date: '2026-01-20' },
    { id: '3', name: 'Usman Ali', rating: 4, text: 'Good quality and on-time delivery. Recommended!', date: '2026-02-10' },
  ];
}

export function saveReviews(r: Review[]) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(r));
}

export function generateShopId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
