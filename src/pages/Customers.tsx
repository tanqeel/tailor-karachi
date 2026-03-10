import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { emptyMeasurements, generateId } from '@/lib/store';
import type { Customer, Measurements, MeasurementRecord } from '@/lib/store';
import { customerSchema, cleanInput } from '@/lib/validation';
import SearchBar from '@/components/SearchBar';
import { Plus, Phone, ChevronRight, X, User, MapPin, History } from 'lucide-react';
import VoiceInput from '@/components/VoiceInput';
import { toast } from 'sonner';

interface MeasurementField {
  key: string;
  label: string;
  options?: { value: string; labelEn: string; labelUr: string }[];
}

const getMeasurementFields = (t: (k: string) => string, isUrdu: boolean): { section: string, items: MeasurementField[] }[] => [
  {
    section: t('measurements.kameez'), items: [
      { key: 'kameezLength', label: t('measurements.length') },
      { key: 'chest', label: t('measurements.chest') },
      { key: 'shoulder', label: t('measurements.shoulder') },
      { key: 'sleeve', label: t('measurements.sleeve') },
      { key: 'kamar', label: t('measurements.kamar') },
      { key: 'daman', label: t('measurements.daman') },
      { key: 'teera', label: t('measurements.teera') },
      { key: 'collar', label: t('measurements.collar') },
      {
        key: 'kameezType', label: isUrdu ? 'کالر اسٹائل' : 'Collar Style', options: [
          { value: 'collar', labelEn: 'Collar', labelUr: 'کالر' },
          { value: 'ban', labelEn: 'Ban', labelUr: 'بین' },
          { value: 'half-ban', labelEn: 'Half Ban', labelUr: 'ہاف بین' },
          { value: 'magzi', labelEn: 'Magzi', labelUr: 'مغزی' },
        ]
      },
      { key: 'cuff', label: t('measurements.cuff') },
      {
        key: 'cuffType', label: isUrdu ? 'کف اسٹائل' : 'Cuff Style', options: [
          { value: 'normal', labelEn: 'Normal', labelUr: 'نارمل' },
          { value: 'cut', labelEn: 'Cut', labelUr: 'کٹ' },
          { value: 'double', labelEn: 'Double', labelUr: 'ڈبل' },
        ]
      },
      { key: 'frontPocket', label: t('measurements.frontPocket') },
      {
        key: 'pocketType', label: isUrdu ? 'جیب اسٹائل' : 'Pocket Style', options: [
          { value: 'front', labelEn: 'Front', labelUr: 'سامنے' },
          { value: 'side', labelEn: 'Side', labelUr: 'سائیڈ' },
          { value: 'both', labelEn: 'Both', labelUr: 'دونوں' },
          { value: 'none', labelEn: 'None', labelUr: 'کوئی نہیں' },
        ]
      },
      {
        key: 'buttonType', label: isUrdu ? 'بٹن' : 'Buttons', options: [
          { value: 'fancy', labelEn: 'Fancy', labelUr: 'فینسی' },
          { value: 'covered', labelEn: 'Covered', labelUr: 'کورڈ' },
          { value: 'simple', labelEn: 'Simple', labelUr: 'سادہ' },
        ]
      },
    ]
  },
  {
    section: t('measurements.shalwar'), items: [
      { key: 'shalwarLength', label: t('measurements.length') },
      { key: 'pancha', label: t('measurements.pancha') },
      { key: 'waist', label: t('measurements.waist') },
      { key: 'hip', label: t('measurements.hip') },
      {
        key: 'bottomType', label: isUrdu ? 'شلوار اسٹائل' : 'Shalwar Style', options: [
          { value: 'simple', labelEn: 'Simple', labelUr: 'سادہ' },
          { value: 'design', labelEn: 'Design', labelUr: 'ڈیزائن' },
          { value: 'heavy', labelEn: 'Heavy', labelUr: 'بھاری' },
        ]
      },
    ]
  },
];

