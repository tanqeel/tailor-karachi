import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { emptyMeasurements, generateId } from '@/lib/store';
import type { Customer, Measurements, MeasurementRecord } from '@/lib/store';
import SearchBar from '@/components/SearchBar';
import { Plus, Phone, ChevronRight, X, User, MapPin, History } from 'lucide-react';
import VoiceInput from '@/components/VoiceInput';

const getMeasurementFields = (t: (k: string) => string, isUrdu: boolean) => [
  { section: t('measurements.kameez'), items: [
    { key: 'kameezLength', label: t('measurements.length') },
    { key: 'chest', label: t('measurements.chest') },
    { key: 'shoulder', label: t('measurements.shoulder') },
    { key: 'sleeve', label: t('measurements.sleeve') },
    { key: 'collar', label: t('measurements.collar') },
    { key: 'teera', label: isUrdu ? 'تیرا' : 'Teera' },
    { key: 'kamar', label: isUrdu ? 'کمر' : 'Kamar' },
    { key: 'daman', label: t('measurements.daman') },
  ]},
  { section: t('measurements.shalwar'), items: [
    { key: 'shalwarLength', label: t('measurements.length') },
    { key: 'pancha', label: isUrdu ? 'پونچا' : 'Pooncha' },
    { key: 'waist', label: t('measurements.waist') },
    { key: 'hip', label: t('measurements.hip') },
  ]},
];

