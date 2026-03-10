import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Wrench, MoreHorizontal } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { Ruler, DollarSign, Package, BarChart3, Settings2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const springConfig = { type: 'spring' as const, stiffness: 400, damping: 28 };

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, isUrdu } = useLang();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreNav.some(i => location.pathname === i.path);

  const allMainItems = [...mainNav, { path: '__more__', icon: MoreHorizontal, key: '__more__' }];

  const isActive = (path: string) => {
    if (path === '__more__') return isMoreActive || showMore;
    return location.pathname === path;
  };

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-foreground/30"
            onClick={() => setShowMore(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={springConfig}
              className="absolute bottom-24 left-0 right-0 max-w-lg mx-auto px-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-card rounded-2xl border border-border shadow-2xl p-3 grid grid-cols-3 gap-2">
                {moreNav.map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <motion.button
                      key={item.path}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { navigate(item.path); setShowMore(false); }}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl touch-target transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                        }`}
                    >
                      <item.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                      <span className="text-[10px] font-medium">{t(item.key)}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto">
        <div
          className="bg-card/95 backdrop-blur-md border-t border-border flex items-stretch"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {allMainItems.map(item => {
            const active = isActive(item.path);
            const isMoreBtn = item.path === '__more__';
            const label = isMoreBtn ? (isUrdu ? 'مزید' : 'More') : t(item.key);

            return (
              <button
                key={item.path}
                onClick={() => {
                  if (isMoreBtn) {
                    setShowMore(!showMore);
                  } else {
                    navigate(item.path);
                    setShowMore(false);
                  }
                }}
                className="flex-1 flex flex-col items-center justify-center pt-2 pb-1.5 gap-0.5 relative touch-target"
              >
                {/* Active indicator bar at top */}
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                    transition={springConfig}
                  />
                )}

                <motion.div
                  animate={{ scale: active ? 1.15 : 1 }}
                  transition={springConfig}
                  className={`p-1.5 rounded-xl transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <item.icon
                    size={22}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </motion.div>

                {/* Label — ALWAYS visible */}
                <span className={`text-[10px] font-medium leading-none ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
