import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { getDeadlineStatus, generateId } from '@/lib/store';
import type { Order, OrderSuit, SuitStatus } from '@/lib/store';
import { getWhatsAppLink, getDeadlineReminderMessage, getReadyForPickupMessage, getPaymentReminderMessage } from '@/lib/notifications';
import { printReceipt } from '@/lib/printReceipt';
import SearchBar from '@/components/SearchBar';
import StatusBadge from '@/components/StatusBadge';
import { Plus, X, MessageCircle, Printer } from 'lucide-react';

const ALL_STATUSES: SuitStatus[] = ['received', 'cutting', 'stitching', 'finishing', 'packed', 'ready', 'delivered'];

function nextStatus(s: SuitStatus): SuitStatus {
  const i = ALL_STATUSES.indexOf(s);
  return ALL_STATUSES[Math.min(i + 1, ALL_STATUSES.length - 1)];
}

export default function Orders() {
  const { t, lang } = useLang();
  const { data, addOrder, updateOrder, deleteOrder } = useData();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [suits, setSuits] = useState<OrderSuit[]>([]);

  const filtered = data.orders.filter(o => {
    const customer = data.customers.find(c => c.id === o.customerId);
    if (!customer) return false;
    const q = search.toLowerCase();
    return customer.name.toLowerCase().includes(q) || customer.customerId.toLowerCase().includes(q) || customer.phone.includes(q);
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const openNew = () => {
    setEditingOrder(null);
    setCustomerId(data.customers[0]?.id || '');
    setDeadline(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
    setTotalAmount('');
    setAdvancePaid('');
    setSuits([{ id: generateId(), status: 'received', type: 'full_suit', designWork: false, notes: '' }]);
    setShowForm(true);
  };

  const openEdit = (o: Order) => {
    setEditingOrder(o);
    setCustomerId(o.customerId);
    setDeadline(o.deadline.slice(0, 10));
    setTotalAmount(String(o.totalAmount));
    setAdvancePaid(String(o.advancePaid));
    setSuits([...o.suits]);
    setShowForm(true);
  };

  const addSuit = () => {
    setSuits([...suits, { id: generateId(), status: 'received', type: 'full_suit', designWork: false, notes: '' }]);
  };

  const updateSuit = (idx: number, patch: Partial<OrderSuit>) => {
    setSuits(suits.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };

  const removeSuit = (idx: number) => {
    if (suits.length > 1) setSuits(suits.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!customerId || !deadline) return;
    const total = Number(totalAmount) || 0;
    const advance = Number(advancePaid) || 0;
    const paymentStatus = advance >= total ? 'paid' : advance > 0 ? 'advance' : 'pending';

    if (editingOrder) {
      updateOrder(editingOrder.id, { customerId, deadline, totalAmount: total, advancePaid: advance, paymentStatus: paymentStatus as any, suits });
    } else {
      addOrder({ customerId, deadline, totalAmount: total, advancePaid: advance, paymentStatus: paymentStatus as any, suits });
    }
    setShowForm(false);
  };

  const cycleSuitStatus = (orderId: string, suitId: string) => {
    const order = data.orders.find(o => o.id === orderId);
    if (!order) return;
    const newSuits = order.suits.map(s => s.id === suitId ? { ...s, status: nextStatus(s.status) } : s);
    const allDelivered = newSuits.every(s => s.status === 'delivered');
    updateOrder(orderId, { suits: newSuits, deliveredAt: allDelivered ? new Date().toISOString() : undefined });
  };

  const handlePrint = (order: Order) => {
    const customer = data.customers.find(c => c.id === order.customerId);
    if (!customer) return;
    printReceipt({ order, customer, lang });
  };

  return (
    <div className="space-y-4 pb-4">
      <SearchBar value={search} onChange={setSearch} />

      <button onClick={openNew} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 touch-target active:scale-[0.98] transition-transform">
        <Plus size={20} /> {t('order.new')}
      </button>

      <div className="space-y-3">
        {filtered.map(order => {
          const customer = data.customers.find(c => c.id === order.customerId);
          const dlStatus = getDeadlineStatus(order.deadline);
          const balance = order.totalAmount - order.advancePaid;

          return (
            <div key={order.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4" onClick={() => openEdit(order)}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{customer?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground font-mono">{customer?.customerId}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      dlStatus === 'overdue' ? 'bg-destructive text-destructive-foreground' :
                      dlStatus === 'urgent' ? 'bg-warning text-warning-foreground' :
                      dlStatus === 'approaching' ? 'bg-accent text-accent-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {new Date(order.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{order.suits.length} {t('order.suits')}</span>
                  <span>Rs {order.totalAmount.toLocaleString()}</span>
                  {balance > 0 && <span className="text-destructive font-semibold">Due: Rs {balance.toLocaleString()}</span>}
                </div>
              </div>
              <div className="px-4 pb-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {order.suits.map((suit, i) => (
                    <div key={suit.id} className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                      <StatusBadge status={suit.status} onClick={() => cycleSuitStatus(order.id, suit.id)} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Print Receipt */}
                  <button onClick={() => handlePrint(order)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold active:scale-95 transition-transform">
                    <Printer size={12} /> {lang === 'ur' ? 'رسید' : 'Receipt'}
                  </button>
                  {customer?.phone && (
                    <>
                      {(dlStatus === 'overdue' || dlStatus === 'urgent' || dlStatus === 'approaching') && (
                        <a href={getWhatsAppLink(customer.phone, getDeadlineReminderMessage(customer.name, order.deadline, lang))} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 text-success text-[10px] font-semibold active:scale-95 transition-transform">
                          <MessageCircle size={12} /> {lang === 'ur' ? 'یاد دہانی' : 'Reminder'}
                        </a>
                      )}
                      {order.suits.every(s => s.status === 'ready' || s.status === 'delivered') && !order.deliveredAt && (
                        <a href={getWhatsAppLink(customer.phone, getReadyForPickupMessage(customer.name, lang))} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 text-success text-[10px] font-semibold active:scale-95 transition-transform">
                          <MessageCircle size={12} /> {lang === 'ur' ? 'تیار پیغام' : 'Ready Msg'}
                        </a>
                      )}
                      {balance > 0 && (
                        <a href={getWhatsAppLink(customer.phone, getPaymentReminderMessage(customer.name, balance, lang))} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/10 text-warning text-[10px] font-semibold active:scale-95 transition-transform">
                          <MessageCircle size={12} /> {lang === 'ur' ? 'بقایا' : 'Payment'}
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No orders found</p>}
      </div>

      {/* Order Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg">{editingOrder ? t('common.edit') : t('order.new')}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 touch-target"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              {/* Customer Select */}
              <div>
                <label className="text-xs text-muted-foreground font-medium">{t('nav.customers')} *</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target">
                  {data.customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.customerId})</option>
                  ))}
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="text-xs text-muted-foreground font-medium">{t('order.delivery')} *</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">{t('common.total')} (Rs)</label>
                  <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">{t('common.advance')} (Rs)</label>
                  <input type="number" value={advancePaid} onChange={e => setAdvancePaid(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
                </div>
              </div>

              {/* Suits */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{t('order.suits')}</h3>
                  <button onClick={addSuit} className="text-xs text-primary font-semibold px-3 py-1 rounded-lg bg-primary/10 touch-target">+ Add Suit</button>
                </div>
                <div className="space-y-3">
                  {suits.map((suit, idx) => (
                    <div key={suit.id} className="bg-background rounded-xl p-3 border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Suit #{idx + 1}</span>
                        {suits.length > 1 && (
                          <button onClick={() => removeSuit(idx)} className="text-destructive text-xs">Remove</button>
                        )}
                      </div>
                      <select value={suit.type} onChange={e => updateSuit(idx, { type: e.target.value as any })} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm">
                        <option value="full_suit">Full Suit</option>
                        <option value="kameez">Kameez Only</option>
                        <option value="shalwar">Shalwar Only</option>
                      </select>
                      <select value={suit.workerId || ''} onChange={e => updateSuit(idx, { workerId: e.target.value || undefined })} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm">
                        <option value="">Assign Worker...</option>
                        {data.workers.filter(w => w.active).map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={suit.designWork} onChange={e => updateSuit(idx, { designWork: e.target.checked })} className="rounded" />
                        Design Work
                      </label>
                      {editingOrder && (
                        <select value={suit.status} onChange={e => updateSuit(idx, { status: e.target.value as SuitStatus })} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm">
                          {ALL_STATUSES.map(s => (
                            <option key={s} value={s}>{t(`status.${s}`)}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                {editingOrder && (
                  <button onClick={() => { deleteOrder(editingOrder.id); setShowForm(false); }} className="flex-1 py-3 rounded-xl border border-destructive text-destructive font-semibold touch-target active:scale-95">
                    {t('common.delete')}
                  </button>
                )}
                <button onClick={handleSave} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold touch-target active:scale-95 transition-transform">
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
