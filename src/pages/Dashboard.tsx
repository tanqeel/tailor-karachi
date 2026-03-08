import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { getDeadlineStatus, getWorkerEarnings } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import { ClipboardList, AlertTriangle, DollarSign, Wrench, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { t } = useLang();
  const { data } = useData();
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = data.orders.filter(o => o.createdAt.slice(0, 10) === today);

  const activeOrders = data.orders.filter(o => !o.deliveredAt);
  const urgentOrders = activeOrders.filter(o => {
    const s = getDeadlineStatus(o.deadline);
    return s === 'overdue' || s === 'urgent';
  });
  const approachingOrders = activeOrders.filter(o => getDeadlineStatus(o.deadline) === 'approaching');

  const pendingPayments = data.orders.filter(o => o.paymentStatus !== 'paid' && !o.deliveredAt);
  const totalPending = pendingPayments.reduce((sum, o) => sum + (o.totalAmount - o.advancePaid), 0);

  return (
    <div className="space-y-4 pb-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/orders')} className="bg-card rounded-xl p-4 border border-border text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <ClipboardList size={18} className="text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold">{todayOrders.length}</p>
          <p className="text-xs text-muted-foreground">{t('dashboard.today')}</p>
        </button>

        <button onClick={() => navigate('/orders')} className="bg-card rounded-xl p-4 border border-border text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle size={18} className="text-destructive" />
            </div>
          </div>
          <p className="text-2xl font-bold">{urgentOrders.length}</p>
          <p className="text-xs text-muted-foreground">{t('dashboard.urgent')}</p>
        </button>

        <button onClick={() => navigate('/orders')} className="bg-card rounded-xl p-4 border border-border text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-warning/10">
              <DollarSign size={18} className="text-warning" />
            </div>
          </div>
          <p className="text-2xl font-bold">Rs {totalPending.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{t('dashboard.pending')}</p>
        </button>

        <button onClick={() => navigate('/workers')} className="bg-card rounded-xl p-4 border border-border text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-info/10">
              <Wrench size={18} className="text-info" />
            </div>
          </div>
          <p className="text-2xl font-bold">{data.workers.filter(w => w.active).length}</p>
          <p className="text-xs text-muted-foreground">{t('dashboard.workers')}</p>
        </button>
      </div>

      {/* Urgent Deadlines */}
      {urgentOrders.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
          <h3 className="font-semibold text-destructive flex items-center gap-2 mb-3">
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
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${status === 'overdue' ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'}`}>
                      {status === 'overdue' ? '⚠️ OVERDUE' : '🔥 TODAY'}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(order.deadline).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Approaching */}
      {approachingOrders.length > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
          <h3 className="font-semibold text-warning flex items-center gap-2 mb-3">
            <Clock size={16} /> Approaching Deadlines
          </h3>
          <div className="space-y-2">
            {approachingOrders.slice(0, 3).map(order => {
              const customer = data.customers.find(c => c.id === order.customerId);
              return (
                <div key={order.id} className="flex items-center justify-between bg-card rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm">{customer?.name}</p>
                    <p className="text-xs text-muted-foreground">{order.suits.length} suits</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(order.deadline).toLocaleDateString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-warning" /> {t('dashboard.pending')}
          </h3>
          <div className="space-y-2">
            {pendingPayments.slice(0, 5).map(order => {
              const customer = data.customers.find(c => c.id === order.customerId);
              return (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-sm">{customer?.name}</p>
                    <p className="text-xs text-muted-foreground">{customer?.customerId}</p>
                  </div>
                  <p className="font-bold text-sm text-destructive">Rs {(order.totalAmount - order.advancePaid).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Worker Activity */}
      {data.workers.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-primary" /> {t('dashboard.workers')}
          </h3>
          <div className="space-y-2">
            {data.workers.filter(w => w.active).map(worker => {
              const dailyEarnings = getWorkerEarnings(worker, data.orders, 'daily');
              const assignedSuits = data.orders.flatMap(o => o.suits).filter(s => s.workerId === worker.id && s.status !== 'delivered').length;
              return (
                <div key={worker.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-sm">{worker.name}</p>
                    <p className="text-xs text-muted-foreground">{assignedSuits} active suits</p>
                  </div>
                  <p className="text-sm font-semibold text-primary">Rs {dailyEarnings.toLocaleString()}/day</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {data.orders.length === 0 && data.customers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">✂️</div>
          <p className="text-lg font-semibold mb-2">Welcome to Karachi Tailors!</p>
          <p className="text-sm text-muted-foreground mb-6">Start by adding customers and creating orders</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/customers')} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold touch-target active:scale-95 transition-transform">
              + Add Customer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
