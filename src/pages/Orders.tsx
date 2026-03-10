import { useState, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { getDeadlineStatus, generateId } from '@/lib/store';
import type { Order, OrderSuit, SuitStatus, StatusChange, SuitLocation } from '@/lib/store';
import { getWhatsAppLink, getDeadlineReminderMessage, getReadyForPickupMessage, getPaymentReminderMessage } from '@/lib/notifications';
import { printReceipt, getReceiptWhatsAppLink } from '@/lib/printReceipt';
import SearchBar from '@/components/SearchBar';
import StatusBadge from '@/components/StatusBadge';
import { Plus, X, MessageCircle, Printer, Clock, Filter, MapPin } from 'lucide-react';
import VoiceInput from '@/components/VoiceInput';

const ALL_STATUSES: SuitStatus[] = ['received', 'cutting', 'stitching', 'finishing', 'packed', 'ready', 'delivered'];

function nextStatus(s: SuitStatus): SuitStatus {
  const i = ALL_STATUSES.indexOf(s);
  return ALL_STATUSES[Math.min(i + 1, ALL_STATUSES.length - 1)];
}

const statusEmoji: Record<SuitStatus, string> = {
  received: '📥', cutting: '✂️', stitching: '🧵', finishing: '✨', packed: '📦', ready: '✅', delivered: '🤝',
};

function SuitTimeline({ suit, t, isUrdu }: { suit: OrderSuit; t: (k: string) => string; isUrdu: boolean }) {
  const history = suit.statusHistory || [];
  if (history.length === 0) return null;

  return (
    <div className="space-y-1 py-2">
      {history.map((h, i) => {
        const isLast = i === history.length - 1;
        return (
          <div key={i} className="flex items-start gap-2">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isLast ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {statusEmoji[h.status]}
              </div>
              {i < history.length - 1 && <div className="w-0.5 h-4 bg-border" />}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <p className={`text-xs font-semibold ${isLast ? 'text-primary' : 'text-foreground'}`}>{t(`status.${h.status}`)}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Orders() {
  const { t, lang, isUrdu } = useLang();
  const { data, addOrder, updateOrder, deleteOrder } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'delivered' | 'overdue'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showTimeline, setShowTimeline] = useState<Order | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [suits, setSuits] = useState<OrderSuit[]>([]);
  const [notes, setNotes] = useState('');

  const filtered = data.orders.filter(o => {
    const customer = data.customers.find(c => c.id === o.customerId);
    if (!customer) return false;
    const q = search.toLowerCase();
    if (q && !(customer.name.toLowerCase().includes(q) || customer.customerId.toLowerCase().includes(q) || customer.phone.includes(q))) return false;

    // Status filter
    if (statusFilter === 'active' && o.deliveredAt) return false;
    if (statusFilter === 'delivered' && !o.deliveredAt) return false;
    if (statusFilter === 'overdue' && getDeadlineStatus(o.deadline) !== 'overdue') return false;

    // Date range filter
    if (dateFrom && new Date(o.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(o.createdAt) > new Date(dateTo + 'T23:59:59')) return false;

    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const openNew = () => {
    setEditingOrder(null);
    setCustomerId(data.customers[0]?.id || '');
    setDeadline(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
    setTotalAmount('');
    setAdvancePaid('');
    setNotes('');
    setSuits([{
      id: generateId(), status: 'received', type: 'full_suit', designWork: false, notes: '',
      statusHistory: [{ status: 'received', timestamp: new Date().toISOString() }],
      workers: {},
    }]);
    setShowForm(true);
  };

  const openEdit = (o: Order) => {
    setEditingOrder(o);
    setCustomerId(o.customerId);
    setDeadline(o.deadline.slice(0, 10));
    setTotalAmount(String(o.totalAmount));
    setAdvancePaid(String(o.advancePaid));
    setNotes(o.notes || '');
    setSuits([...o.suits]);
    setShowForm(true);
  };

  const addSuit = () => {
    setSuits([...suits, {
      id: generateId(), status: 'received', type: 'full_suit', designWork: false, notes: '',
      statusHistory: [{ status: 'received', timestamp: new Date().toISOString() }],
      workers: {},
    }]);
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
      updateOrder(editingOrder.id, { customerId, deadline, totalAmount: total, advancePaid: advance, paymentStatus: paymentStatus as Order['paymentStatus'], suits, notes });
    } else {
      addOrder({ customerId, deadline, totalAmount: total, advancePaid: advance, paymentStatus: paymentStatus as Order['paymentStatus'], suits, notes, paymentHistory: advance > 0 ? [{ id: Date.now().toString(36), amount: advance, date: new Date().toISOString(), method: 'cash' as const, note: isUrdu ? 'پیشگی' : 'Advance' }] : [] });
    }
    setShowForm(false);
  };

  const cycleSuitStatus = (orderId: string, suitId: string) => {
    const order = data.orders.find(o => o.id === orderId);
    if (!order) return;
    const now = new Date().toISOString();
    const newSuits = order.suits.map(s => {
      if (s.id !== suitId) return s;
      const newStatus = nextStatus(s.status);
      const history: StatusChange[] = [...(s.statusHistory || []), { status: newStatus, timestamp: now }];
      return { ...s, status: newStatus, workerId: s.workers?.[newStatus], statusHistory: history };
    });
    const allDelivered = newSuits.every(s => s.status === 'delivered');
    updateOrder(orderId, { suits: newSuits, deliveredAt: allDelivered ? now : undefined });
  };

  const handlePrint = (order: Order) => {
    const customer = data.customers.find(c => c.id === order.customerId);
    if (!customer) return;
    printReceipt({ order, customer, lang });
  };

  return (
    <div className="space-y-4 pb-4">
      <SearchBar value={search} onChange={setSearch} />

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([['all', isUrdu ? 'سب' : 'All'], ['active', isUrdu ? 'فعال' : 'Active'], ['delivered', isUrdu ? 'مکمل' : 'Delivered'], ['overdue', isUrdu ? 'تاخیر' : 'Overdue']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {label}
              {key !== 'all' && <span className="ml-1 opacity-70">
                ({key === 'active' ? data.orders.filter(o => !o.deliveredAt).length : key === 'delivered' ? data.orders.filter(o => o.deliveredAt).length : data.orders.filter(o => getDeadlineStatus(o.deadline) === 'overdue').length})
              </span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder={isUrdu ? 'سے' : 'From'}
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder={isUrdu ? 'تک' : 'To'}
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="px-2 py-2 rounded-lg bg-muted text-muted-foreground text-xs">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <button onClick={openNew} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 touch-target active:scale-[0.98] transition-transform">
        <Plus size={20} /> {t('order.new')}
      </button>

      <div className="space-y-3">
        {filtered.map(order => {
          const customer = data.customers.find(c => c.id === order.customerId);
          const dlStatus = getDeadlineStatus(order.deadline);
          const balance = order.totalAmount - order.advancePaid;
          const daysLeft = Math.ceil((new Date(order.deadline).getTime() - Date.now()) / 86400000);

          return (
            <div key={order.id} className="premium-card rounded-xl border border-white/5 overflow-hidden">
              <div className="p-4" onClick={() => openEdit(order)}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{customer?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground font-mono">{customer?.customerId}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${dlStatus === 'overdue' ? 'bg-destructive text-destructive-foreground' :
                      dlStatus === 'urgent' ? 'bg-warning text-warning-foreground' :
                        dlStatus === 'approaching' ? 'bg-accent text-accent-foreground' :
                          'bg-muted text-muted-foreground'
                      }`}>
                      {new Date(order.deadline).toLocaleDateString()}
                    </span>
                    <p className={`text-[10px] font-semibold ${daysLeft < 0 ? 'text-destructive' : daysLeft <= 1 ? 'text-warning' : 'text-muted-foreground'}`}>
                      {daysLeft < 0 ? (isUrdu ? `${Math.abs(daysLeft)} دن گزر گئے` : `${Math.abs(daysLeft)}d overdue`) : daysLeft === 0 ? (isUrdu ? 'آج' : 'Today') : (isUrdu ? `${daysLeft} دن باقی` : `${daysLeft}d left`)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{order.suits.length} {t('order.suits')}</span>
                  <span>Rs {order.totalAmount.toLocaleString()}</span>
                  {balance > 0 && <span className="text-destructive font-semibold">{isUrdu ? 'بقایا' : 'Due'}: Rs {balance.toLocaleString()}</span>}
                </div>
                {order.notes && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">📝 {order.notes}</p>}
              </div>
              <div className="px-4 pb-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {order.suits.map((suit, i) => (
                    <div key={suit.id} className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                        <StatusBadge status={suit.status} onClick={() => cycleSuitStatus(order.id, suit.id)} />
                      </div>
                      {suit.location && (suit.location.box || suit.location.line || suit.location.khanna) && (
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground ml-3">
                          <MapPin size={8} />
                          {suit.location.box && <span>{isUrdu ? 'باکس' : 'Box'}: {suit.location.box}</span>}
                          {suit.location.line && <span>{isUrdu ? 'لائن' : 'Line'}: {suit.location.line}</span>}
                          {suit.location.khanna && <span>{isUrdu ? 'خانہ' : 'Khanna'}: {suit.location.khanna}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Print Receipt */}
                  <button onClick={() => handlePrint(order)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold active:scale-95 transition-transform">
                    <Printer size={12} /> {isUrdu ? 'پرنٹ' : 'Print'}
                  </button>
                  {/* WhatsApp Receipt */}
                  {customer?.phone && (
                    <a href={getReceiptWhatsAppLink({ order, customer, lang })} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 text-success text-[10px] font-semibold active:scale-95 transition-transform">
                      <MessageCircle size={12} /> {isUrdu ? 'رسید بھیجیں' : 'Send Receipt'}
                    </a>
                  )}
                  {/* Timeline */}
                  <button onClick={() => setShowTimeline(order)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-info/10 text-info text-[10px] font-semibold active:scale-95 transition-transform">
                    <Clock size={12} /> {isUrdu ? 'ٹائم لائن' : 'Timeline'}
                  </button>
                  {customer?.phone && (
                    <>
                      {(dlStatus === 'overdue' || dlStatus === 'urgent' || dlStatus === 'approaching') && (
                        <a href={getWhatsAppLink(customer.phone, getDeadlineReminderMessage(customer.name, order.deadline, lang))} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 text-success text-[10px] font-semibold active:scale-95 transition-transform">
                          <MessageCircle size={12} /> {isUrdu ? 'یاد دہانی' : 'Reminder'}
                        </a>
                      )}
                      {order.suits.every(s => s.status === 'ready' || s.status === 'delivered') && !order.deliveredAt && (
                        <a href={getWhatsAppLink(customer.phone, getReadyForPickupMessage(customer.name, lang))} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 text-success text-[10px] font-semibold active:scale-95 transition-transform">
                          <MessageCircle size={12} /> {isUrdu ? 'تیار پیغام' : 'Ready Msg'}
                        </a>
                      )}
                      {balance > 0 && (
                        <a href={getWhatsAppLink(customer.phone, getPaymentReminderMessage(customer.name, balance, lang))} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/10 text-warning text-[10px] font-semibold active:scale-95 transition-transform">
                          <MessageCircle size={12} /> {isUrdu ? 'بقایا' : 'Payment'}
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">{isUrdu ? 'کوئی آرڈر نہیں' : 'No orders found'}</p>}
      </div>

      {/* Timeline Modal */}
      {showTimeline && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center" onClick={() => setShowTimeline(null)}>
          <div className="premium-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <h2 className="font-bold text-lg">{isUrdu ? 'آرڈر ٹائم لائن' : 'Order Timeline'}</h2>
                <p className="text-xs text-muted-foreground">{data.customers.find(c => c.id === showTimeline.customerId)?.name}</p>
              </div>
              <button onClick={() => setShowTimeline(null)} className="p-2 touch-target"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              {showTimeline.suits.map((suit, i) => {
                const suitTypes: Record<string, string> = { full_suit: isUrdu ? 'فل سوٹ' : 'Full Suit', kameez: isUrdu ? 'قمیض' : 'Kameez', shalwar: isUrdu ? 'شلوار' : 'Shalwar' };
                const assignedWorkers = suit.workers ? Object.entries(suit.workers).map(([status, id]) => ({
                  status, worker: data.workers.find(w => w.id === id)
                })).filter(aw => aw.worker) : [];
                return (
                  <div key={suit.id} className="bg-background rounded-xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{isUrdu ? 'سوٹ' : 'Suit'} #{i + 1} — {suitTypes[suit.type]}</h3>
                      <StatusBadge status={suit.status} />
                    </div>
                    {assignedWorkers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {assignedWorkers.map(aw => (
                          <span key={aw.status} className="text-[9px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            {t(`status.${aw.status}`)}: <span className="font-semibold">{aw.worker!.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {suit.location && (suit.location.box || suit.location.line || suit.location.khanna) && (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2 bg-muted/50 rounded-lg px-2 py-1">
                        <MapPin size={10} />
                        {suit.location.box && <span>{isUrdu ? 'باکس' : 'Box'}: {suit.location.box}</span>}
                        {suit.location.line && <span>{isUrdu ? 'لائن' : 'Line'}: {suit.location.line}</span>}
                        {suit.location.khanna && <span>{isUrdu ? 'خانہ' : 'Khanna'}: {suit.location.khanna}</span>}
                      </div>
                    )}
                    <SuitTimeline suit={suit} t={t} isUrdu={isUrdu} />
                  </div>
                );
              })}
              {showTimeline.deliveredAt && (
                <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-center">
                  <p className="text-sm font-semibold text-success">🤝 {isUrdu ? 'حوالے کیا گیا' : 'Delivered'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(showTimeline.deliveredAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="premium-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg">{editingOrder ? t('common.edit') : t('order.new')}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 touch-target"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4 pb-28">
              <div>
                <label className="text-xs text-muted-foreground font-medium">{t('nav.customers')} *</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target">
                  {data.customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.customerId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">{t('order.delivery')} *</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
              </div>
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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{t('order.suits')}</h3>
                  <button onClick={addSuit} className="text-xs text-primary font-semibold px-3 py-1 rounded-lg bg-primary/10 touch-target">+ {isUrdu ? 'سوٹ شامل کریں' : 'Add Suit'}</button>
                </div>
                <div className="space-y-3">
                  {suits.map((suit, idx) => (
                    <div key={suit.id} className="bg-background rounded-xl p-3 border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{isUrdu ? 'سوٹ' : 'Suit'} #{idx + 1}</span>
                        {suits.length > 1 && (
                          <button onClick={() => removeSuit(idx)} className="text-destructive text-xs">{isUrdu ? 'ہٹائیں' : 'Remove'}</button>
                        )}
                      </div>
                      <select value={suit.type} onChange={e => updateSuit(idx, { type: e.target.value as OrderSuit['type'] })} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm">
                        <option value="full_suit">{isUrdu ? 'فل سوٹ' : 'Full Suit'}</option>
                        <option value="kameez">{isUrdu ? 'صرف قمیض' : 'Kameez Only'}</option>
                        <option value="shalwar">{isUrdu ? 'صرف شلوار' : 'Shalwar Only'}</option>
                      </select>
                      <div className="space-y-2 rounded-lg border border-border/60 bg-card p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-muted-foreground">{isUrdu ? 'مرحلہ وار کاریگر' : 'Stage-wise Worker Assignment'}</span>
                          <span className="text-[10px] text-primary font-semibold">{t(`status.${suit.status}`)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(['cutting', 'stitching', 'finishing', 'packed', 'ready'] as SuitStatus[]).map(stage => (
                            <div key={stage} className="space-y-1">
                              <label className="text-[10px] text-muted-foreground">{t(`status.${stage}`)}</label>
                              <select
                                value={suit.workers?.[stage] || ''}
                                onChange={e => {
                                  const newWorkers = { ...(suit.workers || {}) };
                                  if (e.target.value) newWorkers[stage] = e.target.value;
                                  else delete newWorkers[stage];
                                  updateSuit(idx, {
                                    workers: Object.keys(newWorkers).length ? newWorkers : undefined,
                                    workerId: stage === suit.status ? (e.target.value || undefined) : suit.workerId,
                                  });
                                }}
                                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                              >
                                <option value="">{isUrdu ? 'کوئی نہیں' : 'Unassigned'}</option>
                                {data.workers.filter(w => w.active).map(w => (
                                  <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={suit.designWork} onChange={e => updateSuit(idx, { designWork: e.target.checked })} className="rounded" />
                        {isUrdu ? 'ڈیزائن ورک' : 'Design Work'}
                      </label>
                      {editingOrder && (
                        <select value={suit.status} onChange={e => { const nextStatus = e.target.value as SuitStatus; updateSuit(idx, { status: nextStatus, workerId: suit.workers?.[nextStatus] }); }} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm">
                          {ALL_STATUSES.map(s => (
                            <option key={s} value={s}>{t(`status.${s}`)}</option>
                          ))}
                        </select>
                      )}
                      {/* Location tracking */}
                      <div className="pt-1 border-t border-border/50">
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                          <MapPin size={10} /> {isUrdu ? 'جگہ / مقام' : 'Storage Location'}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={suit.location?.box || ''}
                            onChange={e => updateSuit(idx, { location: { ...(suit.location || { box: '', line: '', khanna: '' }), box: e.target.value } })}
                            placeholder={isUrdu ? 'باکس #' : 'Box #'}
                            className="px-2 py-1.5 rounded-lg bg-card border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <input
                            type="text"
                            value={suit.location?.line || ''}
                            onChange={e => updateSuit(idx, { location: { ...(suit.location || { box: '', line: '', khanna: '' }), line: e.target.value } })}
                            placeholder={isUrdu ? 'لائن #' : 'Line #'}
                            className="px-2 py-1.5 rounded-lg bg-card border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <input
                            type="text"
                            value={suit.location?.khanna || ''}
                            onChange={e => updateSuit(idx, { location: { ...(suit.location || { box: '', line: '', khanna: '' }), khanna: e.target.value } })}
                            placeholder={isUrdu ? 'خانہ #' : 'Khanna #'}
                            className="px-2 py-1.5 rounded-lg bg-card border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'نوٹس' : 'Notes'}</label>
                <VoiceInput value={notes} onChange={setNotes} multiline rows={2} placeholder={isUrdu ? 'آرڈر کے بارے میں نوٹس...' : 'Order notes...'} append />
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




