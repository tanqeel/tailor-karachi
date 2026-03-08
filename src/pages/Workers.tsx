import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { getWorkerEarnings, getWorkerAdvancesTotal, getWorkerPaymentsTotal, getWorkerSuitsCount, generateId } from '@/lib/store';
import { getWhatsAppLink, getWorkerHisaabMessage } from '@/lib/notifications';
import type { Worker, WorkerAdvance, WorkerPayment } from '@/lib/store';
import SearchBar from '@/components/SearchBar';
import StatusBadge from '@/components/StatusBadge';
import { Plus, X, Wallet, ChevronRight, History, MessageCircle, Banknote, Scissors, PenTool, ArrowRight, MapPin } from 'lucide-react';
import VoiceInput from '@/components/VoiceInput';
import type { SuitStatus, StatusChange } from '@/lib/store';

const ALL_STATUSES: SuitStatus[] = ['received', 'cutting', 'stitching', 'finishing', 'packed', 'ready', 'delivered'];
function nextStatus(s: SuitStatus): SuitStatus {
  const i = ALL_STATUSES.indexOf(s);
  return ALL_STATUSES[Math.min(i + 1, ALL_STATUSES.length - 1)];
}

const WORKER_ROLES = [
  { key: 'cutting', en: 'Cutting', ur: 'کٹنگ', emoji: '✂️' },
  { key: 'stitching', en: 'Stitching', ur: 'سلائی', emoji: '🧵' },
  { key: 'finishing', en: 'Finishing', ur: 'فنشنگ', emoji: '✨' },
  { key: 'pressing', en: 'Pressing / Ironing', ur: 'پریسنگ / استری', emoji: '🔥' },
  { key: 'design', en: 'Design Work', ur: 'ڈیزائن ورک', emoji: '🎨' },
  { key: 'embroidery', en: 'Embroidery', ur: 'کڑھائی', emoji: '🪡' },
  { key: 'master', en: 'Master Tailor', ur: 'ماسٹر درزی', emoji: '👔' },
  { key: 'helper', en: 'Helper', ur: 'ہیلپر', emoji: '🤝' },
];

