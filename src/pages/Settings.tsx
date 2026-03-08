import { useState, useRef, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { exportBackup } from '@/lib/store';
import { listBackups, restoreBackup, deleteBackup, performManualBackup, downloadBackupAsFile, importBackupFromFile, isAutoBackupEnabled, setAutoBackupEnabled, getLastBackupTime } from '@/lib/autoBackup';
import { loadShopSettings, saveShopSettings, loadGalleryImages, saveGalleryImages, loadReviews, saveReviews, generateShopId } from '@/lib/shopSettings';
import type { AppData } from '@/lib/store';
import type { BackupInfo } from '@/lib/autoBackup';
import type { ShopSettings, PriceItem, GalleryImage, Review } from '@/lib/shopSettings';
import VoiceInput from '@/components/VoiceInput';
import { Settings2, Download, Upload, Languages, Database, Trash2, RotateCcw, Sun, Moon, Store, Image, Plus, X, Star, MessageSquare, DollarSign, Shield, Clock, HardDrive, FileDown, FileUp, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';

function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('kt-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('kt-theme', dark ? 'dark' : 'light');
  }, [dark]);
  return { dark, toggle: () => setDark(p => !p) };
}

export default function Settings() {
  const { lang, toggleLang, isUrdu } = useLang();
  const { data, setData } = useData();
  const fileRef = useRef<HTMLInputElement>(null);
  const restoreFileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [showBackups, setShowBackups] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const [activeSection, setActiveSection] = useState<'main' | 'shop' | 'gallery' | 'prices' | 'reviews' | 'backup'>('main');
  const [backups, setBackups] = useState<BackupInfo[]>(() => listBackups());
  const [autoBackup, setAutoBackup] = useState(isAutoBackupEnabled);
  const lastBackup = getLastBackupTime();
  const theme = useTheme();

  // Shop settings
  const [shop, setShop] = useState<ShopSettings>(() => loadShopSettings());
  const [gallery, setGallery] = useState<GalleryImage[]>(() => loadGalleryImages());
  const [reviews, setReviews] = useState<Review[]>(() => loadReviews());

  // New price form
  const [newPriceEn, setNewPriceEn] = useState('');
  const [newPriceUr, setNewPriceUr] = useState('');
  const [newPriceAmt, setNewPriceAmt] = useState('');
  const [newPriceDur, setNewPriceDur] = useState('');

  // New review form
  const [newRevName, setNewRevName] = useState('');
  const [newRevRating, setNewRevRating] = useState(5);
  const [newRevText, setNewRevText] = useState('');

  // New gallery image
  const [newGalleryEn, setNewGalleryEn] = useState('');
  const [newGalleryUr, setNewGalleryUr] = useState('');
  const [newGalleryPrice, setNewGalleryPrice] = useState('');

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importBackupFromFile(file).then(imported => {
      if (imported) {
        setData(imported);
        toast.success(isUrdu ? 'بیک اپ بحال ہو گیا!' : 'Backup restored successfully!');
      } else {
        toast.error(isUrdu ? 'غلط فائل فارمیٹ' : 'Invalid backup file format');
      }
    });
    e.target.value = '';
  };

  const handleRestore = (key: string) => {
    const restored = restoreBackup(key);
    if (restored) {
      setData(restored);
      toast.success(isUrdu ? 'بیک اپ بحال ہو گیا!' : 'Backup restored!');
      setShowBackups(false);
    }
  };

  const handleManualBackup = () => {
    performManualBackup(data);
    setBackups(listBackups());
    toast.success(isUrdu ? 'بیک اپ بنایا گیا!' : 'Manual backup created!');
  };

  const handleDeleteBackup = (key: string) => {
    deleteBackup(key);
    setBackups(listBackups());
    toast.success(isUrdu ? 'بیک اپ حذف ہو گیا' : 'Backup deleted');
  };

  const handleToggleAutoBackup = () => {
    const next = !autoBackup;
    setAutoBackup(next);
    setAutoBackupEnabled(next);
    toast.success(next 
      ? (isUrdu ? 'خودکار بیک اپ فعال' : 'Auto backup enabled')
      : (isUrdu ? 'خودکار بیک اپ غیر فعال' : 'Auto backup disabled')
    );
  };

  const handleClearAll = () => { setData({ customers: [], orders: [], workers: [] }); setShowClear(false); };

  const saveShop = () => { saveShopSettings(shop); toast.success(isUrdu ? 'محفوظ ہو گیا' : 'Shop details saved!'); };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error(isUrdu ? 'فائل بہت بڑی ہے (حد 2MB)' : 'File too large (max 2MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img: GalleryImage = {
        id: generateShopId(),
        dataUrl: reader.result as string,
        nameEn: newGalleryEn || 'New Design',
        nameUr: newGalleryUr || 'نیا ڈیزائن',
        price: newGalleryPrice || 'Rs —',
      };
      const updated = [...gallery, img];
      setGallery(updated);
      saveGalleryImages(updated);
      setNewGalleryEn(''); setNewGalleryUr(''); setNewGalleryPrice('');
      toast.success(isUrdu ? 'تصویر شامل ہو گئی' : 'Image added!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeGalleryImg = (id: string) => {
    const updated = gallery.filter(g => g.id !== id);
    setGallery(updated);
    saveGalleryImages(updated);
  };

  const addPrice = () => {
    if (!newPriceEn && !newPriceUr) return;
    const updated = { ...shop, prices: [...shop.prices, { id: generateShopId(), nameEn: newPriceEn, nameUr: newPriceUr, price: newPriceAmt, duration: newPriceDur }] };
    setShop(updated); saveShopSettings(updated);
    setNewPriceEn(''); setNewPriceUr(''); setNewPriceAmt(''); setNewPriceDur('');
  };

  const removePrice = (id: string) => {
    const updated = { ...shop, prices: shop.prices.filter(p => p.id !== id) };
    setShop(updated); saveShopSettings(updated);
  };

  const addReview = () => {
    if (!newRevName.trim()) return;
    const updated = [...reviews, { id: generateShopId(), name: newRevName, rating: newRevRating, text: newRevText, date: new Date().toISOString().slice(0, 10) }];
    setReviews(updated); saveReviews(updated);
    setNewRevName(''); setNewRevRating(5); setNewRevText('');
    toast.success(isUrdu ? 'ریویو شامل ہو گیا' : 'Review added!');
  };

  const removeReview = (id: string) => {
    const updated = reviews.filter(r => r.id !== id);
    setReviews(updated); saveReviews(updated);
  };

  // Backup & Restore section
  if (activeSection === 'backup') return (
    <div className="space-y-4 pb-4">
      <button onClick={() => setActiveSection('main')} className="text-sm text-primary font-semibold">← {isUrdu ? 'واپس' : 'Back'}</button>
      <div className="flex items-center gap-2 mb-1">
        <Shield size={22} className="text-primary" />
        <h2 className="text-lg font-bold">{isUrdu ? 'بیک اپ اور بحالی' : 'Backup & Restore'}</h2>
      </div>

      {/* Last backup info */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-success/10">
            <CalendarCheck size={20} className="text-success" />
          </div>
          <div>
            <p className="text-sm font-semibold">{isUrdu ? 'آخری بیک اپ' : 'Last Backup'}</p>
            <p className="text-xs text-muted-foreground">
              {lastBackup ? new Date(lastBackup).toLocaleString() : (isUrdu ? 'کوئی بیک اپ نہیں' : 'No backup yet')}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-background rounded-lg p-2 border border-border">
            <p className="text-lg font-bold text-primary">{data.customers.length}</p>
            <p className="text-[10px] text-muted-foreground">{isUrdu ? 'گاہک' : 'Customers'}</p>
          </div>
          <div className="bg-background rounded-lg p-2 border border-border">
            <p className="text-lg font-bold text-primary">{data.orders.length}</p>
            <p className="text-[10px] text-muted-foreground">{isUrdu ? 'آرڈرز' : 'Orders'}</p>
          </div>
          <div className="bg-background rounded-lg p-2 border border-border">
            <p className="text-lg font-bold text-primary">{data.workers.length}</p>
            <p className="text-[10px] text-muted-foreground">{isUrdu ? 'کاریگر' : 'Workers'}</p>
          </div>
        </div>
      </div>

      {/* Auto backup toggle */}
      <button onClick={handleToggleAutoBackup} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-warning/10"><Clock size={20} className="text-warning" /></div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{isUrdu ? 'روزانہ خودکار بیک اپ' : 'Daily Auto Backup'}</p>
          <p className="text-xs text-muted-foreground">{isUrdu ? 'ہر روز خود بخود بیک اپ بنائے' : 'Automatically backs up every day'}</p>
        </div>
        <div className={`w-12 h-7 rounded-full relative transition-colors ${autoBackup ? 'bg-primary' : 'bg-muted'}`}>
          <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-card shadow transition-transform ${autoBackup ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
      </button>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleManualBackup} className="bg-primary text-primary-foreground rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <HardDrive size={24} />
          <span className="text-xs font-semibold">{isUrdu ? 'ابھی بیک اپ بنائیں' : 'Backup Now'}</span>
        </button>
        <button onClick={() => downloadBackupAsFile(data)} className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <FileDown size={24} className="text-success" />
          <span className="text-xs font-semibold">{isUrdu ? 'فائل ڈاؤنلوڈ' : 'Download File'}</span>
        </button>
      </div>

      {/* Restore from file */}
      <button onClick={() => restoreFileRef.current?.click()} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-info/10"><FileUp size={20} className="text-info" /></div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{isUrdu ? 'فائل سے بحال کریں' : 'Restore from File'}</p>
          <p className="text-xs text-muted-foreground">{isUrdu ? 'JSON بیک اپ فائل سے ڈیٹا بحال کریں' : 'Import JSON backup file'}</p>
        </div>
      </button>
      <input ref={restoreFileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {/* Saved backups list */}
      <div>
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Database size={16} className="text-muted-foreground" />
          {isUrdu ? 'محفوظ شدہ بیک اپ' : 'Saved Backups'} ({backups.length})
        </h3>
        {backups.length === 0 && (
          <p className="text-center text-muted-foreground py-6 text-sm">{isUrdu ? 'کوئی بیک اپ نہیں' : 'No backups yet'}</p>
        )}
        <div className="space-y-2">
          {backups.map(b => (
            <div key={b.key} className="bg-card rounded-xl border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{new Date(b.timestamp).toLocaleDateString()}</p>
                    {b.manual && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {isUrdu ? 'دستی' : 'Manual'}
                      </span>
                    )}
                    {!b.manual && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-success/10 text-success font-medium">
                        {isUrdu ? 'خودکار' : 'Auto'}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{new Date(b.timestamp).toLocaleTimeString()}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleRestore(b.key)} className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold active:scale-95 transition-transform flex items-center gap-1">
                    <RotateCcw size={10} /> {isUrdu ? 'بحال' : 'Restore'}
                  </button>
                  <button onClick={() => handleDeleteBackup(b.key)} className="px-2 py-1.5 rounded-lg bg-destructive/10 text-destructive text-[10px] font-semibold active:scale-95 transition-transform">
                    <X size={12} />
                  </button>
                </div>
              </div>
              {b.stats && (
                <div className="flex gap-2 flex-wrap text-[9px] text-muted-foreground">
                  <span>👤 {b.stats.customers} {isUrdu ? 'گاہک' : 'customers'}</span>
                  <span>📋 {b.stats.orders} {isUrdu ? 'آرڈرز' : 'orders'}</span>
                  <span>🔧 {b.stats.workers} {isUrdu ? 'کاریگر' : 'workers'}</span>
                  <span>👔 {b.stats.totalSuits} {isUrdu ? 'سوٹ' : 'suits'}</span>
                  <span>📐 {b.stats.totalMeasurements} {isUrdu ? 'ناپ' : 'measurements'}</span>
                  <span>💰 {b.stats.totalPayments} {isUrdu ? 'ادائیگی' : 'payments'}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Sub-sections
  if (activeSection === 'shop') return (
    <div className="space-y-4 pb-4">
      <button onClick={() => setActiveSection('main')} className="text-sm text-primary font-semibold">← {isUrdu ? 'واپس' : 'Back'}</button>
      <div className="flex items-center gap-2 mb-1">
        <Store size={22} className="text-primary" />
        <h2 className="text-lg font-bold">{isUrdu ? 'دکان کی تفصیلات' : 'Shop Details'}</h2>
      </div>
      <div className="bg-card rounded-xl p-4 border border-border space-y-4">
        <div>
          <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'دکان کا نام' : 'Shop Name'}</label>
          <VoiceInput value={shop.name} onChange={v => setShop({ ...shop, name: v })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'فون نمبر' : 'Phone Number'}</label>
          <VoiceInput value={shop.phone} onChange={v => setShop({ ...shop, phone: v })} type="tel" placeholder="+923..." />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'پتہ' : 'Address'}</label>
          <VoiceInput value={shop.address} onChange={v => setShop({ ...shop, address: v })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'اوقات کار' : 'Working Hours'}</label>
          <VoiceInput value={shop.hours} onChange={v => setShop({ ...shop, hours: v })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'ٹیگ لائن' : 'Tagline'}</label>
          <VoiceInput value={shop.tagline} onChange={v => setShop({ ...shop, tagline: v })} />
        </div>
        <button onClick={saveShop} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold touch-target active:scale-95">
          {isUrdu ? 'محفوظ کریں' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  if (activeSection === 'prices') return (
    <div className="space-y-4 pb-4">
      <button onClick={() => setActiveSection('main')} className="text-sm text-primary font-semibold">← {isUrdu ? 'واپس' : 'Back'}</button>
      <div className="flex items-center gap-2 mb-1">
        <DollarSign size={22} className="text-primary" />
        <h2 className="text-lg font-bold">{isUrdu ? 'قیمتیں' : 'Prices'}</h2>
      </div>
      {/* Existing prices */}
      <div className="space-y-2">
        {shop.prices.map(p => (
          <div key={p.id} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{isUrdu ? p.nameUr : p.nameEn}</p>
              <p className="text-[10px] text-muted-foreground">{p.price} · {p.duration}</p>
            </div>
            <button onClick={() => removePrice(p.id)} className="p-2 text-destructive touch-target"><X size={16} /></button>
          </div>
        ))}
      </div>
      {/* Add new price */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-3">
        <h3 className="font-semibold text-sm">{isUrdu ? 'نئی قیمت شامل کریں' : 'Add New Price'}</h3>
        <div className="grid grid-cols-2 gap-2">
          <VoiceInput value={newPriceEn} onChange={setNewPriceEn} placeholder="English name" />
          <VoiceInput value={newPriceUr} onChange={setNewPriceUr} placeholder="اردو نام" />
          <VoiceInput value={newPriceAmt} onChange={setNewPriceAmt} placeholder="Rs 2,500" />
          <VoiceInput value={newPriceDur} onChange={setNewPriceDur} placeholder="3-5 days" />
        </div>
        <button onClick={addPrice} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm touch-target active:scale-95">
          <Plus size={16} className="inline mr-1" /> {isUrdu ? 'شامل کریں' : 'Add Price'}
        </button>
      </div>
    </div>
  );

  if (activeSection === 'gallery') return (
    <div className="space-y-4 pb-4">
      <button onClick={() => setActiveSection('main')} className="text-sm text-primary font-semibold">← {isUrdu ? 'واپس' : 'Back'}</button>
      <div className="flex items-center gap-2 mb-1">
        <Image size={22} className="text-primary" />
        <h2 className="text-lg font-bold">{isUrdu ? 'ڈیزائن گیلری' : 'Design Gallery'}</h2>
      </div>
      {/* Upload form */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-3">
        <h3 className="font-semibold text-sm">{isUrdu ? 'نئی تصویر شامل کریں' : 'Add New Design Photo'}</h3>
        <div className="grid grid-cols-2 gap-2">
          <VoiceInput value={newGalleryEn} onChange={setNewGalleryEn} placeholder="English name" />
          <VoiceInput value={newGalleryUr} onChange={setNewGalleryUr} placeholder="اردو نام" />
        </div>
        <VoiceInput value={newGalleryPrice} onChange={setNewGalleryPrice} placeholder="Rs 3,500" />
        <button onClick={() => galleryRef.current?.click()} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm touch-target active:scale-95 flex items-center justify-center gap-2">
          <Upload size={16} /> {isUrdu ? 'تصویر اپلوڈ کریں' : 'Upload Photo'}
        </button>
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
        <p className="text-[10px] text-muted-foreground text-center">{isUrdu ? 'زیادہ سے زیادہ 2MB، JPG/PNG' : 'Max 2MB, JPG/PNG'}</p>
      </div>
      {/* Existing images */}
      {gallery.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {gallery.map(img => (
            <div key={img.id} className="bg-card rounded-xl border border-border overflow-hidden relative">
              <img src={img.dataUrl} alt={img.nameEn} className="w-full h-32 object-cover" />
              <div className="p-2">
                <p className="text-xs font-medium truncate">{isUrdu ? img.nameUr : img.nameEn}</p>
                <p className="text-[10px] text-primary font-bold">{img.price}</p>
              </div>
              <button onClick={() => removeGalleryImg(img.id)} className="absolute top-1 right-1 p-1.5 bg-destructive text-destructive-foreground rounded-full touch-target">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      {gallery.length === 0 && (
        <p className="text-center text-muted-foreground py-6 text-sm">{isUrdu ? 'کوئی تصویر نہیں۔ اوپر سے شامل کریں۔' : 'No custom images yet. Upload above.'}</p>
      )}
    </div>
  );

  if (activeSection === 'reviews') return (
    <div className="space-y-4 pb-4">
      <button onClick={() => setActiveSection('main')} className="text-sm text-primary font-semibold">← {isUrdu ? 'واپس' : 'Back'}</button>
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare size={22} className="text-primary" />
        <h2 className="text-lg font-bold">{isUrdu ? 'ریویوز' : 'Reviews'}</h2>
      </div>
      {/* Add review */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-3">
        <h3 className="font-semibold text-sm">{isUrdu ? 'نیا ریویو شامل کریں' : 'Add Review'}</h3>
        <VoiceInput value={newRevName} onChange={setNewRevName} placeholder={isUrdu ? 'گاہک کا نام' : 'Customer name'} />
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">{isUrdu ? 'ریٹنگ' : 'Rating'}:</span>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setNewRevRating(n)} className="p-0.5 touch-target">
              <Star size={24} className={n <= newRevRating ? 'text-warning fill-warning' : 'text-muted-foreground'} />
            </button>
          ))}
        </div>
        <VoiceInput value={newRevText} onChange={setNewRevText} multiline rows={2} placeholder={isUrdu ? 'ریویو لکھیں...' : 'Write review...'} append />
        <button onClick={addReview} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm touch-target active:scale-95">
          <Plus size={16} className="inline mr-1" /> {isUrdu ? 'شامل کریں' : 'Add Review'}
        </button>
      </div>
      {/* Existing reviews */}
      <div className="space-y-2">
        {reviews.map(r => (
          <div key={r.id} className="bg-card rounded-xl p-4 border border-border relative">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm">{r.name}</p>
              <div className="flex">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={12} className="text-warning fill-warning" />)}</div>
            </div>
            <p className="text-sm text-muted-foreground">{r.text}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{r.date}</p>
            <button onClick={() => removeReview(r.id)} className="absolute top-2 right-2 p-1.5 text-destructive touch-target"><X size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );

  // MAIN settings
  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2 mb-1">
        <Settings2 size={22} className="text-primary" />
        <h2 className="text-lg font-bold">{isUrdu ? 'ترتیبات' : 'Settings'}</h2>
      </div>

      {/* Shop Settings */}
      <button onClick={() => setActiveSection('shop')} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-primary/10"><Store size={22} className="text-primary" /></div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{isUrdu ? 'دکان کی تفصیلات' : 'Shop Details'}</p>
          <p className="text-xs text-muted-foreground">{isUrdu ? 'فون، پتہ، اوقات' : 'Phone, address, hours'}</p>
        </div>
      </button>

      {/* Prices */}
      <button onClick={() => setActiveSection('prices')} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-accent/10"><DollarSign size={22} className="text-accent-foreground" /></div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{isUrdu ? 'قیمتیں' : 'Prices'}</p>
          <p className="text-xs text-muted-foreground">{shop.prices.length} {isUrdu ? 'آئٹمز' : 'items'}</p>
        </div>
      </button>

      {/* Gallery */}
      <button onClick={() => setActiveSection('gallery')} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-info/10"><Image size={22} className="text-info" /></div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{isUrdu ? 'ڈیزائن گیلری' : 'Design Gallery'}</p>
          <p className="text-xs text-muted-foreground">{gallery.length} {isUrdu ? 'تصاویر' : 'photos'}</p>
        </div>
      </button>

      {/* Reviews */}
      <button onClick={() => setActiveSection('reviews')} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-warning/10"><MessageSquare size={22} className="text-warning" /></div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{isUrdu ? 'ریویوز' : 'Customer Reviews'}</p>
          <p className="text-xs text-muted-foreground">{reviews.length} {isUrdu ? 'ریویوز' : 'reviews'}</p>
        </div>
      </button>

      {/* Dark Mode */}
      <button onClick={theme.toggle} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-muted">{theme.dark ? <Moon size={22} className="text-info" /> : <Sun size={22} className="text-warning" />}</div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{isUrdu ? 'ڈارک / لائٹ موڈ' : 'Dark / Light Mode'}</p>
          <p className="text-xs text-muted-foreground">{theme.dark ? (isUrdu ? 'ڈارک موڈ فعال' : 'Dark mode active') : (isUrdu ? 'لائٹ موڈ فعال' : 'Light mode active')}</p>
        </div>
        <div className={`w-12 h-7 rounded-full relative transition-colors ${theme.dark ? 'bg-primary' : 'bg-muted'}`}>
          <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-card shadow transition-transform ${theme.dark ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
      </button>

      {/* Language */}
      <button onClick={toggleLang} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-primary/10"><Languages size={22} className="text-primary" /></div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{isUrdu ? 'زبان تبدیل کریں' : 'Change Language'}</p>
          <p className="text-xs text-muted-foreground">{lang === 'en' ? 'English → اردو' : 'اردو → English'}</p>
        </div>
      </button>

      {/* Export */}
      <button onClick={() => exportBackup(data)} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-success/10"><Download size={22} className="text-success" /></div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{isUrdu ? 'بیک اپ ڈاؤنلوڈ' : 'Export Backup'}</p>
          <p className="text-xs text-muted-foreground">{isUrdu ? 'JSON فائل میں ڈیٹا محفوظ کریں' : 'Save data as JSON file'}</p>
        </div>
      </button>

      {/* Import */}
      <button onClick={() => fileRef.current?.click()} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-info/10"><Upload size={22} className="text-info" /></div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{isUrdu ? 'بیک اپ بحال کریں' : 'Import Backup'}</p>
          <p className="text-xs text-muted-foreground">{isUrdu ? 'JSON فائل سے ڈیٹا بحال کریں' : 'Restore from JSON'}</p>
        </div>
      </button>
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {/* Auto Backups */}
      <button onClick={() => setShowBackups(!showBackups)} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-warning/10"><Database size={22} className="text-warning" /></div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{isUrdu ? 'خودکار بیک اپ' : 'Auto Backups'}</p>
          <p className="text-xs text-muted-foreground">{backups.length} {isUrdu ? 'بیک اپ محفوظ' : 'backups saved'}</p>
        </div>
      </button>
      {showBackups && backups.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-2">
          {backups.map(b => (
            <div key={b.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{b.date}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(b.timestamp).toLocaleString()}</p>
              </div>
              <button onClick={() => handleRestore(b.key)} className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold touch-target active:scale-95">
                <RotateCcw size={14} className="inline mr-1" /> {isUrdu ? 'بحال' : 'Restore'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Clear All */}
      <button onClick={() => setShowClear(true)} className="w-full bg-card rounded-xl p-4 border border-destructive/30 flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="p-3 rounded-xl bg-destructive/10"><Trash2 size={22} className="text-destructive" /></div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm text-destructive">{isUrdu ? 'تمام ڈیٹا صاف کریں' : 'Clear All Data'}</p>
          <p className="text-xs text-muted-foreground">{isUrdu ? 'تمام گاہک، آرڈرز اور کاریگر حذف ہوں گے' : 'Delete all customers, orders and workers'}</p>
        </div>
      </button>

      {/* Data Stats */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-semibold text-sm mb-3">{isUrdu ? 'ڈیٹا' : 'Data Summary'}</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">{isUrdu ? 'گاہک' : 'Customers'}</span><span className="font-bold">{data.customers.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{isUrdu ? 'آرڈرز' : 'Orders'}</span><span className="font-bold">{data.orders.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{isUrdu ? 'کاریگر' : 'Workers'}</span><span className="font-bold">{data.workers.length}</span></div>
        </div>
      </div>

      {/* Clear Confirmation */}
      {showClear && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4" onClick={() => setShowClear(false)}>
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-center">{isUrdu ? '⚠️ تصدیق' : '⚠️ Confirm'}</h3>
            <p className="text-sm text-center text-muted-foreground">{isUrdu ? 'کیا آپ واقعی تمام ڈیٹا حذف کرنا چاہتے ہیں؟' : 'Are you sure you want to delete all data?'}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClear(false)} className="flex-1 py-3 rounded-xl border border-border font-semibold touch-target active:scale-95">{isUrdu ? 'منسوخ' : 'Cancel'}</button>
              <button onClick={handleClearAll} className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold touch-target active:scale-95">{isUrdu ? 'حذف کریں' : 'Delete All'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
