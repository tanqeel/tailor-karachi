// IndexedDB persistence layer using idb-keyval
import { get, set } from 'idb-keyval';
import type { AppData } from './store';

const DB_KEY = 'karachi-tailors-data';
const LEGACY_KEY = 'karachi-tailors-data'; // localStorage key for migration

export async function loadDataFromDB(): Promise<AppData> {
  try {
    // Try IndexedDB first
    const data = await get<AppData>(DB_KEY);
    if (data) return data;

    // Migrate from localStorage if exists
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const parsed: AppData = JSON.parse(raw);
      await set(DB_KEY, parsed);
      // Keep localStorage as backup, don't delete
      return parsed;
    }
  } catch (e) {
    console.warn('IndexedDB load failed, falling back to localStorage', e);
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (raw) return JSON.parse(raw);
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
  // Always keep localStorage as fallback backup
  try {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(data));
  } catch {}
}
