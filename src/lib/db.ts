// IndexedDB persistence layer using idb-keyval
import { get, set } from 'idb-keyval';
import type { AppData } from './store';
import { emptyMeasurements } from './store';

const DB_KEY = 'karachi-tailors-data';
const LEGACY_KEY = 'karachi-tailors-data';

function migrateData(data: AppData): AppData {
  // Migrate customers: add address, measurementHistory, new measurement fields
  data.customers = (data.customers || []).map((c: any) => ({
    ...c,
    address: c.address || '',
    measurementHistory: c.measurementHistory || [],
    measurements: { ...emptyMeasurements, ...c.measurements },
  }));
  // Migrate orders: add statusHistory to suits
  data.orders = (data.orders || []).map((o: any) => ({
    ...o,
    suits: (o.suits || []).map((s: any) => ({
      ...s,
      statusHistory: s.statusHistory || [{ status: s.status, timestamp: o.createdAt }],
    })),
  }));
  data.workers = data.workers || [];
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
    } catch {}
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
  } catch {}
}
