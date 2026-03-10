// Auto daily backup system for IndexedDB

import type { AppData } from './store';
import { sendBrowserNotification } from './notifications';
import { get, set, keys, del } from 'idb-keyval';

const BACKUP_PREFIX = 'kt-backup-';
const LAST_BACKUP_KEY = 'kt-last-backup';
const BACKUP_ENABLED_KEY = 'kt-auto-backup-enabled';
const MAX_BACKUPS = 30; // Keep last 30 days in IndexedDB

export async function isAutoBackupEnabled(): Promise<boolean> {
  const val = await get(BACKUP_ENABLED_KEY);
  return val === undefined ? true : val; // enabled by default
}

export async function setAutoBackupEnabled(enabled: boolean): Promise<void> {
  await set(BACKUP_ENABLED_KEY, enabled);
}

export async function getLastBackupTime(): Promise<string | null> {
  const val = await get<string>(LAST_BACKUP_KEY);
  return val || null;
}

export async function shouldAutoBackup(): Promise<boolean> {
  const enabled = await isAutoBackupEnabled();
  if (!enabled) return false;
  const last = await getLastBackupTime();
  if (!last) return true;
  const lastDate = new Date(last).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return lastDate !== today;
}

export async function performAutoBackup(data: AppData): Promise<string> {
  const timestamp = new Date().toISOString();
  const key = BACKUP_PREFIX + timestamp.slice(0, 10);

  const backupMeta = {
    data,
    timestamp,
    stats: {
      customers: data.customers.length,
      orders: data.orders.length,
      workers: data.workers.length,
      totalSuits: data.orders.reduce((sum, o) => sum + o.suits.length, 0),
      totalMeasurements: data.customers.filter(c =>
        Object.values(c.measurements).some(v => v && v.trim() !== '')
      ).length,
      totalPayments: data.orders.reduce((sum, o) => sum + (o.paymentHistory?.length || 0), 0),
    },
  };

  await set(key, backupMeta);
  await set(LAST_BACKUP_KEY, timestamp);

  await cleanupOldBackups();

  return timestamp;
}

export async function performManualBackup(data: AppData): Promise<string> {
  const timestamp = new Date().toISOString();
  const key = BACKUP_PREFIX + 'manual-' + timestamp.replace(/[:.]/g, '-');

  const backupMeta = {
    data,
    timestamp,
    manual: true,
    stats: {
      customers: data.customers.length,
      orders: data.orders.length,
      workers: data.workers.length,
      totalSuits: data.orders.reduce((sum, o) => sum + o.suits.length, 0),
      totalMeasurements: data.customers.filter(c =>
        Object.values(c.measurements).some(v => v && v.trim() !== '')
      ).length,
      totalPayments: data.orders.reduce((sum, o) => sum + (o.paymentHistory?.length || 0), 0),
    },
  };

  await set(key, backupMeta);
  await set(LAST_BACKUP_KEY, timestamp);

  return timestamp;
}

async function cleanupOldBackups(): Promise<void> {
  const allKeys = await keys();
  const backupKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(BACKUP_PREFIX) && !k.includes('manual')) as string[];
  backupKeys.sort().reverse();
  const toDelete = backupKeys.slice(MAX_BACKUPS);
  for (const k of toDelete) {
    await del(k);
  }
}

export interface BackupInfo {
  date: string;
  timestamp: string;
  key: string;
  manual: boolean;
  stats?: {
    customers: number;
    orders: number;
    workers: number;
    totalSuits: number;
    totalMeasurements: number;
    totalPayments: number;
  };
}

export async function listBackups(): Promise<BackupInfo[]> {
  const backups: BackupInfo[] = [];
  const allKeys = await keys();
  for (const key of allKeys) {
    if (typeof key === 'string' && key.startsWith(BACKUP_PREFIX)) {
      try {
        const parsed = await get<{ timestamp: string; manual?: boolean; stats?: BackupInfo['stats'] }>(key);
        if (parsed && parsed.timestamp) {
          backups.push({
            date: key.replace(BACKUP_PREFIX, '').replace('manual-', ''),
            timestamp: parsed.timestamp,
            key,
            manual: !!parsed.manual,
            stats: parsed.stats,
          });
        }
      } catch (e) {
        // Skip corrupted entries
      }
    }
  }
  return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function deleteBackup(key: string): Promise<void> {
  await del(key);
}

export async function restoreBackup(key: string): Promise<AppData | null> {
  try {
    const parsed = await get<{ data: AppData }>(key);
    if (!parsed) return null;
    return parsed.data;
  } catch (e) {
    console.error('Failed to restore backup from key', key, e);
    return null;
  }
}

export function downloadBackupAsFile(data: AppData): void {
  const backup = {
    appName: 'Karachi Tailors',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    data,
    stats: {
      customers: data.customers.length,
      orders: data.orders.length,
      workers: data.workers.length,
      totalSuits: data.orders.reduce((sum, o) => sum + o.suits.length, 0),
    },
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `karachi-tailors-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackupFromFile(file: File): Promise<AppData | null> {
  return new Promise((resolve) => {
    if (file.size > 200 * 1024 * 1024) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const appData = parsed.data || parsed;
        if (
          appData.customers && Array.isArray(appData.customers) &&
          appData.orders && Array.isArray(appData.orders) &&
          appData.workers && Array.isArray(appData.workers)
        ) {
          const validCustomers = appData.customers.every((c: { id?: string; name?: string }) => c.id && c.name);
          const validOrders = appData.orders.every((o: { id?: string; customerId?: string; suits?: unknown[] }) => o.id && o.customerId && Array.isArray(o.suits));
          const validWorkers = appData.workers.every((w: { id?: string; name?: string }) => w.id && w.name);
          if (validCustomers && validOrders && validWorkers) {
            resolve(appData as AppData);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}

export async function runAutoBackupCheck(data: AppData, lang: 'en' | 'ur') {
  if (await shouldAutoBackup() && (data.customers.length > 0 || data.orders.length > 0)) {
    const timestamp = await performAutoBackup(data);
    sendBrowserNotification(
      lang === 'ur' ? '✅ خودکار بیک اپ مکمل' : '✅ Auto Backup Complete',
      lang === 'ur'
        ? `آپ کا ڈیٹا ${new Date(timestamp).toLocaleString()} پر محفوظ ہو گیا`
        : `Your data was backed up at ${new Date(timestamp).toLocaleString()}`
    );
  }
}
