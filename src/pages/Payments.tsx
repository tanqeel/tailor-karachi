import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { generateId } from '@/lib/store';
import type { PaymentRecord } from '@/lib/store';
import SearchBar from '@/components/SearchBar';
import { DollarSign, Check, X, Clock, CreditCard, Banknote, History } from 'lucide-react';

type Tab = 'pending' | 'paid' | 'history';

export default function Payments() {
  const { t, isUrdu } = useLang();
  const { data, updateOrder } = useData();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('pending');
  const [payModal, setPayModal] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentRecord['method']>('cash');
  const [payNote, setPayNote] = useState('');

  const pendingOrders = data.orders
    .filter(o => o.paymentStatus !== 'paid')
    .sort((a, b) => (b.totalAmount - b.advancePaid) - (a.totalAmount - a.advancePaid));

  const paidOrders = data.orders
    .filter(o => o.paymentStatus === 'paid')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const allPayments = data.orders
    .flatMap(o => (o.paymentHistory || []).map(p => ({
      ...p,
      orderId: o.id,
      customerId: o.customerId,
      orderTotal: o.totalAmount,
    })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filterBySearch = (customerId: string) => {
    if (!search) return true;
    const customer = data.customers.find(c => c.id === customerId);
    if (!customer) return false;
    const q = search.toLowerCase();
    return customer.name.toLowerCase().includes(q) || customer.customerId.toLowerCase().includes(q) || customer.phone.includes(q);
  };

  const totalPending = pendingOrders.reduce((sum, o) => sum + (o.totalAmount - o.advancePaid), 0);
  const totalCollected = data.orders.reduce((sum, o) => sum + o.advancePaid, 0);

  const handlePay = () => {
    if (!payModal || !payAmount) return;
    const order = data.orders.find(o => o.id === payModal);
    if (!order) return;
    const amount = Math.min(Number(payAmount) || 0, order.totalAmount - order.advancePaid);
    if (amount <= 0) return;

    const record: PaymentRecord = {
      id: generateId(),
      amount,
      date: new Date().toISOString(),
      method: payMethod,
      note: payNote,
    };

    const newAdvance = order.advancePaid + amount;
    const status = newAdvance >= order.totalAmount ? 'paid' : newAdvance > 0 ? 'partial' : 'pending';
    const history = [...(order.paymentHistory || []), record];

    updateOrder(payModal, {
      advancePaid: Math.min(newAdvance, order.totalAmount),
      paymentStatus: status as any,
      paymentHistory: history,
    });
    setPayModal(null);
    setPayAmount('');
    setPayNote('');
    setPayMethod('cash');
  };

  const deletePaymentRecord = (orderId: string, recordId: string) => {
    const order = data.orders.find(o => o.id === orderId);
    if (!order) return;
    const record = (order.paymentHistory || []).find(p => p.id === recordId);
    if (!record) return;
    const newHistory = (order.paymentHistory || []).filter(p => p.id !== recordId);
    const newAdvance = Math.max(0, order.advancePaid - record.amount);
    const status = newAdvance >= order.totalAmount ? 'paid' : newAdvance > 0 ? 'partial' : 'pending';
    updateOrder(orderId, { advancePaid: newAdvance, paymentStatus: status as any, paymentHistory: newHistory });
  };

  const methodLabel = (m: string) => {
    const labels: Record<string, string> = {
      cash: isUrdu ? 'نقد' : 'Cash',
      bank: isUrdu ? 'بینک' : 'Bank',
      easypaisa: 'Easypaisa',
      jazzcash: 'JazzCash',
      other: isUrdu ? 'دیگر' : 'Other',
    };
    return labels[m] || m;
  };

  const methodIcon: Record<string, string> = { cash: '💵', bank: '🏦', easypaisa: '📱', jazzcash: '📱', other: '💳' };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign size={22} className="text-primary" />
        <h2 className="text-lg font-bold">{isUrdu ? 'ادائیگیاں' : 'Payments'}</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-destructive">Rs {totalPending.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{isUrdu ? 'بقایا' : 'Pending'}</p>
        </div>
        <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-success">Rs {totalCollected.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{isUrdu ? 'وصول شدہ' : 'Collected'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          ['pending', isUrdu ? 'بقایا' : 'Pending', pendingOrders.length],
          ['paid', isUrdu ? 'مکمل' : 'Paid', paidOrders.length],
          ['history', isUrdu ? 'تاریخ' : 'History', allPayments.length],
        ] as const).map(([key, label, count]) => (
          <button key={key} onClick={() => setTab(key as Tab)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${tab === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {label} <span className="opacity-70">({count})</span>
          </button>
        ))}
      </div>

      <SearchBar value={search} onChange={setSearch} />

      {/* Pending Tab */}
      {tab === 'pending' && (
        <div className="space-y-2">
          {pendingOrders.filter(o => filterBySearch(o.customerId)).map(order => {
            const customer = data.customers.find(c => c.id === order.customerId);
            const balance = order.totalAmount - order.advancePaid;
            const paidPercent = order.totalAmount > 0 ? Math.round((order.advancePaid / order.totalAmount) * 100) : 0;
            return (
              <div key={order.id} className="bg-card rounded-xl p-4 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{customer?.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{customer?.customerId}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    order.paymentStatus === 'pending' ? 'bg-destructive/10 text-destructive' :
                    order.paymentStatus === 'advance' ? 'bg-warning/10 text-warning' :
                    'bg-accent/10 text-accent-foreground'
                  }`}>
                    {order.paymentStatus === 'pending' ? (isUrdu ? 'بقایا' : 'Pending') :
                     order.paymentStatus === 'advance' ? (isUrdu ? 'پیشگی' : 'Advance') :
                     (isUrdu ? 'جزوی' : 'Partial')}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{isUrdu ? 'کل' : 'Total'}: Rs {order.totalAmount.toLocaleString()}</span>
                    <span>{isUrdu ? 'وصول' : 'Paid'}: Rs {order.advancePaid.toLocaleString()}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${paidPercent}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{paidPercent}%</span>
                    <span className="font-bold text-destructive">{isUrdu ? 'بقایا' : 'Due'}: Rs {balance.toLocaleString()}</span>
                  </div>
                </div>
                {/* Payment history for this order */}
                {(order.paymentHistory || []).length > 0 && (
                  <div className="space-y-1">
                    {(order.paymentHistory || []).slice(-3).map(p => (
                      <div key={p.id} className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{methodIcon[p.method]} {new Date(p.date).toLocaleDateString()} {p.note && `· ${p.note}`}</span>
                        <span className="font-semibold text-success">+Rs {p.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => { setPayModal(order.id); setPayAmount(''); setPayNote(''); setPayMethod('cash'); }}
                  className="w-full py-3 bg-success text-success-foreground rounded-xl font-semibold text-sm touch-target active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Banknote size={16} /> {isUrdu ? 'ادائیگی وصول کریں' : 'Record Payment'}
                </button>
              </div>
            );
          })}
          {pendingOrders.filter(o => filterBySearch(o.customerId)).length === 0 && (
            <div className="text-center py-8">
              <Check size={40} className="mx-auto text-success mb-2" />
              <p className="text-muted-foreground text-sm">{isUrdu ? 'کوئی بقایا نہیں' : 'No pending payments'}</p>
            </div>
          )}
        </div>
      )}

      {/* Paid Tab */}
      {tab === 'paid' && (
        <div className="space-y-2">
          {paidOrders.filter(o => filterBySearch(o.customerId)).map(order => {
            const customer = data.customers.find(c => c.id === order.customerId);
            return (
              <div key={order.id} className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="font-semibold text-sm">{customer?.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{customer?.customerId}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-success/10 text-success">
                    ✅ {isUrdu ? 'مکمل' : 'Paid'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-success">Rs {order.totalAmount.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">
                  {(order.paymentHistory || []).length} {isUrdu ? 'ادائیگیاں' : 'payments'} · {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            );
          })}
          {paidOrders.filter(o => filterBySearch(o.customerId)).length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">{isUrdu ? 'کوئی مکمل ادائیگی نہیں' : 'No paid orders'}</p>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-2">
          {allPayments.filter(p => filterBySearch(p.customerId)).map(p => {
            const customer = data.customers.find(c => c.id === p.customerId);
            return (
              <div key={p.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-sm shrink-0">
                  {methodIcon[p.method]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{customer?.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(p.date).toLocaleString()} · {methodLabel(p.method)}
                    {p.note && ` · ${p.note}`}
                  </p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-1">
                  <span className="font-bold text-success text-sm">+Rs {p.amount.toLocaleString()}</span>
                  <button onClick={() => deletePaymentRecord(p.orderId, p.id)}
                    className="text-destructive/50 hover:text-destructive p-1 touch-target"><X size={14} /></button>
                </div>
              </div>
            );
          })}
          {allPayments.filter(p => filterBySearch(p.customerId)).length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">{isUrdu ? 'کوئی ادائیگی نہیں' : 'No payment history'}</p>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center" onClick={() => setPayModal(null)}>
          <div className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-lg">{isUrdu ? 'ادائیگی وصول کریں' : 'Record Payment'}</h2>
              <button onClick={() => setPayModal(null)} className="p-2 touch-target"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              {(() => {
                const order = data.orders.find(o => o.id === payModal);
                const customer = order ? data.customers.find(c => c.id === order.customerId) : null;
                const balance = order ? order.totalAmount - order.advancePaid : 0;
                return (
                  <>
                    <div className="bg-background rounded-xl p-3 border border-border">
                      <p className="text-sm font-semibold">{customer?.name}</p>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{isUrdu ? 'کل' : 'Total'}: Rs {order?.totalAmount.toLocaleString()}</span>
                        <span>{isUrdu ? 'وصول' : 'Paid'}: Rs {order?.advancePaid.toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-bold text-destructive mt-1">{isUrdu ? 'بقایا' : 'Balance'}: Rs {balance.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'رقم' : 'Amount'}</label>
                      <input
                        type="number"
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        placeholder={isUrdu ? 'رقم درج کریں' : 'Enter amount'}
                        className="w-full px-4 py-4 rounded-xl bg-background border border-border text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target"
                      />
                    </div>
                    {/* Quick amounts */}
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setPayAmount(String(balance))} className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-semibold active:scale-95">
                        {isUrdu ? 'پوری رقم' : 'Full'} ({balance.toLocaleString()})
                      </button>
                      {balance > 1000 && (
                        <button onClick={() => setPayAmount(String(Math.round(balance / 2)))} className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-semibold active:scale-95">
                          {isUrdu ? 'آدھی' : 'Half'} ({Math.round(balance / 2).toLocaleString()})
                        </button>
                      )}
                    </div>
                    {/* Payment method */}
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'طریقہ' : 'Method'}</label>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {(['cash', 'bank', 'easypaisa', 'jazzcash', 'other'] as const).map(m => (
                          <button key={m} onClick={() => setPayMethod(m)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${payMethod === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {methodIcon[m]} {methodLabel(m)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'نوٹ' : 'Note'}</label>
                      <input value={payNote} onChange={e => setPayNote(e.target.value)} placeholder={isUrdu ? 'اختیاری...' : 'Optional...'}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
                    </div>
                    <button onClick={handlePay} className="w-full py-4 bg-success text-success-foreground rounded-xl font-semibold text-base touch-target active:scale-95 transition-transform flex items-center justify-center gap-2">
                      <Check size={18} /> {isUrdu ? 'ادائیگی محفوظ کریں' : 'Save Payment'}
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}