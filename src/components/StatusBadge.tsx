import { useLang } from '@/contexts/LanguageContext';
import type { SuitStatus } from '@/lib/store';

const statusColors: Record<SuitStatus, string> = {
  received: 'bg-muted text-muted-foreground',
  cutting: 'bg-info text-info-foreground',
  stitching: 'bg-primary text-primary-foreground',
  finishing: 'bg-warning text-warning-foreground',
  packed: 'bg-accent text-accent-foreground',
  ready: 'bg-success text-success-foreground',
  delivered: 'bg-muted text-muted-foreground',
};

export default function StatusBadge({ status, onClick }: { status: SuitStatus; onClick?: () => void }) {
  const { t } = useLang();
  return (
    <span
      onClick={onClick}
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status]} ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}
