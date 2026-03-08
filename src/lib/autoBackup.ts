// Auto daily backup system for localStorage

import type { AppData } from './store';
import { sendBrowserNotification } from './notifications';

const BACKUP_PREFIX = 'kt-backup-';
const LAST_BACKUP_KEY = 'kt-last-backup';
const MAX_BACKUPS = 7; // Keep last 7 days
const BACKUP_ENABLED_KEY = 'kt-auto-backup-enabled';

export function isAutoBackupEnabled(): boolean {
  const val = localStorage.getItem(BACKUP_ENABLED_KEY);
  return val === null ? true : val === 'true'; // enabled by default
}

export function setAutoBackupEnabled(enabled: boolean): void {
  localStorage.setItem(BACKUP_ENABLED_KEY, String(enabled));
}

export function getLastBackupTime(): string | null {
  return localStorage.getItem(LAST_BACKUP_KEY);
}

export function shouldAutoBackup(): boolean {
  if (!isAutoBackupEnabled()) return false;
  const last = getLastBackupTime();
  if (!last) return true;
  const lastDate = new Date(last).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return lastDate !== today;
}

export function performAutoBackup(data: AppData): string {
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

  localStorage.setItem(key, JSON.stringify(backupMeta));
  localStorage.setItem(LAST_BACKUP_KEY, timestamp);
  
  cleanupOldBackups();
  
  return timestamp;
}

export function performManualBackup(data: AppData): string {
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

  localStorage.setItem(key, JSON.stringify(backupMeta));
  localStorage.setItem(LAST_BACKUP_KEY, timestamp);
  
  return timestamp;
}

function cleanupOldBackups() {
  const backupKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(BACKUP_PREFIX) && !key.includes('manual')) backupKeys.push(key);
  }
  backupKeys.sort().reverse();
  backupKeys.slice(MAX_BACKUPS).forEach(k => localStorage.removeItem(k));
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

export function listBackups(): BackupInfo[] {
  const backups: BackupInfo[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(BACKUP_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          backups.push({
            date: key.replace(BACKUP_PREFIX, '').replace('manual-', ''),
            timestamp: parsed.timestamp,
            key,
            manual: !!parsed.manual,
            stats: parsed.stats,
          });
        }
      } catch {}
    }
  }
  return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function deleteBackup(key: string): void {
  localStorage.removeItem(key);
}

export function restoreBackup(key: string): AppData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data as AppData;
  } catch {
    return null;
  }
}

export function downloadBackupAsFile(data: AppData): void {
  const backup = {
    appName: 'Karachi Tailors',
    version: '1.0',
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
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        // Support both direct AppData format and wrapped format
        const appData = parsed.data || parsed;
        if (appData.customers && appData.orders && appData.workers) {
          resolve(appData as AppData);
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

export function runAutoBackupCheck(data: AppData, lang: 'en' | 'ur') {
  if (shouldAutoBackup() && (data.customers.length > 0 || data.orders.length > 0)) {
    const timestamp = performAutoBackup(data);
    sendBrowserNotification(
      lang === 'ur' ? '✅ خودکار بیک اپ مکمل' : '✅ Auto Backup Complete',
      lang === 'ur'
        ? `آپ کا ڈیٹا ${new Date(timestamp).toLocaleString()} پر محفوظ ہو گیا`
        : `Your data was backed up at ${new Date(timestamp).toLocaleString()}`
    );
  }
}
