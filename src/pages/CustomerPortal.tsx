import { useState, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { emptyMeasurements, generateId } from '@/lib/store';
import { cleanInput } from '@/lib/validation';
import { loadShopSettings, loadGalleryImages, loadReviews } from '@/lib/shopSettings';
import type { Measurements } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import VoiceInput from '@/components/VoiceInput';
import { MapPin, Phone, MessageCircle, Scissors, Search, Image, ShoppingBag, Ruler, Clock, Star, ChevronLeft, ChevronRight, Send, CheckCircle2 } from 'lucide-react';

import design1 from '@/assets/design-1.jpg';
import design2 from '@/assets/design-2.jpg';
import design3 from '@/assets/design-3.jpg';
import design4 from '@/assets/design-4.jpg';

const builtInDesigns = [
  { img: design1, en: 'Embroidered Kameez', ur: 'کڑھائی والی قمیض', price: 'Rs 3,500' },
  { img: design2, en: 'Royal Sherwani', ur: 'شاہی شیروانی', price: 'Rs 15,000+' },
  { img: design3, en: 'Simple Cotton Kameez', ur: 'سادہ سوتی قمیض', price: 'Rs 2,500' },
  { img: design4, en: 'Premium Kurta Pajama', ur: 'پریمیم کرتا پاجامہ', price: 'Rs 3,000' },
];

const kameezFields = [
  { key: 'kameezLength', en: 'Length', ur: 'لمبائی' },
  { key: 'chest', en: 'Chest', ur: 'سینہ' },
  { key: 'shoulder', en: 'Shoulder', ur: 'کندھا' },
  { key: 'sleeve', en: 'Sleeve', ur: 'آستین' },
  { key: 'collar', en: 'Collar', ur: 'کالر' },
  { key: 'daman', en: 'Daman', ur: 'دامن' },
];

const shalwarFields = [
  { key: 'shalwarLength', en: 'Length', ur: 'لمبائی' },
  { key: 'waist', en: 'Waist', ur: 'کمر' },
  { key: 'hip', en: 'Hip', ur: 'ہپ' },
  { key: 'pancha', en: 'Pancha', ur: 'پانچا' },
];

type Section = 'home' | 'track' | 'order' | 'measurements';

export default function CustomerPortal() {
  const { t, isUrdu } = useLang();
  const { data, addCustomer, addOrder } = useData();

  const shop = useMemo(() => loadShopSettings(), []);
  const customGallery = useMemo(() => loadGalleryImages(), []);
  const reviews = useMemo(() => loadReviews(), []);

  // Merge built-in + custom gallery
  const allDesigns = useMemo(() => {
    const custom = customGallery.map(g => ({ img: g.dataUrl, en: g.nameEn, ur: g.nameUr, price: g.price }));
    return [...custom, ...builtInDesigns];
  }, [customGallery]);

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '5.0';

  const [section, setSection] = useState<Section>('home');
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderType, setOrderType] = useState('full_suit');
  const [orderDesign, setOrderDesign] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [measName, setMeasName] = useState('');
  const [measPhone, setMeasPhone] = useState('');
  const [measurements, setMeasurements] = useState<Measurements>(emptyMeasurements);
  const [measSubmitted, setMeasSubmitted] = useState(false);

  const whatsAppBase = `https://wa.me/${shop.phone.replace('+', '').replace(/\s/g, '')}`;

  const handleTrack = () => {
    const customer = data.customers.find(c =>
      c.customerId.toLowerCase() === trackId.trim().toLowerCase() || c.phone === trackId.trim()
    );
    if (customer) {
      setTrackResult({ customer, orders: data.orders.filter(o => o.customerId === customer.id) });
    } else {
      setTrackResult({ error: true });
    }
  };

  const handleOrderSubmit = () => {
    const safeName = cleanInput(orderName, 100);
    const safePhone = cleanInput(orderPhone, 20);
    const safeNotes = cleanInput(orderNotes, 500);
    if (!safeName || !safePhone) return;
    let customer = data.customers.find(c => c.phone === safePhone);
    if (!customer) {
      addCustomer({ name: safeName, phone: safePhone, address: '', measurements: emptyMeasurements });
      customer = data.customers[data.customers.length - 1];
    }
    if (customer) {
      addOrder({
        customerId: customer.id, deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        totalAmount: 0, advancePaid: 0, paymentStatus: 'pending', notes: `[Online] ${safeNotes}`.trim(), paymentHistory: [],
        suits: [{ id: generateId(), status: 'received', type: orderType as any, designWork: orderDesign, notes: safeNotes, statusHistory: [{ status: 'received' as const, timestamp: new Date().toISOString() }] }],
      });
    }
    setOrderSubmitted(true);
  };

  const handleMeasSubmit = () => {
    const safeName = cleanInput(measName, 100);
    const safePhone = cleanInput(measPhone, 20);
    if (!safeName || !safePhone) return;
    const existing = data.customers.find(c => c.phone === safePhone);
    if (!existing) addCustomer({ name: safeName, phone: safePhone, address: '', measurements });
    setMeasSubmitted(true);
  };

  const sendWhatsAppOrder = () => {
    const typeLabel = orderType === 'full_suit' ? 'Full Suit' : orderType === 'kameez' ? 'Kameez' : 'Shalwar';
    const msg = `Assalam o Alaikum!\n\nName: ${orderName}\nPhone: ${orderPhone}\nType: ${typeLabel}${orderDesign ? ' (design work)' : ''}\nNotes: ${orderNotes || 'None'}`;
    window.open(`${whatsAppBase}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const sendWhatsAppMeas = () => {
    const m = measurements;
    const msg = `Assalam o Alaikum!\n\nMeasurements:\nName: ${measName}\nPhone: ${measPhone}\n\nKameez: L:${m.kameezLength} Ch:${m.chest} Sh:${m.shoulder} Sl:${m.sleeve} Co:${m.collar} Da:${m.daman}\nShalwar: L:${m.shalwarLength} W:${m.waist} H:${m.hip} P:${m.pancha}\nNotes: ${m.notes || 'None'}`;
    window.open(`${whatsAppBase}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // TRACK
  if (section === 'track') return (
    <div className="space-y-4 pb-4">
      <button onClick={() => { setSection('home'); setTrackResult(null); setTrackId(''); }} className="flex items-center gap-1 text-sm text-primary font-semibold"><ChevronLeft size={16} /> {isUrdu ? 'واپس' : 'Back'}</button>
      <div className="bg-card rounded-xl p-5 border border-border">
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><Search size={18} className="text-primary" /> {t('portal.track')}</h3>
        <p className="text-xs text-muted-foreground mb-4">{isUrdu ? 'اپنا کسٹمر آئی ڈی یا فون نمبر درج کریں' : 'Enter your Customer ID or phone number'}</p>
        <div className="flex gap-2">
          <VoiceInput value={trackId} onChange={setTrackId} placeholder="KT-001 or 0300..." />
          <button onClick={handleTrack} className="px-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm touch-target active:scale-95 shrink-0">{isUrdu ? 'تلاش' : 'Track'}</button>
        </div>
        {trackResult && !trackResult.error && (
          <div className="mt-4 space-y-3">
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
              <p className="font-bold">{trackResult.customer.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{trackResult.customer.customerId}</p>
            </div>
            {trackResult.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{isUrdu ? 'کوئی آرڈر نہیں' : 'No orders found'}</p>
            ) : trackResult.orders.map((order: any) => {
              const isDelivered = !!order.deliveredAt;
              const balance = order.totalAmount - order.advancePaid;
               return (
                <div key={order.id} className={`rounded-xl p-4 border space-y-3 ${isDelivered ? 'bg-success/5 border-success/20' : 'bg-card border-border'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{isUrdu ? 'ڈیلیوری' : 'Delivery'}: {new Date(order.deadline).toLocaleDateString()}</p>
                    </div>
                    {isDelivered && <span className="text-xs font-bold px-2 py-1 rounded-full bg-success text-success-foreground">✅ {isUrdu ? 'حوالے' : 'Delivered'}</span>}
                  </div>
                  {order.suits.map((suit: any, i: number) => {
                    const types: Record<string, string> = { full_suit: isUrdu ? 'فل سوٹ' : 'Full Suit', kameez: isUrdu ? 'قمیض' : 'Kameez', shalwar: isUrdu ? 'شلوار' : 'Shalwar' };
                    const stages = ['received', 'cutting', 'stitching', 'finishing', 'packed', 'ready', 'delivered'];
                    const pct = Math.round(((stages.indexOf(suit.status) + 1) / stages.length) * 100);
                    return (
                      <div key={suit.id} className="bg-background rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium">{types[suit.type] || suit.type} #{i + 1}</span>
                          <StatusBadge status={suit.status} />
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{pct}% {isUrdu ? 'مکمل' : 'complete'}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
        {trackResult?.error && (
          <div className="mt-4 text-center py-6">
            <p className="text-destructive font-semibold text-sm">{isUrdu ? 'کسٹمر نہیں ملا' : 'Customer not found'}</p>
            <p className="text-xs text-muted-foreground mt-1">{isUrdu ? 'آئی ڈی یا فون چیک کریں' : 'Check your ID or phone'}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ORDER
  if (section === 'order') return (
    <div className="space-y-4 pb-4">
      <button onClick={() => { setSection('home'); setOrderSubmitted(false); }} className="flex items-center gap-1 text-sm text-primary font-semibold"><ChevronLeft size={16} /> {isUrdu ? 'واپس' : 'Back'}</button>
      {orderSubmitted ? (
        <div className="bg-success/5 border border-success/20 rounded-2xl p-8 text-center space-y-3">
          <CheckCircle2 size={48} className="text-success mx-auto" />
          <h3 className="font-bold text-lg">{isUrdu ? 'آرڈر موصول!' : 'Order Received!'}</h3>
          <p className="text-sm text-muted-foreground">{isUrdu ? 'ہم جلد رابطہ کریں گے' : 'We will contact you shortly'}</p>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={sendWhatsAppOrder} className="px-4 py-2 bg-success text-success-foreground rounded-xl text-sm font-semibold flex items-center gap-2 active:scale-95"><MessageCircle size={16} /> WhatsApp</button>
            <button onClick={() => { setSection('home'); setOrderSubmitted(false); }} className="px-4 py-2 bg-muted rounded-xl text-sm font-semibold active:scale-95">{isUrdu ? 'واپس' : 'Done'}</button>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl p-5 border border-border space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><ShoppingBag size={18} className="text-primary" /> {isUrdu ? 'آن لائن آرڈر' : 'Place Order'}</h3>
          <div><label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'نام' : 'Name'} *</label><VoiceInput value={orderName} onChange={setOrderName} placeholder={isUrdu ? 'آپ کا نام' : 'Your name'} /></div>
          <div><label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'فون' : 'Phone'} *</label><VoiceInput value={orderPhone} onChange={setOrderPhone} type="tel" placeholder="03XX-XXXXXXX" /></div>
          <div>
            <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'قسم' : 'Type'}</label>
            <select value={orderType} onChange={e => setOrderType(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target">
              <option value="full_suit">{isUrdu ? 'فل سوٹ' : 'Full Suit'}</option>
              <option value="kameez">{isUrdu ? 'صرف قمیض' : 'Kameez Only'}</option>
              <option value="shalwar">{isUrdu ? 'صرف شلوار' : 'Shalwar Only'}</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={orderDesign} onChange={e => setOrderDesign(e.target.checked)} className="rounded" />
            {isUrdu ? 'ڈیزائن ورک' : 'Design Work'}
          </label>
          <div><label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'نوٹس' : 'Notes'}</label><VoiceInput value={orderNotes} onChange={setOrderNotes} multiline rows={3} placeholder={isUrdu ? 'فیبرک، ڈیزائن...' : 'Fabric, design...'} append /></div>
          <div className="flex gap-3 pt-2">
            <button onClick={sendWhatsAppOrder} className="flex-1 py-3 bg-success/10 text-success rounded-xl font-semibold text-sm touch-target active:scale-95 flex items-center justify-center gap-2"><MessageCircle size={16} /> WhatsApp</button>
            <button onClick={handleOrderSubmit} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm touch-target active:scale-95 flex items-center justify-center gap-2"><Send size={16} /> {isUrdu ? 'آرڈر دیں' : 'Submit'}</button>
          </div>
        </div>
      )}
    </div>
  );

  // MEASUREMENTS
  if (section === 'measurements') return (
    <div className="space-y-4 pb-4">
      <button onClick={() => { setSection('home'); setMeasSubmitted(false); }} className="flex items-center gap-1 text-sm text-primary font-semibold"><ChevronLeft size={16} /> {isUrdu ? 'واپس' : 'Back'}</button>
      {measSubmitted ? (
        <div className="bg-success/5 border border-success/20 rounded-2xl p-8 text-center space-y-3">
          <CheckCircle2 size={48} className="text-success mx-auto" />
          <h3 className="font-bold text-lg">{isUrdu ? 'ناپ موصول!' : 'Measurements Received!'}</h3>
          <button onClick={sendWhatsAppMeas} className="px-4 py-2 bg-success text-success-foreground rounded-xl text-sm font-semibold flex items-center gap-2 active:scale-95 mx-auto"><MessageCircle size={16} /> {isUrdu ? 'واٹس ایپ پر بھیجیں' : 'Also via WhatsApp'}</button>
        </div>
      ) : (
        <div className="bg-card rounded-xl p-5 border border-border space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Ruler size={18} className="text-primary" /> {isUrdu ? 'ناپ بھیجیں' : 'Send Measurements'}</h3>
          <div><label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'نام' : 'Name'} *</label><VoiceInput value={measName} onChange={setMeasName} /></div>
          <div><label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'فون' : 'Phone'} *</label><VoiceInput value={measPhone} onChange={setMeasPhone} type="tel" placeholder="03XX-XXXXXXX" /></div>
          <div>
            <h4 className="font-semibold text-sm mb-2 text-primary">{isUrdu ? 'قمیض' : 'Kameez'}</h4>
            <div className="grid grid-cols-2 gap-2">
              {kameezFields.map(f => (
                <div key={f.key}><label className="text-[10px] text-muted-foreground">{isUrdu ? f.ur : f.en}</label>
                  <input type="text" inputMode="decimal" value={(measurements as any)[f.key] || ''} onChange={e => setMeasurements({ ...measurements, [f.key]: e.target.value })} className="w-full px-3 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" placeholder="—" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2 text-primary">{isUrdu ? 'شلوار' : 'Shalwar'}</h4>
            <div className="grid grid-cols-2 gap-2">
              {shalwarFields.map(f => (
                <div key={f.key}><label className="text-[10px] text-muted-foreground">{isUrdu ? f.ur : f.en}</label>
                  <input type="text" inputMode="decimal" value={(measurements as any)[f.key] || ''} onChange={e => setMeasurements({ ...measurements, [f.key]: e.target.value })} className="w-full px-3 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" placeholder="—" />
                </div>
              ))}
            </div>
          </div>
          <div><label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'نوٹس' : 'Notes'}</label><VoiceInput value={measurements.notes} onChange={v => setMeasurements({ ...measurements, notes: v })} multiline rows={2} append /></div>
          <div className="flex gap-3 pt-2">
            <button onClick={sendWhatsAppMeas} className="flex-1 py-3 bg-success/10 text-success rounded-xl font-semibold text-sm touch-target active:scale-95 flex items-center justify-center gap-2"><MessageCircle size={16} /> WhatsApp</button>
            <button onClick={handleMeasSubmit} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm touch-target active:scale-95 flex items-center justify-center gap-2"><Send size={16} /> {isUrdu ? 'بھیجیں' : 'Submit'}</button>
          </div>
        </div>
      )}
    </div>
  );

  // HOME
  return (
    <div className="space-y-5 pb-4">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground rounded-2xl p-6 text-center -mx-4 -mt-4">
        <div className="text-5xl mb-3">✂️</div>
        <h2 className="text-2xl font-bold mb-1">{shop.name}</h2>
        <p className="text-sm opacity-80 mb-1">{shop.tagline}</p>
        <div className="flex items-center justify-center gap-1 text-xs opacity-70 mb-4">
          {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < Math.round(Number(avgRating)) ? 'fill-current' : 'opacity-30'} />)}
          <span className="ml-1">{avgRating}/5 ({reviews.length})</span>
        </div>
        <div className="flex gap-3 justify-center">
          <a href={whatsAppBase} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-success text-success-foreground rounded-xl text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform"><MessageCircle size={16} /> WhatsApp</a>
          <a href={`tel:${shop.phone}`} className="px-5 py-2.5 bg-card/20 rounded-xl text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform"><Phone size={16} /> {isUrdu ? 'کال' : 'Call'}</a>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => setSection('track')} className="bg-card rounded-xl p-4 border border-border flex flex-col items-center gap-2 active:scale-[0.98] transition-transform touch-target">
          <div className="p-3 rounded-xl bg-info/10 text-info"><Search size={22} /></div>
          <span className="text-xs font-semibold text-center">{isUrdu ? 'آرڈر ٹریک' : 'Track Order'}</span>
        </button>
        <button onClick={() => setSection('order')} className="bg-card rounded-xl p-4 border border-border flex flex-col items-center gap-2 active:scale-[0.98] transition-transform touch-target">
          <div className="p-3 rounded-xl bg-primary/10 text-primary"><ShoppingBag size={22} /></div>
          <span className="text-xs font-semibold text-center">{isUrdu ? 'آرڈر دیں' : 'Place Order'}</span>
        </button>
        <button onClick={() => setSection('measurements')} className="bg-card rounded-xl p-4 border border-border flex flex-col items-center gap-2 active:scale-[0.98] transition-transform touch-target">
          <div className="p-3 rounded-xl bg-accent/10 text-accent-foreground"><Ruler size={22} /></div>
          <span className="text-xs font-semibold text-center">{isUrdu ? 'ناپ بھیجیں' : 'Measurements'}</span>
        </button>
      </div>

      {/* Gallery */}
      {allDesigns.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 pb-2 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><Image size={16} className="text-primary" /> {t('portal.designs')}</h3>
            <div className="flex gap-1">
              <button onClick={() => setGalleryIdx(Math.max(0, galleryIdx - 1))} className="p-1.5 rounded-lg bg-muted text-muted-foreground disabled:opacity-30" disabled={galleryIdx === 0}><ChevronLeft size={16} /></button>
              <button onClick={() => setGalleryIdx(Math.min(allDesigns.length - 1, galleryIdx + 1))} className="p-1.5 rounded-lg bg-muted text-muted-foreground disabled:opacity-30" disabled={galleryIdx === allDesigns.length - 1}><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="relative">
            <img src={allDesigns[galleryIdx].img} alt={allDesigns[galleryIdx].en} className="w-full h-64 object-cover" loading="lazy" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="font-bold text-white">{isUrdu ? allDesigns[galleryIdx].ur : allDesigns[galleryIdx].en}</p>
              <p className="text-sm text-white/80">{allDesigns[galleryIdx].price}</p>
            </div>
          </div>
          <div className="flex gap-2 p-3 overflow-x-auto">
            {allDesigns.map((d, i) => (
              <button key={i} onClick={() => setGalleryIdx(i)} className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === galleryIdx ? 'border-primary' : 'border-transparent opacity-60'}`}>
                <img src={d.img} alt={d.en} className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prices */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-bold mb-3 flex items-center gap-2"><Scissors size={16} className="text-primary" /> {t('portal.prices')}</h3>
        <div className="space-y-0">
          {shop.prices.map((p, i) => (
            <div key={p.id || i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{isUrdu ? p.nameUr : p.nameEn}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10} /> {p.duration}</p>
              </div>
              <span className="font-bold text-sm text-primary">{p.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Star size={16} className="text-warning" /> {isUrdu ? 'گاہکوں کی رائے' : 'Customer Reviews'}
            <span className="ml-auto text-xs text-muted-foreground font-normal">{avgRating} ⭐ ({reviews.length})</span>
          </h3>
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-background rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{r.name.charAt(0)}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{r.name}</p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={10} className={i < r.rating ? 'text-warning fill-warning' : 'text-muted-foreground'} />
                      ))}
                      <span className="text-[10px] text-muted-foreground ml-1">{r.date}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shop Info & Map */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-3">
        <h3 className="font-bold flex items-center gap-2"><MapPin size={16} className="text-primary" /> {isUrdu ? 'ہماری دکان' : 'Our Shop'}</h3>
        <div className="space-y-1.5 text-sm">
          <p className="flex items-center gap-2 text-muted-foreground"><MapPin size={14} /> {shop.address}</p>
          <p className="flex items-center gap-2 text-muted-foreground"><Phone size={14} /> {shop.phone}</p>
          <p className="flex items-center gap-2 text-muted-foreground"><Clock size={14} /> {shop.hours}</p>
        </div>
        <div className="rounded-xl overflow-hidden border border-border">
          <iframe
            src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3620.4!2d67.03!3d24.86!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjTCsDUxJzM2LjAiTiA2N8KwMDEnNDguMCJF!5e0!3m2!1sen!2s!4v1`}
            width="100%" height="200" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Shop Location"
          />
        </div>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-semibold active:scale-95 transition-transform">
          📍 {isUrdu ? 'نقشے میں دیکھیں' : 'Open in Maps'}
        </a>
      </div>

      {/* WhatsApp CTA */}
      <a href={whatsAppBase} target="_blank" rel="noopener noreferrer" className="block w-full py-4 bg-success text-success-foreground rounded-xl font-bold text-center text-base active:scale-95 transition-transform">
        <MessageCircle size={20} className="inline mr-2" />
        {isUrdu ? 'واٹس ایپ پر رابطہ کریں' : 'Chat on WhatsApp'}
      </a>
    </div>
  );
}