export default function Workers() {
  const { t, isUrdu } = useLang();
  const { data, addWorker, updateWorker, deleteWorker, updateOrder } = useData();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [showHisaab, setShowHisaab] = useState<Worker | null>(null);
  const [showHistory, setShowHistory] = useState<Worker | null>(null);

  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('');
  const [rateKameez, setRateKameez] = useState('');
  const [rateShalwar, setRateShalwar] = useState('');
  const [rateSuit, setRateSuit] = useState('');
  const [rateDesign, setRateDesign] = useState('');

  // Advance form
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceNote, setAdvanceNote] = useState('');
  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [hisaabTab, setHisaabTab] = useState<'summary' | 'advances' | 'payments'>('summary');

  const filtered = data.workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) || w.phone.includes(search)
  );

  const getWorkerHistory = (worker: Worker) => {
    return data.orders.flatMap(o => {
      const customer = data.customers.find(c => c.id === o.customerId);
      return o.suits
        .filter(s => s.workerId === worker.id)
        .map(s => ({
          orderId: o.id,
          customerName: customer?.name || 'Unknown',
          customerId: customer?.customerId || '',
          type: s.type,
          status: s.status,
          designWork: s.designWork,
          deadline: o.deadline,
          createdAt: o.createdAt,
          rate: s.type === 'kameez' ? worker.rateKameez : s.type === 'shalwar' ? worker.rateShalwar : worker.rateSuit,
          designRate: s.designWork ? worker.rateDesign : 0,
        }));
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const openNew = () => {
    setEditing(null);
    setName(''); setPhone(''); setRole(''); setExperience('');
    setRateKameez(''); setRateShalwar(''); setRateSuit(''); setRateDesign('');
    setShowForm(true);
  };

  const openEdit = (w: Worker) => {
    setEditing(w);
    setName(w.name); setPhone(w.phone);
    setRole(w.role || ''); setExperience(w.experience || '');
    setRateKameez(String(w.rateKameez)); setRateShalwar(String(w.rateShalwar));
    setRateSuit(String(w.rateSuit)); setRateDesign(String(w.rateDesign));
    setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const workerData = {
      name, phone, role, experience,
      rateKameez: Number(rateKameez) || 0,
      rateShalwar: Number(rateShalwar) || 0,
      rateSuit: Number(rateSuit) || 0,
      rateDesign: Number(rateDesign) || 0,
    };
    if (editing) {
      updateWorker(editing.id, workerData);
    } else {
      addWorker(workerData);
    }
    setShowForm(false);
  };

  const addAdvance = (worker: Worker) => {
    if (!advanceAmount) return;
    const adv: WorkerAdvance = { id: generateId(), amount: Number(advanceAmount), date: new Date().toISOString(), note: advanceNote };
    updateWorker(worker.id, { advances: [...worker.advances, adv] });
    setAdvanceAmount('');
    setAdvanceNote('');
    setShowHisaab(data.workers.find(w => w.id === worker.id) || worker);
  };

  const addPayment = (worker: Worker) => {
    if (!paymentAmount) return;
    const pmt: WorkerPayment = { id: generateId(), amount: Number(paymentAmount), date: new Date().toISOString(), note: paymentNote };
    updateWorker(worker.id, { payments: [...(worker.payments || []), pmt] });
    setPaymentAmount('');
    setPaymentNote('');
    setShowHisaab(data.workers.find(w => w.id === worker.id) || worker);
  };

  const suitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      full_suit: isUrdu ? 'فل سوٹ' : 'Full Suit',
      kameez: isUrdu ? 'قمیض' : 'Kameez',
      shalwar: isUrdu ? 'شلوار' : 'Shalwar',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4 pb-4">
      <SearchBar value={search} onChange={setSearch} />

      <button onClick={openNew} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 touch-target active:scale-[0.98] transition-transform">
        <Plus size={20} /> {t('common.add')} {t('nav.workers')}
      </button>

      <div className="space-y-3">
        {filtered.map(worker => {
          const weeklyEarnings = getWorkerEarnings(worker, data.orders, 'weekly');
          const activeSuits = data.orders.flatMap(o => o.suits).filter(s => s.workerId === worker.id && s.status !== 'delivered').length;
          const totalCompleted = data.orders.flatMap(o => o.suits).filter(s => s.workerId === worker.id && s.status === 'delivered').length;

          return (
            <div key={worker.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 flex items-center gap-3" onClick={() => openEdit(worker)}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold">
                  {worker.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{worker.name}</p>
                  {worker.role && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {worker.role.split(',').map(r => {
                        const preset = WORKER_ROLES.find(p => p.key === r.trim());
                        return (
                          <span key={r} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {preset ? `${preset.emoji} ${isUrdu ? preset.ur : preset.en}` : r.trim()}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {worker.experience && <p className="text-[10px] text-muted-foreground mt-0.5">{isUrdu ? 'تجربہ' : 'Exp'}: {worker.experience}</p>}
                  <p className="text-xs text-muted-foreground">
                    {activeSuits} {isUrdu ? 'فعال' : 'active'} · {totalCompleted} {isUrdu ? 'مکمل' : 'done'} · Rs {weeklyEarnings.toLocaleString()}/{isUrdu ? 'ہفتہ' : 'wk'}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </div>
              {/* Rates */}
              <div className="px-4 pb-2 flex flex-wrap gap-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{isUrdu ? 'قمیض' : 'Kam'}: Rs {worker.rateKameez}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{isUrdu ? 'شلوار' : 'Shl'}: Rs {worker.rateShalwar}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{isUrdu ? 'سوٹ' : 'Suit'}: Rs {worker.rateSuit}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{isUrdu ? 'ڈیزائن' : 'Design'}: Rs {worker.rateDesign}</span>
              </div>
              <div className="px-4 pb-3 flex gap-2">
                <button onClick={() => { setShowHisaab(worker); setAdvanceAmount(''); setAdvanceNote(''); }} className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold touch-target active:scale-95">
                  <Wallet size={14} className="inline mr-1" /> {t('worker.hisaab')}
                </button>
                <button onClick={() => setShowHistory(worker)} className="flex-1 py-2 rounded-lg bg-accent/10 text-accent-foreground text-xs font-semibold touch-target active:scale-95">
                  <History size={14} className="inline mr-1" /> {isUrdu ? 'ورک ہسٹری' : 'Work History'}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">{isUrdu ? 'کوئی کاریگر نہیں' : 'No workers found'}</p>}
      </div>

      {/* Worker Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg">{editing ? t('common.edit') : t('common.add')} {t('nav.workers')}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 touch-target"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium">{t('worker.name')} *</label>
                <VoiceInput value={name} onChange={setName} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">{t('common.phone')}</label>
                <VoiceInput value={phone} onChange={setPhone} type="tel" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">{isUrdu ? 'کردار (ایک یا زیادہ منتخب کریں)' : 'Roles (select one or more)'}</label>
                <div className="flex flex-wrap gap-2">
                  {WORKER_ROLES.map(r => {
                    const selected = role.split(',').map(s => s.trim()).filter(Boolean).includes(r.key);
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => {
                          const current = role.split(',').map(s => s.trim()).filter(Boolean);
                          const next = selected ? current.filter(k => k !== r.key) : [...current, r.key];
                          setRole(next.join(','));
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors touch-target ${
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {r.emoji} {isUrdu ? r.ur : r.en}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'تجربہ' : 'Experience'}</label>
                <VoiceInput value={experience} onChange={setExperience} placeholder={isUrdu ? 'مثلاً 5 سال' : 'e.g. 5 years'} />
              </div>
              <div>
                <h3 className="text-xs text-muted-foreground font-medium mb-2">{isUrdu ? 'ریٹ (فی سوٹ)' : 'Rates (per piece)'}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground">{t('worker.rate.kameez')}</label>
                    <input type="number" value={rateKameez} onChange={e => setRateKameez(e.target.value)} placeholder="Rs" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">{t('worker.rate.shalwar')}</label>
                    <input type="number" value={rateShalwar} onChange={e => setRateShalwar(e.target.value)} placeholder="Rs" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">{t('worker.rate.suit')}</label>
                    <input type="number" value={rateSuit} onChange={e => setRateSuit(e.target.value)} placeholder="Rs" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">{t('worker.rate.design')}</label>
                    <input type="number" value={rateDesign} onChange={e => setRateDesign(e.target.value)} placeholder="Rs" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                {editing && (
                  <button onClick={() => { deleteWorker(editing.id); setShowForm(false); }} className="flex-1 py-3 rounded-xl border border-destructive text-destructive font-semibold touch-target active:scale-95">
                    {t('common.delete')}
                  </button>
                )}
                <button onClick={handleSave} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold touch-target active:scale-95 transition-transform">
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hisaab Modal */}
      {showHisaab && (() => {
        const weeklyEarned = getWorkerEarnings(showHisaab, data.orders, 'weekly');
        const weeklyAdv = getWorkerAdvancesTotal(showHisaab, 'weekly');
        const weeklyPaid = getWorkerPaymentsTotal(showHisaab, 'weekly');
        const weeklySuits = getWorkerSuitsCount(showHisaab, data.orders, 'weekly');
        const allEarned = getWorkerEarnings(showHisaab, data.orders, 'monthly') + getWorkerEarnings(showHisaab, data.orders, 'daily'); // approx
        const totalEarnedAll = data.orders.reduce((sum, o) => {
          return sum + o.suits.filter(s => s.workerId === showHisaab.id).reduce((ss, s) => {
            let r = s.type === 'kameez' ? showHisaab.rateKameez : s.type === 'shalwar' ? showHisaab.rateShalwar : showHisaab.rateSuit;
            if (s.designWork) r += showHisaab.rateDesign;
            return ss + r;
          }, 0);
        }, 0);
        const totalAdvAll = getWorkerAdvancesTotal(showHisaab, 'all');
        const totalPaidAll = getWorkerPaymentsTotal(showHisaab, 'all');
        const allTimeSuits = getWorkerSuitsCount(showHisaab, data.orders, 'all');
        const remainingBalance = totalEarnedAll - totalAdvAll - totalPaidAll;

        return (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center" onClick={() => setShowHisaab(null)}>
          <div className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg">{showHisaab.name} - {t('worker.hisaab')}</h2>
              <button onClick={() => setShowHisaab(null)} className="p-2 touch-target"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              {/* Earnings by period */}
              <div className="grid grid-cols-3 gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map(period => (
                  <div key={period} className="bg-background rounded-xl p-3 text-center border border-border">
                    <p className="text-lg font-bold text-primary">Rs {getWorkerEarnings(showHisaab, data.orders, period).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{period}</p>
                  </div>
                ))}
              </div>

              {/* All-time Summary Card */}
              <div className="bg-background rounded-xl p-4 border border-border space-y-2">
                <h3 className="font-semibold text-sm mb-1">{isUrdu ? 'مکمل حساب' : 'All-Time Summary'}</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">✂️ {isUrdu ? 'سوٹ مکمل' : 'Suits Completed'}</span>
                    <span className="font-semibold">{allTimeSuits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">💰 {isUrdu ? 'کل کمائی' : 'Total Earned'}</span>
                    <span className="font-semibold">Rs {totalEarnedAll.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🔻 {isUrdu ? 'پیشگی' : 'Advances Taken'}</span>
                    <span className="font-semibold text-destructive">- Rs {totalAdvAll.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">💵 {isUrdu ? 'ادائیگی' : 'Payments Made'}</span>
                    <span className="font-semibold text-success">- Rs {totalPaidAll.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-1.5 flex justify-between font-bold text-base">
                    <span>{isUrdu ? 'باقی بیلنس' : 'Remaining Balance'}</span>
                    <span className={remainingBalance >= 0 ? 'text-primary' : 'text-destructive'}>Rs {remainingBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Weekly Hisaab */}
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <h3 className="font-semibold text-sm mb-2">{isUrdu ? 'ہفتہ وار حساب' : 'Weekly Hisaab'}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>✂️ {isUrdu ? 'سوٹ' : 'Suits'}</span>
                    <span className="font-semibold">{weeklySuits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>💰 {isUrdu ? 'کمائی' : 'Earned'}</span>
                    <span className="font-semibold">Rs {weeklyEarned.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🔻 {isUrdu ? 'پیشگی' : 'Advances'}</span>
                    <span className="font-semibold text-destructive">- Rs {weeklyAdv.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>💵 {isUrdu ? 'ادائیگی' : 'Payments'}</span>
                    <span className="font-semibold text-success">- Rs {weeklyPaid.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-1 flex justify-between font-bold">
                    <span>{isUrdu ? 'قابل ادائیگی' : 'Net Payable'}</span>
                    <span className="text-primary">Rs {(weeklyEarned - weeklyAdv - weeklyPaid).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Send Hisaab via WhatsApp */}
              {showHisaab.phone && (() => {
                const msg = getWorkerHisaabMessage(showHisaab.name, weeklyEarned, weeklyAdv, weeklyEarned - weeklyAdv - weeklyPaid, weeklySuits, isUrdu ? 'ur' : 'en');
                return (
                  <a href={getWhatsAppLink(showHisaab.phone, msg)} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-success/10 text-success font-semibold text-sm touch-target active:scale-95 transition-transform">
                    <MessageCircle size={16} /> {isUrdu ? 'واٹس ایپ پر حساب بھیجیں' : 'Send Hisaab via WhatsApp'}
                  </a>
                );
              })()}

              {/* Tabs: Advances / Payments */}
              <div className="flex gap-2">
                <button onClick={() => setHisaabTab('advances')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${hisaabTab === 'advances' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {isUrdu ? 'پیشگی دیں' : 'Give Advance'}
                </button>
                <button onClick={() => setHisaabTab('payments')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${hisaabTab === 'payments' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Banknote size={14} className="inline mr-1" />{isUrdu ? 'ادائیگی کریں' : 'Make Payment'}
                </button>
              </div>

              {/* Advance Form */}
              {hisaabTab === 'advances' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input type="number" placeholder={isUrdu ? 'رقم' : 'Amount'} value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
                    <button onClick={() => addAdvance(showHisaab)} className="px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm touch-target active:scale-95">
                      + {isUrdu ? 'شامل' : 'Add'}
                    </button>
                  </div>
                  <input placeholder={isUrdu ? 'نوٹ (اختیاری)' : 'Note (optional)'} value={advanceNote} onChange={e => setAdvanceNote(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  {showHisaab.advances.length > 0 && (
                    <div>
                      <h4 className="text-xs text-muted-foreground mb-1">{isUrdu ? 'حالیہ پیشگی' : 'Recent Advances'}</h4>
                      <div className="space-y-1">
                        {showHisaab.advances.slice(-10).reverse().map(a => (
                          <div key={a.id} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                            <div className="flex-1 min-w-0">
                              <span className="text-muted-foreground">{new Date(a.date).toLocaleDateString()}</span>
                              {a.note && <span className="text-[10px] text-muted-foreground ml-2">({a.note})</span>}
                            </div>
                            <span className="font-semibold text-destructive mr-2">Rs {a.amount.toLocaleString()}</span>
                            <button onClick={() => {
                              const updated = showHisaab.advances.filter(x => x.id !== a.id);
                              updateWorker(showHisaab.id, { advances: updated });
                              setShowHisaab({ ...showHisaab, advances: updated });
                            }} className="text-destructive/60 hover:text-destructive p-1 touch-target"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Form */}
              {hisaabTab === 'payments' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input type="number" placeholder={isUrdu ? 'رقم' : 'Amount'} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
                    <button onClick={() => addPayment(showHisaab)} className="px-4 py-3 bg-success text-success-foreground rounded-xl font-semibold text-sm touch-target active:scale-95">
                      + {isUrdu ? 'ادا' : 'Pay'}
                    </button>
                  </div>
                  <input placeholder={isUrdu ? 'نوٹ (اختیاری)' : 'Note (optional)'} value={paymentNote} onChange={e => setPaymentNote(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  {(showHisaab.payments || []).length > 0 && (
                    <div>
                      <h4 className="text-xs text-muted-foreground mb-1">{isUrdu ? 'حالیہ ادائیگی' : 'Recent Payments'}</h4>
                      <div className="space-y-1">
                        {(showHisaab.payments || []).slice(-10).reverse().map(p => (
                          <div key={p.id} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                            <div className="flex-1 min-w-0">
                              <span className="text-muted-foreground">{new Date(p.date).toLocaleDateString()}</span>
                              {p.note && <span className="text-[10px] text-muted-foreground ml-2">({p.note})</span>}
                            </div>
                            <span className="font-semibold text-success mr-2">Rs {p.amount.toLocaleString()}</span>
                            <button onClick={() => {
                              const updated = (showHisaab.payments || []).filter(x => x.id !== p.id);
                              updateWorker(showHisaab.id, { payments: updated });
                              setShowHisaab({ ...showHisaab, payments: updated });
                            }} className="text-destructive/60 hover:text-destructive p-1 touch-target"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Work History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center" onClick={() => setShowHistory(null)}>
          <div className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <h2 className="font-bold text-lg">{showHistory.name}</h2>
                <p className="text-xs text-muted-foreground">{isUrdu ? 'ورک ہسٹری' : 'Work History'}</p>
              </div>
              <button onClick={() => setShowHistory(null)} className="p-2 touch-target"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-2">
              {(() => {
                const history = getWorkerHistory(showHistory);
                if (history.length === 0) return <p className="text-center text-muted-foreground py-8 text-sm">{isUrdu ? 'کوئی کام نہیں' : 'No work assigned yet'}</p>;
                return history.map((item, i) => (
                  <div key={i} className="bg-background rounded-xl p-3 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="text-sm font-semibold">{item.customerName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{item.customerId}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                      <span>{suitTypeLabel(item.type)}</span>
                      {item.designWork && <span className="text-primary">✨ {isUrdu ? 'ڈیزائن' : 'Design'}</span>}
                      <span>Rs {(item.rate + item.designRate).toLocaleString()}</span>
                      <span>📅 {new Date(item.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}