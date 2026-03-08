import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Wrench, Globe } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

const navItems = [
  { path: '/', icon: LayoutDashboard, key: 'nav.dashboard' },
  { path: '/customers', icon: Users, key: 'nav.customers' },
  { path: '/orders', icon: ClipboardList, key: 'nav.orders' },
  { path: '/workers', icon: Wrench, key: 'nav.workers' },
  { path: '/portal', icon: Globe, key: 'nav.portal' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLang();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 touch-target transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{t(item.key)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
