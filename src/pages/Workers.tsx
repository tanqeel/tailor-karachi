import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { getWorkerEarnings, getWorkerAdvancesTotal, generateId } from '@/lib/store';
import type { Worker, WorkerAdvance } from '@/lib/store';
import SearchBar from '@/components/SearchBar';
import { Plus, X, Wallet, TrendingUp, ChevronRight } from 'lucide-react';

export default function Workers() {
  const { t } = useLang();
  const { data, addWorker, updateWorker, deleteWorker } = useData();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [showHisaab, setShowHisaab] = useState<Worker | null>(null);

  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rateKameez, setRateKameez] = useState('');
  const [rateShalwar, setRateShalwar] = useState('');
  const [rateSuit, setRateSuit] = useState('');
  const [rateDesign, setRateDesign] = useState('');

  // Advance form
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceNote, setAdvanceNote] = useState('');

  const filtered = data.workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) || w.phone.includes(search)
  );

  const openNew = () => {
    setEditing(null);
    setName(''); setPhone('');
    setRateKameez(''); setRateShalwar(''); setRateSuit(''); setRateDesign('');
    setShowForm(true);
  };

  const openEdit = (w: Worker) => {
    setEditing(w);
    setName(w.name); setPhone(w.phone);
    setRateKameez(String(w.rateKameez)); setRateShalwar(String(w.rateShalwar));
    setRateSuit(String(w.rateSuit)); setRateDesign(String(w.rateDesign));
    setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const workerData = {
      name, phone,
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
    // Refresh hisaab view
    setShowHisaab(data.workers.find(w => w.id === worker.id) || worker);
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
          const weeklyAdvances = getWorkerAdvancesTotal(worker, 'weekly');
          const activeSuits = data.orders.flatMap(o => o.suits).filter(s => s.workerId === worker.id && s.status !== 'delivered').length;

          return (
            <div key={worker.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 flex items-center gap-3" onClick={() => openEdit(worker)}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold">
                  {worker.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{worker.name}</p>
                  <p className="text-xs text-muted-foreground">{activeSuits} active suits · Rs {weeklyEarnings.toLocaleString()}/wk</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </div>
              <div className="px-4 pb-3 flex gap-2">
                <button onClick={() => { setShowHisaab(worker); setAdvanceAmount(''); setAdvanceNote(''); }} className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold touch-target active:scale-95">
                  <Wallet size={14} className="inline mr-1" /> {t('worker.hisaab')}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No workers found</p>}
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
                <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">{t('common.phone')}</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">{t('worker.rate.kameez')}</label>
                  <input type="number" value={rateKameez} onChange={e => setRateKameez(e.target.value)} placeholder="Rs" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">{t('worker.rate.shalwar')}</label>
                  <input type="number" value={rateShalwar} onChange={e => setRateShalwar(e.target.value)} placeholder="Rs" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">{t('worker.rate.suit')}</label>
                  <input type="number" value={rateSuit} onChange={e => setRateSuit(e.target.value)} placeholder="Rs" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">{t('worker.rate.design')}</label>
                  <input type="number" value={rateDesign} onChange={e => setRateDesign(e.target.value)} placeholder="Rs" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
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
      {showHisaab && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center" onClick={() => setShowHisaab(null)}>
          <div className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg">{showHisaab.name} - {t('worker.hisaab')}</h2>
              <button onClick={() => setShowHisaab(null)} className="p-2 touch-target"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              {/* Earnings Summary */}
              <div className="grid grid-cols-3 gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map(period => (
                  <div key={period} className="bg-background rounded-xl p-3 text-center border border-border">
                    <p className="text-lg font-bold text-primary">Rs {getWorkerEarnings(showHisaab, data.orders, period).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{period}</p>
                  </div>
                ))}
              </div>

              {/* Weekly Hisaab */}
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <h3 className="font-semibold text-sm mb-2">Weekly Hisaab</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Earned</span>
                    <span className="font-semibold">Rs {getWorkerEarnings(showHisaab, data.orders, 'weekly').toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advances</span>
                    <span className="font-semibold text-destructive">- Rs {getWorkerAdvancesTotal(showHisaab, 'weekly').toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-1 flex justify-between font-bold">
                    <span>Net Payable</span>
                    <span className="text-primary">Rs {(getWorkerEarnings(showHisaab, data.orders, 'weekly') - getWorkerAdvancesTotal(showHisaab, 'weekly')).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Give Advance */}
              <div>
                <h3 className="font-semibold text-sm mb-2">{t('worker.advances')}</h3>
                <div className="flex gap-2">
                  <input type="number" placeholder="Amount" value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
                  <button onClick={() => addAdvance(showHisaab)} className="px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm touch-target active:scale-95">
                    + Add
                  </button>
                </div>
                <input placeholder="Note (optional)" value={advanceNote} onChange={e => setAdvanceNote(e.target.value)} className="w-full mt-2 px-4 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>

              {/* Advance History */}
              {showHisaab.advances.length > 0 && (
                <div>
                  <h4 className="text-xs text-muted-foreground mb-2">Recent Advances</h4>
                  <div className="space-y-1">
                    {showHisaab.advances.slice(-10).reverse().map(a => (
                      <div key={a.id} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                        <span className="text-muted-foreground">{new Date(a.date).toLocaleDateString()}</span>
                        <span className="font-semibold">Rs {a.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
