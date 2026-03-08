import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { emptyMeasurements, generateId } from '@/lib/store';
import type { Measurements } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import VoiceInput from '@/components/VoiceInput';
import { MapPin, Phone, MessageCircle, Scissors, Search, Image, ShoppingBag, Ruler, Clock, Star, ChevronLeft, ChevronRight, Send, CheckCircle2 } from 'lucide-react';

import design1 from '@/assets/design-1.jpg';
import design2 from '@/assets/design-2.jpg';
import design3 from '@/assets/design-3.jpg';
import design4 from '@/assets/design-4.jpg';

const SHOP_PHONE = '+923001234567';
const SHOP_ADDRESS = 'Shop #12, Tariq Road, Karachi';
const SHOP_HOURS = 'Mon-Sat: 10 AM - 9 PM';
const GOOGLE_MAPS_EMBED = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3620.4!2d67.03!3d24.86!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjTCsDUxJzM2LjAiTiA2N8KwMDEnNDguMCJF!5e0!3m2!1sen!2s!4v1`;

const designs = [
  { img: design1, en: 'Embroidered Kameez', ur: 'کڑھائی والی قمیض', price: 'Rs 3,500' },
  { img: design2, en: 'Royal Sherwani', ur: 'شاہی شیروانی', price: 'Rs 15,000+' },
  { img: design3, en: 'Simple Cotton Kameez', ur: 'سادہ سوتی قمیض', price: 'Rs 2,500' },
  { img: design4, en: 'Premium Kurta Pajama', ur: 'پریمیم کرتا پاجامہ', price: 'Rs 3,000' },
];

const prices = [
  { en: 'Simple Shalwar Kameez', ur: 'سادہ شلوار قمیض', price: 'Rs 2,500', detail: '3-5 days' },
  { en: 'Design Shalwar Kameez', ur: 'ڈیزائن شلوار قمیض', price: 'Rs 3,500', detail: '5-7 days' },
  { en: 'Waistcoat', ur: 'واسکٹ', price: 'Rs 2,000', detail: '3-5 days' },
  { en: 'Kurta Pajama', ur: 'کرتا پاجامہ', price: 'Rs 3,000', detail: '5-7 days' },
  { en: 'Sherwani', ur: 'شیروانی', price: 'Rs 15,000+', detail: '10-15 days' },
  { en: 'Pant Coat', ur: 'پینٹ کوٹ', price: 'Rs 8,000+', detail: '7-10 days' },
];

type Section = 'home' | 'track' | 'order' | 'measurements';

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

export default function CustomerPortal() {
  const { t, isUrdu } = useLang();
  const { data, addCustomer, addOrder } = useData();

  const [section, setSection] = useState<Section>('home');
  const [galleryIdx, setGalleryIdx] = useState(0);

  // Track
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);

  // Order form
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderType, setOrderType] = useState('full_suit');
  const [orderDesign, setOrderDesign] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  // Measurements
  const [measName, setMeasName] = useState('');
  const [measPhone, setMeasPhone] = useState('');
  const [measurements, setMeasurements] = useState<Measurements>(emptyMeasurements);
  const [measSubmitted, setMeasSubmitted] = useState(false);

  const handleTrack = () => {
    const customer = data.customers.find(c =>
      c.customerId.toLowerCase() === trackId.trim().toLowerCase() ||
      c.phone === trackId.trim()
    );
    if (customer) {
      const orders = data.orders.filter(o => o.customerId === customer.id);
      setTrackResult({ customer, orders });
    } else {
      setTrackResult({ error: true });
    }
  };

  const handleOrderSubmit = () => {
    if (!orderName.trim() || !orderPhone.trim()) return;
    // Find or create customer
    let customer = data.customers.find(c => c.phone === orderPhone.trim());
    if (!customer) {
      addCustomer({ name: orderName, phone: orderPhone, address: '', measurements: emptyMeasurements });
      // Re-read (addCustomer is sync for localStorage)
      customer = data.customers.find(c => c.phone === orderPhone.trim()) || data.customers[data.customers.length - 1];
    }
    if (customer) {
      addOrder({
        customerId: customer.id,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        totalAmount: 0,
        advancePaid: 0,
        paymentStatus: 'pending',
        notes: `[Online Order] ${orderNotes}`.trim(),
        paymentHistory: [],
        suits: [{
          id: generateId(),
          status: 'received',
          type: orderType as any,
          designWork: orderDesign,
          notes: orderNotes,
          statusHistory: [{ status: 'received' as const, timestamp: new Date().toISOString() }],
        }],
      });
    }
    setOrderSubmitted(true);
  };

  const handleMeasSubmit = () => {
    if (!measName.trim() || !measPhone.trim()) return;
    let customer = data.customers.find(c => c.phone === measPhone.trim());
    if (customer) {
      // Update measurements — handled via WhatsApp for now since we need updateCustomer
    } else {
      addCustomer({ name: measName, phone: measPhone, address: '', measurements });
    }
    setMeasSubmitted(true);
  };

  const sendWhatsAppOrder = () => {
    const typeLabel = orderType === 'full_suit' ? 'Full Suit' : orderType === 'kameez' ? 'Kameez' : 'Shalwar';
    const msg = `Assalam o Alaikum! I'd like to place an order:\n\nName: ${orderName}\nPhone: ${orderPhone}\nType: ${typeLabel}${orderDesign ? ' (with design work)' : ''}\nNotes: ${orderNotes || 'None'}\n\nPlease confirm.`;
    window.open(`https://wa.me/${SHOP_PHONE.replace('+', '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const sendWhatsAppMeasurements = () => {
    const m = measurements;
    const msg = `Assalam o Alaikum!\n\nMy Measurements:\nName: ${measName}\nPhone: ${measPhone}\n\nKameez:\nLength: ${m.kameezLength}, Chest: ${m.chest}, Shoulder: ${m.shoulder}, Sleeve: ${m.sleeve}, Collar: ${m.collar}, Daman: ${m.daman}\n\nShalwar:\nLength: ${m.shalwarLength}, Waist: ${m.waist}, Hip: ${m.hip}, Pancha: ${m.pancha}\n\nNotes: ${m.notes || 'None'}`;
    window.open(`https://wa.me/${SHOP_PHONE.replace('+', '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (section === 'track') return (
    <div className="space-y-4 pb-4">
      <button onClick={() => { setSection('home'); setTrackResult(null); setTrackId(''); }} className="flex items-center gap-1 text-sm text-primary font-semibold">
        <ChevronLeft size={16} /> {isUrdu ? 'واپس' : 'Back'}
      </button>
      <div className="bg-card rounded-xl p-5 border border-border">
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
          <Search size={18} className="text-primary" /> {t('portal.track')}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">{isUrdu ? 'اپنا کسٹمر آئی ڈی یا فون نمبر درج کریں' : 'Enter your Customer ID or phone number'}</p>
        <div className="flex gap-2">
          <VoiceInput value={trackId} onChange={setTrackId} placeholder="KT-001 or 0300..." />
          <button onClick={handleTrack} className="px-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm touch-target active:scale-95 shrink-0">
            {isUrdu ? 'تلاش' : 'Track'}
          </button>
        </div>

        {trackResult && !trackResult.error && (
          <div className="mt-4 space-y-3">
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
              <p className="font-bold">{trackResult.customer.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{trackResult.customer.customerId}</p>
            </div>
            {trackResult.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{isUrdu ? 'کوئی آرڈر نہیں ملا' : 'No orders found'}</p>
            ) : (
              trackResult.orders.map((order: any) => {
                const isDelivered = !!order.deliveredAt;
                const balance = order.totalAmount - order.advancePaid;
                return (
                  <div key={order.id} className={`rounded-xl p-4 border space-y-3 ${isDelivered ? 'bg-success/5 border-success/20' : 'bg-card border-border'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{isUrdu ? 'ڈیلیوری' : 'Delivery'}: {new Date(order.deadline).toLocaleDateString()}</p>
                        {order.totalAmount > 0 && (
                          <p className="text-xs mt-0.5">
                            {isUrdu ? 'کل' : 'Total'}: Rs {order.totalAmount.toLocaleString()}
                            {balance > 0 && <span className="text-destructive ml-2">{isUrdu ? 'بقایا' : 'Due'}: Rs {balance.toLocaleString()}</span>}
                          </p>
                        )}
                      </div>
                      {isDelivered && <span className="text-xs font-bold px-2 py-1 rounded-full bg-success text-success-foreground">✅ {isUrdu ? 'حوالے' : 'Delivered'}</span>}
                    </div>
                    <div className="space-y-2">
                      {order.suits.map((suit: any, i: number) => {
                        const types: Record<string, string> = { full_suit: isUrdu ? 'فل سوٹ' : 'Full Suit', kameez: isUrdu ? 'قمیض' : 'Kameez', shalwar: isUrdu ? 'شلوار' : 'Shalwar' };
                        const progress = ['received', 'cutting', 'stitching', 'finishing', 'packed', 'ready', 'delivered'];
                        const pct = Math.round(((progress.indexOf(suit.status) + 1) / progress.length) * 100);
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
                  </div>
                );
              })
            )}
          </div>
        )}
        {trackResult?.error && (
          <div className="mt-4 text-center py-6">
            <p className="text-destructive font-semibold text-sm">{isUrdu ? 'کسٹمر نہیں ملا' : 'Customer not found'}</p>
            <p className="text-xs text-muted-foreground mt-1">{isUrdu ? 'اپنا آئی ڈی یا فون نمبر چیک کریں' : 'Please check your ID or phone number'}</p>
          </div>
        )}
      </div>
    </div>
  );

  if (section === 'order') return (
    <div className="space-y-4 pb-4">
      <button onClick={() => { setSection('home'); setOrderSubmitted(false); }} className="flex items-center gap-1 text-sm text-primary font-semibold">
        <ChevronLeft size={16} /> {isUrdu ? 'واپس' : 'Back'}
      </button>

      {orderSubmitted ? (
        <div className="bg-success/5 border border-success/20 rounded-2xl p-8 text-center space-y-3">
          <CheckCircle2 size={48} className="text-success mx-auto" />
          <h3 className="font-bold text-lg">{isUrdu ? 'آرڈر موصول ہو گیا!' : 'Order Received!'}</h3>
          <p className="text-sm text-muted-foreground">{isUrdu ? 'ہم جلد آپ سے رابطہ کریں گے' : 'We will contact you shortly to confirm'}</p>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={sendWhatsAppOrder} className="px-4 py-2 bg-success text-success-foreground rounded-xl text-sm font-semibold flex items-center gap-2 active:scale-95">
              <MessageCircle size={16} /> {isUrdu ? 'واٹس ایپ پر بھیجیں' : 'Send via WhatsApp'}
            </button>
            <button onClick={() => { setSection('home'); setOrderSubmitted(false); }} className="px-4 py-2 bg-muted rounded-xl text-sm font-semibold active:scale-95">
              {isUrdu ? 'واپس' : 'Done'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl p-5 border border-border space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ShoppingBag size={18} className="text-primary" /> {isUrdu ? 'آن لائن آرڈر' : 'Place Order'}
          </h3>
          <div>
            <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'نام' : 'Name'} *</label>
            <VoiceInput value={orderName} onChange={setOrderName} placeholder={isUrdu ? 'آپ کا نام' : 'Your name'} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'فون نمبر' : 'Phone'} *</label>
            <VoiceInput value={orderPhone} onChange={setOrderPhone} type="tel" placeholder="03XX-XXXXXXX" />
          </div>
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
            {isUrdu ? 'ڈیزائن ورک چاہیے' : 'Need Design Work'}
          </label>
          <div>
            <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'تفصیلات / نوٹس' : 'Details / Notes'}</label>
            <VoiceInput value={orderNotes} onChange={setOrderNotes} multiline rows={3} placeholder={isUrdu ? 'فیبرک، ڈیزائن وغیرہ...' : 'Fabric, design preferences...'} append />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={sendWhatsAppOrder} className="flex-1 py-3 bg-success/10 text-success rounded-xl font-semibold text-sm touch-target active:scale-95 flex items-center justify-center gap-2">
              <MessageCircle size={16} /> WhatsApp
            </button>
            <button onClick={handleOrderSubmit} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm touch-target active:scale-95 flex items-center justify-center gap-2">
              <Send size={16} /> {isUrdu ? 'آرڈر دیں' : 'Submit Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (section === 'measurements') return (
    <div className="space-y-4 pb-4">
      <button onClick={() => { setSection('home'); setMeasSubmitted(false); }} className="flex items-center gap-1 text-sm text-primary font-semibold">
        <ChevronLeft size={16} /> {isUrdu ? 'واپس' : 'Back'}
      </button>

      {measSubmitted ? (
        <div className="bg-success/5 border border-success/20 rounded-2xl p-8 text-center space-y-3">
          <CheckCircle2 size={48} className="text-success mx-auto" />
          <h3 className="font-bold text-lg">{isUrdu ? 'ناپ موصول ہو گئے!' : 'Measurements Received!'}</h3>
          <p className="text-sm text-muted-foreground">{isUrdu ? 'آپ کے ناپ محفوظ ہو گئے ہیں' : 'Your measurements have been saved'}</p>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={sendWhatsAppMeasurements} className="px-4 py-2 bg-success text-success-foreground rounded-xl text-sm font-semibold flex items-center gap-2 active:scale-95">
              <MessageCircle size={16} /> {isUrdu ? 'واٹس ایپ پر بھی بھیجیں' : 'Also send via WhatsApp'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl p-5 border border-border space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Ruler size={18} className="text-primary" /> {isUrdu ? 'ناپ بھیجیں' : 'Send Measurements'}
          </h3>
          <div>
            <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'نام' : 'Name'} *</label>
            <VoiceInput value={measName} onChange={setMeasName} placeholder={isUrdu ? 'آپ کا نام' : 'Your name'} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'فون نمبر' : 'Phone'} *</label>
            <VoiceInput value={measPhone} onChange={setMeasPhone} type="tel" placeholder="03XX-XXXXXXX" />
          </div>

          {/* Kameez */}
          <div>
            <h4 className="font-semibold text-sm mb-2 text-primary">{isUrdu ? 'قمیض' : 'Kameez'}</h4>
            <div className="grid grid-cols-2 gap-2">
              {kameezFields.map(f => (
                <div key={f.key}>
                  <label className="text-[10px] text-muted-foreground">{isUrdu ? f.ur : f.en}</label>
                  <input
                    type="text" inputMode="decimal"
                    value={(measurements as any)[f.key] || ''}
                    onChange={e => setMeasurements({ ...measurements, [f.key]: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target"
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Shalwar */}
          <div>
            <h4 className="font-semibold text-sm mb-2 text-primary">{isUrdu ? 'شلوار' : 'Shalwar'}</h4>
            <div className="grid grid-cols-2 gap-2">
              {shalwarFields.map(f => (
                <div key={f.key}>
                  <label className="text-[10px] text-muted-foreground">{isUrdu ? f.ur : f.en}</label>
                  <input
                    type="text" inputMode="decimal"
                    value={(measurements as any)[f.key] || ''}
                    onChange={e => setMeasurements({ ...measurements, [f.key]: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target"
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'نوٹس' : 'Notes'}</label>
            <VoiceInput value={measurements.notes} onChange={v => setMeasurements({ ...measurements, notes: v })} multiline rows={2} append placeholder={isUrdu ? 'خاص ہدایات...' : 'Special instructions...'} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={sendWhatsAppMeasurements} className="flex-1 py-3 bg-success/10 text-success rounded-xl font-semibold text-sm touch-target active:scale-95 flex items-center justify-center gap-2">
              <MessageCircle size={16} /> WhatsApp
            </button>
            <button onClick={handleMeasSubmit} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm touch-target active:scale-95 flex items-center justify-center gap-2">
              <Send size={16} /> {isUrdu ? 'بھیجیں' : 'Submit'}
            </button>
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
        <h2 className="text-2xl font-bold mb-1">{t('portal.welcome')}</h2>
        <p className="text-sm opacity-80 mb-1">{isUrdu ? 'معیاری سلائی 1995 سے' : 'Quality Tailoring Since 1995'}</p>
        <div className="flex items-center justify-center gap-1 text-xs opacity-70 mb-4">
          <Star size={12} /> <Star size={12} /> <Star size={12} /> <Star size={12} /> <Star size={12} />
          <span className="ml-1">4.9/5</span>
        </div>
        <div className="flex gap-3 justify-center">
          <a href={`https://wa.me/${SHOP_PHONE.replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-success text-success-foreground rounded-xl text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform">
            <MessageCircle size={16} /> WhatsApp
          </a>
          <a href={`tel:${SHOP_PHONE}`} className="px-5 py-2.5 bg-card/20 rounded-xl text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform">
            <Phone size={16} /> {isUrdu ? 'کال' : 'Call'}
          </a>
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
          <span className="text-xs font-semibold text-center">{isUrdu ? 'ناپ بھیجیں' : 'Send Measurements'}</span>
        </button>
      </div>

      {/* Design Gallery */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 pb-2 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <Image size={16} className="text-primary" /> {t('portal.designs')}
          </h3>
          <div className="flex gap-1">
            <button onClick={() => setGalleryIdx(Math.max(0, galleryIdx - 1))} className="p-1.5 rounded-lg bg-muted text-muted-foreground disabled:opacity-30" disabled={galleryIdx === 0}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setGalleryIdx(Math.min(designs.length - 1, galleryIdx + 1))} className="p-1.5 rounded-lg bg-muted text-muted-foreground disabled:opacity-30" disabled={galleryIdx === designs.length - 1}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="relative">
          <img src={designs[galleryIdx].img} alt={designs[galleryIdx].en} className="w-full h-64 object-cover" loading="lazy" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="font-bold text-white">{isUrdu ? designs[galleryIdx].ur : designs[galleryIdx].en}</p>
            <p className="text-sm text-white/80">{designs[galleryIdx].price}</p>
          </div>
        </div>
        <div className="flex gap-2 p-3 overflow-x-auto">
          {designs.map((d, i) => (
            <button key={i} onClick={() => setGalleryIdx(i)} className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === galleryIdx ? 'border-primary' : 'border-transparent opacity-60'}`}>
              <img src={d.img} alt={d.en} className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      {/* Prices */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Scissors size={16} className="text-primary" /> {t('portal.prices')}
        </h3>
        <div className="space-y-0">
          {prices.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{isUrdu ? p.ur : p.en}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10} /> {p.detail}</p>
              </div>
              <span className="font-bold text-sm text-primary">{p.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Shop Info */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-3">
        <h3 className="font-bold flex items-center gap-2">
          <MapPin size={16} className="text-primary" /> {isUrdu ? 'ہماری دکان' : 'Our Shop'}
        </h3>
        <div className="space-y-1.5 text-sm">
          <p className="flex items-center gap-2 text-muted-foreground"><MapPin size={14} /> {SHOP_ADDRESS}</p>
          <p className="flex items-center gap-2 text-muted-foreground"><Phone size={14} /> {SHOP_PHONE}</p>
          <p className="flex items-center gap-2 text-muted-foreground"><Clock size={14} /> {SHOP_HOURS}</p>
        </div>
        {/* Map Embed */}
        <div className="rounded-xl overflow-hidden border border-border">
          <iframe
            src={GOOGLE_MAPS_EMBED}
            width="100%" height="200" style={{ border: 0 }}
            allowFullScreen loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Shop Location"
          />
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SHOP_ADDRESS)}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-semibold active:scale-95 transition-transform"
        >
          📍 {isUrdu ? 'نقشے میں دیکھیں' : 'Open in Maps'}
        </a>
      </div>

      {/* WhatsApp CTA */}
      <a href={`https://wa.me/${SHOP_PHONE.replace('+', '')}`} target="_blank" rel="noopener noreferrer"
        className="block w-full py-4 bg-success text-success-foreground rounded-xl font-bold text-center text-base active:scale-95 transition-transform">
        <MessageCircle size={20} className="inline mr-2" />
        {isUrdu ? 'واٹس ایپ پر رابطہ کریں' : 'Chat on WhatsApp'}
      </a>
    </div>
  );
}
