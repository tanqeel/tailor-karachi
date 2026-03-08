import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { getDeadlineStatus, getWorkerEarnings } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, Wrench, Ruler, DollarSign, Package, BarChart3, Settings2, Globe, AlertTriangle, Clock } from 'lucide-react';

const quickLinks = [
  { path: '/customers', icon: Users, key: 'nav.customers', color: 'bg-primary/10 text-primary' },
  { path: '/orders', icon: ClipboardList, key: 'nav.orders', color: 'bg-info/10 text-info' },
  { path: '/measurements', icon: Ruler, key: 'nav.measurements', color: 'bg-accent/10 text-accent' },
  { path: '/workers', icon: Wrench, key: 'nav.workers', color: 'bg-warning/10 text-warning' },
  { path: '/payments', icon: DollarSign, key: 'nav.payments', color: 'bg-destructive/10 text-destructive' },
  { path: '/ready', icon: Package, key: 'nav.ready', color: 'bg-success/10 text-success' },
  { path: '/reports', icon: BarChart3, key: 'nav.reports', color: 'bg-info/10 text-info' },
  { path: '/portal', icon: Globe, key: 'nav.portal', color: 'bg-primary/10 text-primary' },
  { path: '/settings', icon: Settings2, key: 'nav.settings', color: 'bg-muted text-muted-foreground' },
];

export default function Dashboard() {
  const { t, isUrdu } = useLang();
  const { data, loading } = useData();
  const navigate = useNavigate();

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-pulse-soft text-primary text-lg font-semibold">{isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading...'}</div></div>;
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = data.orders.filter(o => o.createdAt.slice(0, 10) === today);
  const activeOrders = data.orders.filter(o => !o.deliveredAt);
  const urgentOrders = activeOrders.filter(o => {
    const s = getDeadlineStatus(o.deadline);
    return s === 'overdue' || s === 'urgent';
  });
  const pendingPayments = data.orders.filter(o => o.paymentStatus !== 'paid' && !o.deliveredAt);
  const totalPending = pendingPayments.reduce((sum, o) => sum + (o.totalAmount - o.advancePaid), 0);
  const readySuits = data.orders.filter(o => !o.deliveredAt && o.suits.some(s => s.status === 'ready' || s.status === 'packed'));

  return (
    <div className="space-y-4 pb-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/orders')} className="bg-card rounded-xl p-4 border border-border text-left active:scale-[0.98] transition-transform">
          <p className="text-2xl font-bold">{todayOrders.length}</p>
          <p className="text-xs text-muted-foreground">{t('dashboard.today')}</p>
        </button>
        <button onClick={() => navigate('/orders')} className="bg-card rounded-xl p-4 border border-border text-left active:scale-[0.98] transition-transform">
          <p className="text-2xl font-bold text-destructive">{urgentOrders.length}</p>
          <p className="text-xs text-muted-foreground">{t('dashboard.urgent')}</p>
        </button>
        <button onClick={() => navigate('/payments')} className="bg-card rounded-xl p-4 border border-border text-left active:scale-[0.98] transition-transform">
          <p className="text-2xl font-bold">Rs {totalPending.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{t('dashboard.pending')}</p>
        </button>
        <button onClick={() => navigate('/ready')} className="bg-card rounded-xl p-4 border border-border text-left active:scale-[0.98] transition-transform">
          <p className="text-2xl font-bold text-success">{readySuits.length}</p>
          <p className="text-xs text-muted-foreground">{isUrdu ? 'تیار سوٹ' : 'Ready Suits'}</p>
        </button>
      </div>

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

      {/* Urgent Deadlines */}
      {urgentOrders.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
          <h3 className="font-semibold text-destructive flex items-center gap-2 mb-3 text-sm">
            <AlertTriangle size={16} /> {t('dashboard.urgent')}
          </h3>
          <div className="space-y-2">
            {urgentOrders.slice(0, 5).map(order => {
              const customer = data.customers.find(c => c.id === order.customerId);
              const status = getDeadlineStatus(order.deadline);
              return (
                <div key={order.id} onClick={() => navigate('/orders')} className="flex items-center justify-between bg-card rounded-lg p-3 cursor-pointer active:scale-[0.98]">
                  <div>
                    <p className="font-medium text-sm">{customer?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{customer?.customerId}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${status === 'overdue' ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'}`}>
                    {status === 'overdue' ? (isUrdu ? '⚠️ اوور ڈیو' : '⚠️ OVERDUE') : (isUrdu ? '🔥 آج' : '🔥 TODAY')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
