import { useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { getDeadlineStatus, getWorkerEarnings, getWorkerSuitsCount, type Order, type OrderSuit } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, Wrench, DollarSign, Package, AlertTriangle, Clock, CalendarClock, Timer, Banknote } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const quickLinks = [
  { path: '/customers', icon: Users, key: 'nav.customers', color: 'bg-primary/10 text-primary' },
  { path: '/orders', icon: ClipboardList, key: 'nav.orders', color: 'bg-info/10 text-info' },
  { path: '/payments', icon: DollarSign, key: 'nav.payments', color: 'bg-success/10 text-success' },
  { path: '/workers', icon: Wrench, key: 'nav.workers', color: 'bg-warning/10 text-warning' },
];


function getDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function Dashboard() {
  const { t, isUrdu } = useLang();
  const { data, loading } = useData();
  const navigate = useNavigate();

  const dashboard = useMemo(() => {
    const now = new Date();
    const todayStart = getDateOnly(now);
    const tomorrowStart = new Date(todayStart.getTime() + 86400000);
    const twoDaysStart = new Date(todayStart.getTime() + 2 * 86400000);
    const threeDaysStart = new Date(todayStart.getTime() + 3 * 86400000);

    const today = now.toISOString().slice(0, 10);
    const todayOrders = data.orders.filter(o => o.createdAt.slice(0, 10) === today);
    const activeOrders = data.orders.filter(o => !o.deliveredAt);

    const overdue: typeof activeOrders = [];
    const dueTomorrow: typeof activeOrders = [];
    const dueNext2Days: typeof activeOrders = [];
    const dueToday: typeof activeOrders = [];

    for (const o of activeOrders) {
      const dl = getDateOnly(new Date(o.deadline));
      if (dl < todayStart) overdue.push(o);
      else if (dl.getTime() === todayStart.getTime()) dueToday.push(o);
      else if (dl.getTime() === tomorrowStart.getTime()) dueTomorrow.push(o);
      else if (dl >= twoDaysStart && dl < threeDaysStart) dueNext2Days.push(o);
    }

    const pendingPayments = data.orders.filter(o => o.paymentStatus !== 'paid' && !o.deliveredAt);
    const totalPending = pendingPayments.reduce((sum, o) => sum + (o.totalAmount - o.advancePaid), 0);
    const readySuits = data.orders.filter(o => !o.deliveredAt && o.suits.some(s => s.status === 'ready' || s.status === 'packed'));

    // Worker activity
    const activeWorkers = data.workers.filter(w => w.active);
    const workerActivity = activeWorkers.map(w => ({
      worker: w,
      weekSuits: getWorkerSuitsCount(w, data.orders, 'weekly'),
      weekEarnings: getWorkerEarnings(w, data.orders, 'weekly'),
    }));

    return {
      todayOrders, activeOrders, overdue, dueToday, dueTomorrow, dueNext2Days,
      pendingPayments, totalPending, readySuits, workerActivity,
    };
  }, [data]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-pulse-soft text-primary text-lg font-semibold">{isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading...'}</div></div>;
  }

  const getCustomer = (cid: string) => data.customers.find(c => c.id === cid);

  const OrderRow = ({ order, badge, badgeClass }: { order: Order; badge: string; badgeClass: string }) => {
    const customer = getCustomer(order.customerId);
    const suitsDone = order.suits.filter((s: OrderSuit) => s.status === 'ready' || s.status === 'packed' || s.status === 'delivered').length;
    const progress = order.suits.length > 0 ? Math.round((suitsDone / order.suits.length) * 100) : 0;
    return (
      <div onClick={() => navigate('/orders')} className="flex items-center justify-between bg-card rounded-lg p-3 cursor-pointer active:scale-[0.98] transition-transform border border-border">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{customer?.name || 'Unknown'}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground">{customer?.customerId}</span>
            <span className="text-[10px] text-muted-foreground">• {order.suits.length} {isUrdu ? 'سوٹ' : 'suits'}</span>
          </div>
          <Progress value={progress} className="h-1.5 mt-1.5" />
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ml-2 whitespace-nowrap ${badgeClass}`}>
          {badge}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/orders')} className="bg-card rounded-xl p-4 border border-border text-left active:scale-[0.98] transition-transform">
          <ClipboardList size={16} className="text-primary mb-1" />
          <p className="text-2xl font-bold">{dashboard.todayOrders.length}</p>
          <p className="text-xs text-muted-foreground">{t('dashboard.today')}</p>
        </button>
        <button onClick={() => navigate('/orders')} className="bg-card rounded-xl p-4 border border-border text-left active:scale-[0.98] transition-transform">
          <AlertTriangle size={16} className="text-destructive mb-1" />
          <p className="text-2xl font-bold text-destructive">{dashboard.overdue.length}</p>
          <p className="text-xs text-muted-foreground">{isUrdu ? 'اوور ڈیو' : 'Overdue'}</p>
        </button>
        <button onClick={() => navigate('/payments')} className="bg-card rounded-xl p-4 border border-border text-left active:scale-[0.98] transition-transform">
          <Banknote size={16} className="text-warning mb-1" />
          <p className="text-2xl font-bold">Rs {dashboard.totalPending.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{t('dashboard.pending')}</p>
        </button>
        <button onClick={() => navigate('/ready')} className="bg-card rounded-xl p-4 border border-border text-left active:scale-[0.98] transition-transform">
          <Package size={16} className="text-success mb-1" />
          <p className="text-2xl font-bold text-success">{dashboard.readySuits.length}</p>
          <p className="text-xs text-muted-foreground">{isUrdu ? 'تیار سوٹ' : 'Ready Suits'}</p>
        </button>
      </div>

      {/* Overdue Orders */}
      {dashboard.overdue.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
          <h3 className="font-semibold text-destructive flex items-center gap-2 mb-3 text-sm">
            <AlertTriangle size={16} /> {isUrdu ? '⚠️ اوور ڈیو آرڈرز' : '⚠️ Overdue Orders'}
          </h3>
          <div className="space-y-2">
            {dashboard.overdue.slice(0, 5).map(order => (
              <OrderRow key={order.id} order={order} badge={isUrdu ? 'اوور ڈیو' : 'OVERDUE'} badgeClass="bg-destructive text-destructive-foreground" />
            ))}
            {dashboard.overdue.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-1">+{dashboard.overdue.length - 5} {isUrdu ? 'مزید' : 'more'}</p>
            )}
          </div>
        </div>
      )}

      {/* Due Today */}
      {dashboard.dueToday.length > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
          <h3 className="font-semibold text-warning flex items-center gap-2 mb-3 text-sm">
            <Clock size={16} /> {isUrdu ? '🔥 آج ڈیلیوری' : '🔥 Due Today'}
          </h3>
          <div className="space-y-2">
            {dashboard.dueToday.map(order => (
              <OrderRow key={order.id} order={order} badge={isUrdu ? 'آج' : 'TODAY'} badgeClass="bg-warning text-warning-foreground" />
            ))}
          </div>
        </div>
      )}

      {/* Due Tomorrow */}
      {dashboard.dueTomorrow.length > 0 && (
        <div className="bg-info/5 border border-info/20 rounded-xl p-4">
          <h3 className="font-semibold text-info flex items-center gap-2 mb-3 text-sm">
            <CalendarClock size={16} /> {isUrdu ? '📅 کل ڈیلیوری' : '📅 Due Tomorrow'}
          </h3>
          <div className="space-y-2">
            {dashboard.dueTomorrow.map(order => (
              <OrderRow key={order.id} order={order} badge={isUrdu ? 'کل' : 'TOMORROW'} badgeClass="bg-info text-info-foreground" />
            ))}
          </div>
        </div>
      )}

      {/* Approaching (2-3 days) */}
      {dashboard.dueNext2Days.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <h3 className="font-semibold text-primary flex items-center gap-2 mb-3 text-sm">
            <Timer size={16} /> {isUrdu ? '📋 آنے والے آرڈرز (2-3 دن)' : '📋 Approaching (2-3 Days)'}
          </h3>
          <div className="space-y-2">
            {dashboard.dueNext2Days.map(order => (
              <OrderRow key={order.id} order={order} badge={isUrdu ? '2-3 دن' : '2-3 DAYS'} badgeClass="bg-primary/10 text-primary" />
            ))}
          </div>
        </div>
      )}

      {/* Pending Payments */}
      {dashboard.pendingPayments.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <Banknote size={16} className="text-warning" /> {isUrdu ? 'بقایا ادائیگیاں' : 'Pending Payments'}
          </h3>
          <div className="space-y-2">
            {dashboard.pendingPayments.slice(0, 5).map(order => {
              const customer = getCustomer(order.customerId);
              const remaining = order.totalAmount - order.advancePaid;
              return (
                <div key={order.id} onClick={() => navigate('/payments')} className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer active:scale-[0.98]">
                  <div>
                    <p className="font-medium text-sm">{customer?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-muted-foreground">{customer?.customerId}</p>
                  </div>
                  <p className="text-sm font-bold text-destructive">Rs {remaining.toLocaleString()}</p>
                </div>
              );
            })}
            {dashboard.pendingPayments.length > 5 && (
              <button onClick={() => navigate('/payments')} className="text-xs text-primary font-medium w-full text-center pt-1">
                {isUrdu ? `مزید ${dashboard.pendingPayments.length - 5} دیکھیں` : `View ${dashboard.pendingPayments.length - 5} more →`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Worker Activity */}
      {dashboard.workerActivity.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <Wrench size={16} className="text-warning" /> {isUrdu ? 'کاریگر سرگرمی (ہفتہ)' : 'Worker Activity (Week)'}
          </h3>
          <div className="space-y-2">
            {dashboard.workerActivity.map(({ worker, weekSuits, weekEarnings }) => (
              <div key={worker.id} onClick={() => navigate('/workers')} className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer active:scale-[0.98]">
                <div>
                  <p className="font-medium text-sm">{worker.name}</p>
                  <p className="text-[10px] text-muted-foreground">{weekSuits} {isUrdu ? 'سوٹ' : 'suits'} {isUrdu ? 'اس ہفتے' : 'this week'}</p>
                </div>
                <p className="text-sm font-bold text-primary">Rs {weekEarnings.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Access Grid */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-muted-foreground">{isUrdu ? 'فوری رسائی' : 'Quick Access'}</h3>
        <div className="grid grid-cols-3 gap-3">
          {quickLinks.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-card rounded-xl p-4 border border-border flex flex-col items-center gap-2 active:scale-[0.98] transition-transform touch-target"
            >
              <div className={`p-3 rounded-xl ${item.color}`}>
                <item.icon size={24} />
              </div>
              <span className="text-xs font-medium text-center">{t(item.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {data.orders.length === 0 && data.customers.length === 0 && (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">✂️</div>
          <p className="text-lg font-semibold mb-2">{isUrdu ? 'کراچی ٹیلرز میں خوش آمدید!' : 'Welcome to Karachi Tailors!'}</p>
          <p className="text-sm text-muted-foreground mb-6">{isUrdu ? 'گاہک شامل کر کے شروع کریں' : 'Start by adding customers and creating orders'}</p>
          <button onClick={() => navigate('/customers')} className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base touch-target active:scale-95 transition-transform">
            {isUrdu ? '+ گاہک شامل کریں' : '+ Add Customer'}
          </button>
        </div>
      )}
    </div>
  );
}