function MeasurementForm({ measurements, onChange, t, isUrdu }: { measurements: Measurements; onChange: (m: Measurements) => void; t: (k: string) => string; isUrdu: boolean }) {
  const fields = getMeasurementFields(t, isUrdu);
  return (
    <div className="space-y-4">
      {fields.map(section => (
        <div key={section.section}>
          <h4 className="font-semibold text-sm mb-2 text-primary">{section.section}</h4>
          <div className="grid grid-cols-2 gap-2">
            {section.items.map(item => (
              <div key={item.key}>
                <label className="text-xs text-muted-foreground">{item.label}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={(measurements as any)[item.key] || ''}
                  onChange={e => onChange({ ...measurements, [item.key]: e.target.value })}
                  className="w-full px-3 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target"
                  placeholder='—'
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div>
        <label className="text-xs text-muted-foreground">{isUrdu ? 'نوٹس' : 'Notes'}</label>
        <VoiceInput value={measurements.notes} onChange={v => onChange({ ...measurements, notes: v })} multiline rows={2} append />
      </div>
    </div>
  );
}

export default function Customers() {
  const { t, isUrdu } = useLang();
  const { data, addCustomer, updateCustomer, deleteCustomer } = useData();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [measurements, setMeasurements] = useState<Measurements>(emptyMeasurements);
  const [showHistory, setShowHistory] = useState<Customer | null>(null);

  const filtered = data.customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.customerId.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.address || '').toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditing(null);
    setName(''); setPhone(''); setAddress('');
    setMeasurements(emptyMeasurements);
    setShowForm(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setName(c.name); setPhone(c.phone); setAddress(c.address || '');
    setMeasurements({ ...emptyMeasurements, ...c.measurements });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editing) {
      // Save current measurements to history if they changed
      const oldM = editing.measurements;
      const newM = measurements;
      const changed = Object.keys(newM).some(k => (newM as any)[k] !== (oldM as any)[k]);
      let history = editing.measurementHistory || [];
      if (changed && (oldM.chest || oldM.kameezLength)) {
        history = [...history, {
          id: generateId(),
          measurements: { ...oldM },
          date: new Date().toISOString(),
          note: isUrdu ? 'پرانے ناپ' : 'Previous measurements',
        }];
      }
      updateCustomer(editing.id, { name, phone, address, measurements, measurementHistory: history });
    } else {
      addCustomer({ name, phone, address, measurements });
    }
    setShowForm(false);
  };

  const orderCount = (cId: string) => data.orders.filter(o => o.customerId === cId).length;

  return (
    <div className="space-y-4 pb-4">
      <SearchBar value={search} onChange={setSearch} />

      <button onClick={openNew} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 touch-target active:scale-[0.98] transition-transform">
        <Plus size={20} /> {t('common.add')} {t('nav.customers')}
      </button>

      <div className="space-y-2">
        {filtered.map(customer => (
          <div key={customer.id} className="bg-card rounded-xl border border-border overflow-hidden">
            <div onClick={() => openEdit(customer)} className="p-4 flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{customer.name}</p>
                  <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-mono">{customer.customerId}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1"><Phone size={10} /> {customer.phone || (isUrdu ? 'فون نہیں' : 'No phone')}</span>
                  {customer.address && <span className="flex items-center gap-1"><MapPin size={10} /> {customer.address.slice(0, 20)}{customer.address.length > 20 ? '...' : ''}</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">{orderCount(customer.id)} {isUrdu ? 'آرڈرز' : 'orders'}</span>
                  {(customer.measurementHistory?.length || 0) > 0 && (
                    <span className="text-[10px] text-info">{customer.measurementHistory.length} {isUrdu ? 'ناپ ریکارڈ' : 'measurement records'}</span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </div>
            {(customer.measurementHistory?.length || 0) > 0 && (
              <div className="px-4 pb-3">
                <button onClick={() => setShowHistory(customer)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-info/10 text-info text-[10px] font-semibold active:scale-95 transition-transform">
                  <History size={12} /> {isUrdu ? 'ناپ کی تاریخ' : 'Measurement History'}
                </button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">{isUrdu ? 'کوئی گاہک نہیں ملا' : 'No customers found'}</p>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg">{editing ? t('common.edit') : t('common.add')} {t('nav.customers')}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 touch-target"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium">{t('common.name')} *</label>
                <VoiceInput value={name} onChange={setName} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">{t('common.phone')}</label>
                <VoiceInput value={phone} onChange={setPhone} type="tel" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">{isUrdu ? 'پتہ' : 'Address'}</label>
                <VoiceInput value={address} onChange={setAddress} placeholder={isUrdu ? 'مکمل پتہ...' : 'Full address...'} />
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('measurements.title')} ({isUrdu ? 'شلوار قمیض' : 'Shalwar Kameez'})</h3>
                <MeasurementForm measurements={measurements} onChange={setMeasurements} t={t} isUrdu={isUrdu} />
              </div>
              <div className="flex gap-3 pt-2">
                {editing && (
                  <button onClick={() => { deleteCustomer(editing.id); setShowForm(false); }} className="flex-1 py-3 rounded-xl border border-destructive text-destructive font-semibold touch-target active:scale-95">
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

      {/* Measurement History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center" onClick={() => setShowHistory(null)}>
          <div className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <h2 className="font-bold text-lg">{showHistory.name}</h2>
                <p className="text-xs text-muted-foreground">{isUrdu ? 'ناپ کی تاریخ' : 'Measurement History'}</p>
              </div>
              <button onClick={() => setShowHistory(null)} className="p-2 touch-target"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              {/* Current */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <h4 className="font-semibold text-sm text-primary mb-2">{isUrdu ? 'موجودہ ناپ' : 'Current Measurements'}</h4>
                <MeasurementDisplay m={showHistory.measurements} isUrdu={isUrdu} />
              </div>
              {/* History */}
              {(showHistory.measurementHistory || []).slice().reverse().map(record => (
                <div key={record.id} className="bg-muted/30 border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{new Date(record.date).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{record.note}</span>
                      <button onClick={() => {
                        const updated = (showHistory.measurementHistory || []).filter(r => r.id !== record.id);
                        updateCustomer(showHistory.id, { measurementHistory: updated });
                        setShowHistory({ ...showHistory, measurementHistory: updated });
                      }} className="text-destructive/60 hover:text-destructive p-1 touch-target"><X size={14} /></button>
                    </div>
                  </div>
                  <MeasurementDisplay m={record.measurements} isUrdu={isUrdu} />
                </div>
              ))}
              {(showHistory.measurementHistory || []).length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">{isUrdu ? 'کوئی پرانا ریکارڈ نہیں' : 'No previous records'}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MeasurementDisplay({ m, isUrdu }: { m: Measurements; isUrdu: boolean }) {
  const items = [
    { label: isUrdu ? 'لمبائی' : 'Length', value: m.kameezLength },
    { label: isUrdu ? 'سینہ' : 'Chest', value: m.chest },
    { label: isUrdu ? 'کندھا' : 'Shoulder', value: m.shoulder },
    { label: isUrdu ? 'آستین' : 'Sleeve', value: m.sleeve },
    { label: isUrdu ? 'کالر' : 'Collar', value: m.collar },
    { label: isUrdu ? 'تیرا' : 'Teera', value: m.teera },
    { label: isUrdu ? 'کمر' : 'Kamar', value: m.kamar },
    { label: isUrdu ? 'شلوار' : 'Shalwar', value: m.shalwarLength },
    { label: isUrdu ? 'پونچا' : 'Pooncha', value: m.pancha },
  ].filter(i => i.value);

  if (items.length === 0) return <p className="text-xs text-muted-foreground">{isUrdu ? 'خالی' : 'Empty'}</p>;

  return (
    <div className="grid grid-cols-3 gap-1">
      {items.map(i => (
        <div key={i.label} className="text-xs">
          <span className="text-muted-foreground">{i.label}: </span>
          <span className="font-semibold">{i.value}</span>
        </div>
      ))}
    </div>
  );
}
