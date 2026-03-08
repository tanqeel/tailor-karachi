import { useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { getWorkerEarnings, getWorkerAdvancesTotal } from '@/lib/store';
import { BarChart3, TrendingUp, Users, ClipboardList } from 'lucide-react';

export default function Reports() {
  const { isUrdu } = useLang();
  const { data } = useData();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = data.orders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totalRevenue = data.orders.reduce((s, o) => s + o.totalAmount, 0);
    const collected = data.orders.reduce((s, o) => s + o.advancePaid, 0);
    const pending = totalRevenue - collected;
    const monthlyRevenue = thisMonth.reduce((s, o) => s + o.totalAmount, 0);
    const deliveredCount = data.orders.filter(o => o.deliveredAt).length;
    const activeCount = data.orders.filter(o => !o.deliveredAt).length;

    return { totalRevenue, collected, pending, monthlyRevenue, deliveredCount, activeCount, monthlyOrders: thisMonth.length };
  }, [data]);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 size={22} className="text-primary" />
        <h2 className="text-lg font-bold">{isUrdu ? 'رپورٹس' : 'Reports'}</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <TrendingUp size={20} className="mx-auto text-primary mb-1" />
          <p className="text-xl font-bold">Rs {stats.monthlyRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{isUrdu ? 'ماہانہ آمدنی' : 'Monthly Revenue'}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <ClipboardList size={20} className="mx-auto text-info mb-1" />
          <p className="text-xl font-bold">{stats.monthlyOrders}</p>
          <p className="text-[10px] text-muted-foreground">{isUrdu ? 'ماہانہ آرڈرز' : 'Monthly Orders'}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <p className="text-xl font-bold text-success">Rs {stats.collected.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{isUrdu ? 'کل وصولی' : 'Total Collected'}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <p className="text-xl font-bold text-destructive">Rs {stats.pending.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{isUrdu ? 'کل بقایا' : 'Total Pending'}</p>
        </div>
      </div>

      {/* Order Stats */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-semibold text-sm mb-3">{isUrdu ? 'آرڈر کی تفصیلات' : 'Order Summary'}</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm py-2 border-b border-border">
            <span className="text-muted-foreground">{isUrdu ? 'کل گاہک' : 'Total Customers'}</span>
            <span className="font-bold">{data.customers.length}</span>
          </div>
          <div className="flex justify-between text-sm py-2 border-b border-border">
            <span className="text-muted-foreground">{isUrdu ? 'کل آرڈرز' : 'Total Orders'}</span>
            <span className="font-bold">{data.orders.length}</span>
          </div>
          <div className="flex justify-between text-sm py-2 border-b border-border">
            <span className="text-muted-foreground">{isUrdu ? 'فعال آرڈرز' : 'Active Orders'}</span>
            <span className="font-bold text-info">{stats.activeCount}</span>
          </div>
          <div className="flex justify-between text-sm py-2">
            <span className="text-muted-foreground">{isUrdu ? 'مکمل' : 'Delivered'}</span>
            <span className="font-bold text-success">{stats.deliveredCount}</span>
          </div>
        </div>
      </div>

      {/* Worker Summary */}
      {data.workers.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Users size={16} /> {isUrdu ? 'کاریگر خلاصہ' : 'Worker Summary'}
          </h3>
          <div className="space-y-2">
            {data.workers.filter(w => w.active).map(worker => {
              const weekly = getWorkerEarnings(worker, data.orders, 'weekly');
              const advances = getWorkerAdvancesTotal(worker, 'weekly');
              return (
                <div key={worker.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-sm">{worker.name}</p>
                    <p className="text-[10px] text-muted-foreground">{isUrdu ? 'ہفتہ وار' : 'Weekly'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">Rs {weekly.toLocaleString()}</p>
                    {advances > 0 && <p className="text-[10px] text-destructive">- Rs {advances.toLocaleString()}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
