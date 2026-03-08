import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import StatusBadge from '@/components/StatusBadge';
import { getWhatsAppLink, getReadyForPickupMessage } from '@/lib/notifications';
import { CheckCircle, MessageCircle, Package, MapPin } from 'lucide-react';

export default function ReadySuits() {
  const { t, lang, isUrdu } = useLang();
  const { data, updateOrder } = useData();

  const readyOrders = data.orders.filter(o =>
    !o.deliveredAt && o.suits.some(s => s.status === 'ready' || s.status === 'packed')
  );

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
      </div>

      {readyOrders.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle size={48} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{isUrdu ? 'ابھی کوئی تیار سوٹ نہیں' : 'No suits ready for pickup'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {readyOrders.map(order => {
            const customer = data.customers.find(c => c.id === order.customerId);
            const readySuits = order.suits.filter(s => s.status === 'ready' || s.status === 'packed');
            const balance = order.totalAmount - order.advancePaid;

            return (
              <div key={order.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{customer?.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{customer?.customerId}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-success/10 text-success">
                    {readySuits.length} {isUrdu ? 'تیار' : 'Ready'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {order.suits.map((suit, i) => (
                    <div key={suit.id} className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                        <StatusBadge status={suit.status} />
                      </div>
                      {suit.location && (suit.location.box || suit.location.line || suit.location.khanna) && (
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground ml-3 bg-muted/50 rounded px-1.5 py-0.5">
                          <MapPin size={8} />
                          {suit.location.box && <span>{isUrdu ? 'باکس' : 'Box'}: {suit.location.box}</span>}
                          {suit.location.line && <span>{isUrdu ? 'لائن' : 'Line'}: {suit.location.line}</span>}
                          {suit.location.khanna && <span>{isUrdu ? 'خانہ' : 'Khanna'}: {suit.location.khanna}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {balance > 0 && (
                  <p className="text-sm text-destructive font-semibold">
                    {isUrdu ? 'بقایا' : 'Balance'}: Rs {balance.toLocaleString()}
                  </p>
                )}

                <div className="flex gap-2">
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
