import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { emptyMeasurements } from '@/lib/store';
import type { Customer, Measurements } from '@/lib/store';
import SearchBar from '@/components/SearchBar';
import { Plus, Phone, ChevronRight, X, User } from 'lucide-react';

function MeasurementForm({ measurements, onChange, t }: { measurements: Measurements; onChange: (m: Measurements) => void; t: (k: string) => string }) {
  const fields = [
    { section: t('measurements.kameez'), items: [
      { key: 'kameezLength', label: t('measurements.length') },
      { key: 'chest', label: t('measurements.chest') },
      { key: 'shoulder', label: t('measurements.shoulder') },
      { key: 'sleeve', label: t('measurements.sleeve') },
      { key: 'collar', label: t('measurements.collar') },
      { key: 'daman', label: t('measurements.daman') },
    ]},
    { section: t('measurements.shalwar'), items: [
      { key: 'shalwarLength', label: t('measurements.length') },
      { key: 'waist', label: t('measurements.waist') },
      { key: 'hip', label: t('measurements.hip') },
      { key: 'pancha', label: t('measurements.pancha') },
    ]},
  ];

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
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder='—'
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div>
        <label className="text-xs text-muted-foreground">Notes</label>
        <textarea
          value={measurements.notes}
          onChange={e => onChange({ ...measurements, notes: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          rows={2}
        />
      </div>
    </div>
  );
}

export default function Customers() {
  const { t } = useLang();
  const { data, addCustomer, updateCustomer, deleteCustomer } = useData();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [measurements, setMeasurements] = useState<Measurements>(emptyMeasurements);

  const filtered = data.customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.customerId.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const openNew = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setMeasurements(emptyMeasurements);
    setShowForm(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setName(c.name);
    setPhone(c.phone);
    setMeasurements(c.measurements);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editing) {
      updateCustomer(editing.id, { name, phone, measurements });
    } else {
      addCustomer({ name, phone, measurements });
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-4 pb-4">
      <SearchBar value={search} onChange={setSearch} />

      <button onClick={openNew} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 touch-target active:scale-[0.98] transition-transform">
        <Plus size={20} /> {t('common.add')} {t('nav.customers')}
      </button>

      <div className="space-y-2">
        {filtered.map(customer => (
          <div key={customer.id} onClick={() => openEdit(customer)} className="bg-card rounded-xl p-4 border border-border flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">{customer.name}</p>
                <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-mono">{customer.customerId}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Phone size={12} /> {customer.phone || 'No phone'}
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">No customers found</p>
        )}
      </div>

      {/* Modal */}
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
                <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">{t('common.phone')}</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('measurements.title')}</h3>
                <MeasurementForm measurements={measurements} onChange={setMeasurements} t={t} />
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
    </div>
  );
}
