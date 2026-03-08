import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import StatusBadge from '@/components/StatusBadge';
import { getWhatsAppLink, getReadyForPickupMessage } from '@/lib/notifications';
import { CheckCircle, MessageCircle, Package, MapPin, Search } from 'lucide-react';

export default function ReadySuits() {
  const { t, lang, isUrdu } = useLang();
  const { data, updateOrder } = useData();
  const [locationSearch, setLocationSearch] = useState('');

  const readyOrders = data.orders.filter(o =>
    !o.deliveredAt && o.suits.some(s => s.status === 'ready' || s.status === 'packed')
  );

  // Filter by location search
  const filtered = locationSearch.trim()
    ? readyOrders.filter(o =>
        o.suits.some(s => {
          if (!s.location) return false;
          const q = locationSearch.toLowerCase();
          return (
            (s.location.box || '').toLowerCase().includes(q) ||
            (s.location.line || '').toLowerCase().includes(q) ||
            (s.location.khanna || '').toLowerCase().includes(q)
          );
        })
      )
    : readyOrders;

  const markDelivered = (orderId: string) => {
    const order = data.orders.find(o => o.id === orderId);
    if (!order) return;
    const newSuits = order.suits.map(s => ({ ...s, status: 'delivered' as const }));
    updateOrder(orderId, { suits: newSuits, deliveredAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2 mb-1">
        <Package size={22} className="text-primary" />
        <h2 className="text-lg font-bold">{isUrdu ? 'تیار سوٹ' : 'Ready Suits'}</h2>
        <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
          {readyOrders.length}
        </span>
      </div>

      {/* Location Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={locationSearch}
          onChange={e => setLocationSearch(e.target.value)}
          placeholder={isUrdu ? 'باکس، لائن، خانہ نمبر سے تلاش کریں...' : 'Search by box, line, khanna number...'}
          className="w-full pl-9 pr-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle size={48} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {locationSearch
              ? (isUrdu ? 'اس جگہ پر کوئی سوٹ نہیں ملا' : 'No suits found at this location')
              : (isUrdu ? 'ابھی کوئی تیار سوٹ نہیں' : 'No suits ready for pickup')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const customer = data.customers.find(c => c.id === order.customerId);
            const readySuits = order.suits.filter(s => s.status === 'ready' || s.status === 'packed');
            const balance = order.totalAmount - order.advancePaid;

            return (
              <div key={order.id} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Header */}
                <div className="p-4 pb-2 flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{customer?.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{customer?.customerId}</p>
                    {customer?.phone && <p className="text-[10px] text-muted-foreground">{customer.phone}</p>}
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-success/10 text-success">
                    {readySuits.length} {isUrdu ? 'تیار' : 'Ready'}
                  </span>
                </div>

                {/* Location Cards - Prominent Display */}
                <div className="px-4 pb-2 space-y-2">
                  {order.suits.map((suit, i) => {
                    const hasLocation = suit.location && (suit.location.box || suit.location.line || suit.location.khanna);
                    const suitTypes: Record<string, string> = {
                      full_suit: isUrdu ? 'فل سوٹ' : 'Full Suit',
                      kameez: isUrdu ? 'قمیض' : 'Kameez',
                      shalwar: isUrdu ? 'شلوار' : 'Shalwar',
                    };
                    return (
                      <div key={suit.id} className="bg-background rounded-lg border border-border p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">#{i + 1}</span>
                            <span className="text-xs font-medium">{suitTypes[suit.type]}</span>
                            <StatusBadge status={suit.status} />
                          </div>
                        </div>
                        {hasLocation ? (
                          <div className="flex items-center gap-3 mt-1 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                            <MapPin size={16} className="text-primary shrink-0" />
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
                              {suit.location!.box && (
                                <span><span className="text-muted-foreground text-[10px]">{isUrdu ? 'باکس' : 'BOX'}</span> <strong>{suit.location!.box}</strong></span>
                              )}
                              {suit.location!.line && (
                                <span><span className="text-muted-foreground text-[10px]">{isUrdu ? 'لائن' : 'LINE'}</span> <strong>{suit.location!.line}</strong></span>
                              )}
                              {suit.location!.khanna && (
                                <span><span className="text-muted-foreground text-[10px]">{isUrdu ? 'خانہ' : 'KHANNA'}</span> <strong>{suit.location!.khanna}</strong></span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground mt-1 italic flex items-center gap-1">
                            <MapPin size={10} /> {isUrdu ? 'جگہ درج نہیں' : 'No location set'}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {balance > 0 && (
                  <div className="px-4 pb-2">
                    <p className="text-sm text-destructive font-semibold">
                      {isUrdu ? 'بقایا' : 'Balance'}: Rs {balance.toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="px-4 pb-3 flex gap-2">
                  {customer?.phone && (
                    <a
                      href={getWhatsAppLink(customer.phone, getReadyForPickupMessage(customer.name, lang))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 rounded-xl bg-success/10 text-success font-semibold text-sm flex items-center justify-center gap-2 touch-target active:scale-95 transition-transform"
                    >
                      <MessageCircle size={16} /> {isUrdu ? 'واٹس ایپ' : 'WhatsApp'}
                    </a>
                  )}
                  <button
                    onClick={() => markDelivered(order.id)}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 touch-target active:scale-95 transition-transform"
                  >
                    <CheckCircle size={16} /> {isUrdu ? 'حوالے کریں' : 'Mark Delivered'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
