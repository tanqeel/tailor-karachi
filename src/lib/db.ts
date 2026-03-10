import { get, set, keys, del } from 'idb-keyval';
import type { AppData, OrderSuit } from './store';
import { emptyMeasurements } from './store';

const DB_KEY = 'karachi-tailors-data';
const LEGACY_KEY = 'karachi-tailors-data';

function migrateData(data: AppData): AppData {
  data.customers = (data.customers || []).map((c) => ({
    ...c,
    address: c.address || '',
    measurementHistory: c.measurementHistory || [],
    measurements: { ...emptyMeasurements, ...c.measurements },
  }));

  data.orders = (data.orders || []).map((o) => ({
    ...o,
    notes: o.notes || '',
    paymentHistory: o.paymentHistory || [],
    suits: (o.suits || []).map((s: OrderSuit) => {
      const currentWorker = s.workerId || s.workers?.[s.status];
      return {
        ...s,
        workerId: currentWorker,
        workers: s.workers || (currentWorker ? { [s.status]: currentWorker } : {}),
        statusHistory: s.statusHistory || [{ status: s.status, timestamp: o.createdAt }],
      };
    }),
  }));

  data.workers = (data.workers || []).map((w) => ({
    ...w,
    role: w.role || '',
    experience: w.experience || '',
    payments: w.payments || [],
  }));

  return data;
}

export async function loadDataFromDB(): Promise<AppData> {
  try {
    const data = await get<AppData>(DB_KEY);
    if (data) return migrateData(data);

    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const parsed: AppData = JSON.parse(raw);
      const migrated = migrateData(parsed);
      await set(DB_KEY, migrated);
      return migrated;
    }
  } catch (e) {
    console.warn('IndexedDB load failed, falling back to localStorage', e);
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (raw) return migrateData(JSON.parse(raw));
    } catch (fallbackError) {
      // Ignore errors in final fallback
    }
  }
  return { customers: [], orders: [], workers: [] };
}

export async function saveDataToDB(data: AppData): Promise<void> {
  try {
    await set(DB_KEY, data);
  } catch (e) {
    console.warn('IndexedDB save failed, falling back to localStorage', e);
  }
  try {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(data));
  } catch (e) {
    // Ignore localStorage quota errors
  }
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  size: number;
}

export async function performDailyBackup(data: AppData): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const backupKey = `karachi-tailors-backup-${today}`;
  try {
    const existing = await get(backupKey);
    if (!existing) {
      await set(backupKey, { timestamp: new Date().toISOString(), data });
    }
  } catch (e) {
    console.warn('Backup failed', e);
  }
}

export async function getAvailableBackups(): Promise<BackupRecord[]> {
  try {
    const allKeys = await keys();
    const backupKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith('karachi-tailors-backup-')) as string[];
    const records: BackupRecord[] = [];
    for (const key of backupKeys) {
      const parts = key.split('karachi-tailors-backup-');
      if (parts.length === 2) {
        const entry = await get<{ timestamp: string; data: AppData }>(key);
        if (entry) {
          records.push({
            id: parts[1],
            timestamp: entry.timestamp,
            size: JSON.stringify(entry.data).length,
          });
        }
      }
    }
    return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    console.error('Failed to list backups', e);
    return [];
  }
}

export async function restoreBackup(id: string): Promise<AppData | null> {
  try {
    const entry = await get<{ timestamp: string; data: AppData }>(`karachi-tailors-backup-${id}`);
    if (entry && entry.data) {
      await saveDataToDB(entry.data);
      return entry.data;
    }
  } catch (e) {
    console.error('Restore failed', e);
  }
  return null;
}

export async function deleteBackup(id: string): Promise<void> {
  try {
    await del(`karachi-tailors-backup-${id}`);
  } catch (e) {
    console.warn('Delete backup failed', e);
  }
}
