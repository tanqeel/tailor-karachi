import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import SearchBar from '@/components/SearchBar';
import { DollarSign, Check, X } from 'lucide-react';

export default function Payments() {
  const { t, isUrdu } = useLang();
  const { data, updateOrder } = useData();
  const [search, setSearch] = useState('');
  const [payModal, setPayModal] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const pendingOrders = data.orders
    .filter(o => o.paymentStatus !== 'paid')
    .sort((a, b) => (a.totalAmount - a.advancePaid) > (b.totalAmount - b.advancePaid) ? -1 : 1);

  const paidOrders = data.orders.filter(o => o.paymentStatus === 'paid');

  const filtered = pendingOrders.filter(o => {
    const customer = data.customers.find(c => c.id === o.customerId);
    if (!customer) return false;
    const q = search.toLowerCase();
    return customer.name.toLowerCase().includes(q) || customer.customerId.toLowerCase().includes(q);
  });

  const totalPending = pendingOrders.reduce((sum, o) => sum + (o.totalAmount - o.advancePaid), 0);
  const totalCollected = data.orders.reduce((sum, o) => sum + o.advancePaid, 0);

  const handlePay = () => {
    if (!payModal || !payAmount) return;
    const order = data.orders.find(o => o.id === payModal);
    if (!order) return;
    const newAdvance = order.advancePaid + (Number(payAmount) || 0);
    const status = newAdvance >= order.totalAmount ? 'paid' : newAdvance > 0 ? 'partial' : 'pending';
    updateOrder(payModal, { advancePaid: Math.min(newAdvance, order.totalAmount), paymentStatus: status as any });
    setPayModal(null);
    setPayAmount('');
  };

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

      <SearchBar value={search} onChange={setSearch} />

      <div className="space-y-2">
        {filtered.map(order => {
          const customer = data.customers.find(c => c.id === order.customerId);
          const balance = order.totalAmount - order.advancePaid;
          return (
            <div key={order.id} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{customer?.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{customer?.customerId}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  order.paymentStatus === 'pending' ? 'bg-destructive/10 text-destructive' :
                  'bg-warning/10 text-warning'
                }`}>
                  {order.paymentStatus === 'pending' ? (isUrdu ? 'بقایا' : 'Pending') : (isUrdu ? 'جزوی' : 'Partial')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-muted-foreground">{isUrdu ? 'کل' : 'Total'}: Rs {order.totalAmount.toLocaleString()}</span>
                <span className="font-bold text-destructive">{isUrdu ? 'بقایا' : 'Due'}: Rs {balance.toLocaleString()}</span>
              </div>
              <button
                onClick={() => { setPayModal(order.id); setPayAmount(''); }}
                className="w-full py-3 bg-success text-success-foreground rounded-xl font-semibold text-sm touch-target active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <DollarSign size={16} /> {isUrdu ? 'ادائیگی وصول کریں' : 'Record Payment'}
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <Check size={40} className="mx-auto text-success mb-2" />
            <p className="text-muted-foreground text-sm">{isUrdu ? 'کوئی بقایا نہیں' : 'No pending payments'}</p>
          </div>
        )}
      </div>

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
                const balance = order ? order.totalAmount - order.advancePaid : 0;
                return (
                  <>
                    <p className="text-sm text-muted-foreground">{isUrdu ? 'بقایا رقم' : 'Balance due'}: <strong className="text-foreground">Rs {balance.toLocaleString()}</strong></p>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      placeholder={isUrdu ? 'رقم درج کریں' : 'Enter amount'}
                      className="w-full px-4 py-4 rounded-xl bg-background border border-border text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setPayAmount(String(balance))} className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-semibold text-sm touch-target active:scale-95">
                        {isUrdu ? 'پوری رقم' : 'Full Amount'}
                      </button>
                    </div>
                    <button onClick={handlePay} className="w-full py-4 bg-success text-success-foreground rounded-xl font-semibold text-base touch-target active:scale-95 transition-transform">
                      {isUrdu ? 'محفوظ کریں' : 'Save Payment'}
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
