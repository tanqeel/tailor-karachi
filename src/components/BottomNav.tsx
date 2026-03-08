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
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl touch-target transition-colors ${
                        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
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

      {/* Floating pill nav */}
      <nav className="fixed bottom-2 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springConfig, delay: 0.1 }}
          className="pointer-events-auto bg-white dark:bg-card rounded-full shadow-2xl border border-border/50 px-3 py-2 flex items-center gap-1"
          style={{
            boxShadow: '0 8px 40px -8px rgba(0,0,0,0.25), 0 4px 12px -4px rgba(0,0,0,0.1)',
          }}
        >
          {allMainItems.map(item => {
            const active = isActive(item.path);
            const isMoreBtn = item.path === '__more__';

            return (
              <motion.button
                key={item.path}
                onClick={() => {
                  if (isMoreBtn) {
                    setShowMore(!showMore);
                  } else {
                    navigate(item.path);
                    setShowMore(false);
                  }
                }}
                className="relative flex flex-col items-center justify-center w-14 h-12 touch-target"
                animate={{ y: active ? -10 : 0 }}
                transition={springConfig}
              >
                {/* Active circle background */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      layoutId="nav-active-pill"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={springConfig}
                      className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-primary"
                      style={{ zIndex: 0 }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon */}
                <motion.div
                  className="relative z-10 flex flex-col items-center"
                  animate={{ scale: active ? 1.1 : 1 }}
                  transition={springConfig}
                >
                  <item.icon
                    size={22}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={`transition-colors duration-200 ${
                      active ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  />
                  {!active && (
                    <span className="text-[8px] font-medium text-muted-foreground mt-0.5 leading-none">
                      {isMoreBtn ? (isUrdu ? 'مزید' : 'More') : t(item.key)}
                    </span>
                  )}
                </motion.div>
              </motion.button>
            );
          })}
        </motion.div>
      </nav>
    </>
  );
}
