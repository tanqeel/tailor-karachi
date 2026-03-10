import { useLang } from '@/contexts/LanguageContext';
import HamburgerMenu from './HamburgerMenu';

export default function TopBar() {
  const { isUrdu } = useLang();

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        {/* Shop name */}
        <h1 className="text-lg font-black tracking-tight select-none">
          {isUrdu ? 'کراچی ٹیلرز' : 'Karachi Tailors'}
        </h1>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          <HamburgerMenu />
        </div>
      </div>
    </header>
  );
}