function MeasurementForm({ measurements, onChange, t, isUrdu }: { measurements: Measurements; onChange: (m: Measurements) => void; t: (k: string) => string; isUrdu: boolean }) {
  const fields = getMeasurementFields(t, isUrdu);
  return (
    <div className="space-y-4">
      {fields.map(section => (
        <div key={section.section} className="bg-card/50 rounded-xl p-3 border border-border">
          <h4 className="font-semibold text-sm mb-3 text-primary">{section.section}</h4>
          <div className="grid grid-cols-2 gap-3">
            {section.items.map(item => {
              const val = String((measurements as unknown as Record<string, string>)[item.key] || '');

              if (item.options) {
                return (
                  <div key={item.key} className="col-span-2 space-y-1.5 mt-1 border-t border-border/50 pt-3">
                    <label className="text-xs font-semibold text-muted-foreground">{item.label}</label>
                    <div className="flex flex-wrap gap-2">
                      {item.options.map(opt => {
                        const isSelected = val === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => onChange({ ...measurements, [item.key]: isSelected ? '' : opt.value })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-target ${isSelected
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                              }`}
                          >
                            {isUrdu ? opt.labelUr : opt.labelEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <div key={item.key}>
                  <label className="text-xs text-muted-foreground">{item.label}</label>
                  <VoiceInput
                    type="text"
                    inputMode="decimal"
                    value={val}
                    onChange={v => onChange({ ...measurements, [item.key]: v })}
                    className="!px-3 !py-3 !rounded-xl !bg-background !border-border text-sm !focus:outline-none !focus:ring-2 !focus:ring-primary/30"
                    placeholder="—"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="bg-card/50 rounded-xl p-3 border border-border">
        <label className="text-xs font-semibold mb-2 block">{isUrdu ? 'مزید تفصیلی نوٹس' : 'Detailed Notes'}</label>
        <VoiceInput value={measurements.notes} onChange={v => onChange({ ...measurements, notes: v })} multiline rows={2} append className="!rounded-xl" />
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
    const trimmedName = cleanInput(name, 100);
    const trimmedPhone = cleanInput(phone, 20);
    const trimmedAddress = cleanInput(address, 300);

    const validation = customerSchema.safeParse({ name: trimmedName, phone: trimmedPhone, address: trimmedAddress });
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Invalid input';
      toast.error(firstError);
      return;
    }

    if (editing) {
      const oldM = editing.measurements;
      const newM = measurements;
      const changed = Object.keys(newM).some(k => (newM as unknown as Record<string, string>)[k] !== (oldM as unknown as Record<string, string>)[k]);
      let history = editing.measurementHistory || [];
      if (changed && (oldM.chest || oldM.kameezLength)) {
        history = [...history, {
          id: generateId(),
          measurements: { ...oldM },
          date: new Date().toISOString(),
          note: isUrdu ? 'پرانے ناپ' : 'Previous measurements',
        }];
      }
      updateCustomer(editing.id, { name: trimmedName, phone: trimmedPhone, address: trimmedAddress, measurements, measurementHistory: history });
    } else {
      addCustomer({ name: trimmedName, phone: trimmedPhone, address: trimmedAddress, measurements });
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
          <div key={customer.id} className="premium-card rounded-xl overflow-hidden">
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
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowForm(false)}>
          <div className="premium-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 glass-panel sticky top-0 z-10">
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
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowHistory(null)}>
          <div className="premium-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 glass-panel sticky top-0 z-10">
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
    { label: isUrdu ? 'دامن' : 'Daman', value: m.daman },
    { label: isUrdu ? 'کف' : 'Cuff', value: m.cuff },
    { label: isUrdu ? 'جیب' : 'Pocket', value: m.frontPocket },
    { label: isUrdu ? 'ٹیگ (قمیض)' : 'Kameez Type', value: m.kameezType },
    { label: isUrdu ? 'اسٹائل (کف)' : 'Cuff Style', value: m.cuffType },
    { label: isUrdu ? 'اسٹائل (جیب)' : 'Pocket Style', value: m.pocketType },
    { label: isUrdu ? 'بٹن' : 'Buttons', value: m.buttonType },
    { label: isUrdu ? 'شلوار' : 'Shalwar', value: m.shalwarLength },
    { label: isUrdu ? 'پونچا' : 'Pooncha', value: m.pancha },
    { label: isUrdu ? 'کمر' : 'Waist', value: m.waist },
    { label: isUrdu ? 'ہپ' : 'Hip', value: m.hip },
    { label: isUrdu ? 'اسٹائل (شلوار)' : 'Bottom Style', value: m.bottomType },
  ].filter(i => i.value);

  if (items.length === 0) return <p className="text-xs text-muted-foreground">{isUrdu ? 'خالی' : 'Empty'}</p>;

  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
      {items.map(i => (
        <div key={i.label} className="text-[11px] flex justify-between border-b border-border/50 pb-0.5">
          <span className="text-muted-foreground">{i.label}</span>
          <span className="font-semibold text-right">{i.value}</span>
        </div>
      ))}
    </div>
  );
}
