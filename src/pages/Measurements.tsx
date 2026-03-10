import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import type { Customer, Measurements as MeasurementsType } from '@/lib/store';
import { generateId } from '@/lib/store';
import SearchBar from '@/components/SearchBar';
import { Ruler, X, User, ChevronRight, History } from 'lucide-react';
import VoiceInput from '@/components/VoiceInput';

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

export default function Measurements() {
  const { t, isUrdu } = useLang();
  const { data, updateCustomer } = useData();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementsType | null>(null);
  const [showHistory, setShowHistory] = useState<Customer | null>(null);

  const filtered = data.customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.customerId.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const openEdit = (c: Customer) => {
    setEditing(c);
    setMeasurements({ ...c.measurements });
  };

  const handleSave = () => {
    if (!editing || !measurements) return;
    // Save old measurements to history
    const oldM = editing.measurements;
    let history = editing.measurementHistory || [];
    const hasOld = oldM.chest || oldM.kameezLength || oldM.shoulder || oldM.waist;
    const changed = Object.keys(measurements).some(k => (measurements as unknown as Record<string, string>)[k] !== (oldM as unknown as Record<string, string>)[k]);
    if (hasOld && changed) {
      history = [...history, {
        id: generateId(),
        measurements: { ...oldM },
        date: new Date().toISOString(),
        note: isUrdu ? 'پرانے ناپ' : 'Previous measurements',
      }];
    }
    updateCustomer(editing.id, { measurements, measurementHistory: history });
    setEditing(null);
  };

  const fields = getMeasurementFields(t, isUrdu);

  const hasMeasurements = (c: Customer) => {
    const m = c.measurements;
    return m && (m.chest || m.kameezLength || m.shoulder || m.waist);
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2 mb-1">
        <Ruler size={22} className="text-primary" />
        <h2 className="text-lg font-bold">{t('measurements.title')}</h2>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      <div className="space-y-2">
        {filtered.map(customer => (
          <div key={customer.id} className="bg-card rounded-xl border border-border overflow-hidden">
            <div onClick={() => openEdit(customer)} className="p-4 flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{customer.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{customer.customerId}</p>
              </div>
              <div className="flex items-center gap-2">
                {hasMeasurements(customer) ? (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-success/10 text-success font-semibold">✓ {isUrdu ? 'ناپ موجود' : 'Measured'}</span>
                ) : (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-warning/10 text-warning font-semibold">{isUrdu ? 'ناپ نہیں' : 'No measurements'}</span>
                )}
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </div>
            </div>
            {(customer.measurementHistory?.length || 0) > 0 && (
              <div className="px-4 pb-3">
                <button onClick={() => setShowHistory(customer)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-info/10 text-info text-[10px] font-semibold active:scale-95 transition-transform">
                  <History size={12} /> {customer.measurementHistory.length} {isUrdu ? 'پرانے ریکارڈ' : 'previous records'}
                </button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">{isUrdu ? 'کوئی گاہک نہیں ملا' : 'No customers found'}</p>}
      </div>

      {/* Edit Modal */}
      {editing && measurements && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center" onClick={() => setEditing(null)}>
          <div className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <h2 className="font-bold text-lg">{editing.name}</h2>
                <p className="text-xs text-muted-foreground">{editing.customerId} · {t('measurements.title')}</p>
              </div>
              <button onClick={() => setEditing(null)} className="p-2 touch-target"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
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
                                    onClick={() => setMeasurements({ ...measurements, [item.key]: isSelected ? '' : opt.value })}
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
                            onChange={v => setMeasurements({ ...measurements, [item.key]: v })}
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
                <VoiceInput
                  value={measurements.notes}
                  onChange={v => setMeasurements({ ...measurements, notes: v })}
                  className="!rounded-xl"
                  multiline rows={3} append
                />
              </div>
              <button onClick={handleSave} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base touch-target active:scale-95 transition-transform">
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
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
            <div className="p-4 space-y-3">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <h4 className="text-xs font-semibold text-primary mb-2">{isUrdu ? 'موجودہ' : 'Current'}</h4>
                <MeasurementGrid m={showHistory.measurements} isUrdu={isUrdu} />
              </div>
              {(showHistory.measurementHistory || []).slice().reverse().map(r => (
                <div key={r.id} className="bg-muted/30 border border-border rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground mb-2">{new Date(r.date).toLocaleDateString()} · {r.note}</p>
                  <MeasurementGrid m={r.measurements} isUrdu={isUrdu} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MeasurementGrid({ m, isUrdu }: { m: MeasurementsType; isUrdu: boolean }) {
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
        <div key={i.label} className="text-xs"><span className="text-muted-foreground">{i.label}: </span><span className="font-semibold">{i.value}</span></div>
      ))}
    </div>
  );
}
