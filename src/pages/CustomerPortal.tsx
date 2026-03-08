import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { MapPin, Phone, MessageCircle, Scissors, Search } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

const SHOP_PHONE = '+923001234567';
const SHOP_ADDRESS = 'Shop #12, Tariq Road, Karachi';

const prices = [
  { en: 'Shalwar Kameez (Simple)', ur: 'سادہ شلوار قمیض', price: 'Rs 2,500' },
  { en: 'Shalwar Kameez (Design)', ur: 'ڈیزائن شلوار قمیض', price: 'Rs 3,500' },
  { en: 'Waistcoat', ur: 'واسکٹ', price: 'Rs 2,000' },
  { en: 'Kurta Pajama', ur: 'کرتا پاجامہ', price: 'Rs 3,000' },
  { en: 'Sherwani', ur: 'شیروانی', price: 'Rs 15,000+' },
];

export default function CustomerPortal() {
  const { t, lang, isUrdu } = useLang();
  const { data } = useData();
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);

  const handleTrack = () => {
    const customer = data.customers.find(c => c.customerId.toLowerCase() === trackId.toLowerCase() || c.phone === trackId);
    if (customer) {
      const orders = data.orders.filter(o => o.customerId === customer.id && !o.deliveredAt);
      setTrackResult({ customer, orders });
    } else {
      setTrackResult({ error: true });
    }
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground rounded-2xl p-6 text-center -mx-4 -mt-4">
        <div className="text-4xl mb-2">✂️</div>
        <h2 className={`text-xl font-bold mb-1 ${isUrdu ? 'font-urdu' : ''}`}>{t('portal.welcome')}</h2>
        <p className="text-sm opacity-80">Quality tailoring since 1995</p>
        <div className="flex gap-3 justify-center mt-4">
          <a href={`https://wa.me/${SHOP_PHONE.replace('+', '')}`} target="_blank" rel="noopener" className="px-4 py-2 bg-success text-success-foreground rounded-xl text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform">
            <MessageCircle size={16} /> WhatsApp
          </a>
          <a href={`tel:${SHOP_PHONE}`} className="px-4 py-2 bg-card/20 rounded-xl text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform">
            <Phone size={16} /> Call
          </a>
        </div>
      </div>

      {/* Track Order */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Search size={16} /> {t('portal.track')}
        </h3>
        <div className="flex gap-2">
          <input
            value={trackId}
            onChange={e => setTrackId(e.target.value)}
            placeholder="KT-0001 or phone..."
            className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target"
          />
          <button onClick={handleTrack} className="px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm touch-target active:scale-95">
            Track
          </button>
        </div>
        {trackResult && !trackResult.error && (
          <div className="mt-3 space-y-2">
            <p className="font-semibold text-sm">{trackResult.customer.name}</p>
            {trackResult.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active orders</p>
            ) : (
              trackResult.orders.map((order: any) => (
                <div key={order.id} className="bg-background rounded-lg p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Delivery: {new Date(order.deadline).toLocaleDateString()}</p>
                  <div className="flex flex-wrap gap-2">
                    {order.suits.map((suit: any, i: number) => (
                      <div key={suit.id} className="flex items-center gap-1">
                        <span className="text-[10px]">#{i + 1}</span>
                        <StatusBadge status={suit.status} />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {trackResult?.error && (
          <p className="mt-3 text-sm text-destructive">Customer not found. Check your ID or phone number.</p>
        )}
      </div>

      {/* Prices */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Scissors size={16} /> {t('portal.prices')}
        </h3>
        <div className="space-y-2">
          {prices.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm">{isUrdu ? p.ur : p.en}</span>
              <span className="font-bold text-sm text-primary">{p.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <MapPin size={16} /> {t('portal.contact')}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">{SHOP_ADDRESS}</p>
        <p className="text-sm text-muted-foreground">{SHOP_PHONE}</p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SHOP_ADDRESS)}`}
          target="_blank"
          rel="noopener"
          className="inline-block mt-3 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-semibold active:scale-95 transition-transform"
        >
          📍 Open in Maps
        </a>
      </div>
    </div>
  );
}
