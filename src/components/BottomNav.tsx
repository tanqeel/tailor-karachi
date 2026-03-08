import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Wrench, MoreHorizontal } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { Ruler, DollarSign, Package, BarChart3, Settings2, Globe } from 'lucide-react';

const mainNav = [
  { path: '/', icon: LayoutDashboard, key: 'nav.dashboard' },
  { path: '/customers', icon: Users, key: 'nav.customers' },
  { path: '/orders', icon: ClipboardList, key: 'nav.orders' },
  { path: '/workers', icon: Wrench, key: 'nav.workers' },
];

const moreNav = [
  { path: '/measurements', icon: Ruler, key: 'nav.measurements' },
  { path: '/payments', icon: DollarSign, key: 'nav.payments' },
  { path: '/ready', icon: Package, key: 'nav.ready' },
  { path: '/reports', icon: BarChart3, key: 'nav.reports' },
  { path: '/portal', icon: Globe, key: 'nav.portal' },
  { path: '/settings', icon: Settings2, key: 'nav.settings' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, isUrdu } = useLang();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreNav.some(i => location.pathname === i.path);

  return (
    <>
      {showMore && (
        <div className="fixed inset-0 z-40 bg-foreground/30" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-16 left-0 right-0 max-w-lg mx-auto px-4 pb-2" onClick={e => e.stopPropagation()}>
            <div className="bg-card rounded-2xl border border-border shadow-xl p-3 grid grid-cols-3 gap-2">
              {moreNav.map(item => {
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setShowMore(false); }}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl touch-target transition-colors ${
                      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                    <span className="text-[10px] font-medium">{t(item.key)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {mainNav.map(item => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setShowMore(false); }}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 touch-target transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{t(item.key)}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 touch-target transition-colors ${
              isMoreActive || showMore ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <MoreHorizontal size={22} strokeWidth={isMoreActive ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">{isUrdu ? 'مزید' : 'More'}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
