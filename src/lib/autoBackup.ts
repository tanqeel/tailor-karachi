// Auto daily backup system for localStorage

import type { AppData } from './store';
import { sendBrowserNotification } from './notifications';

const BACKUP_PREFIX = 'kt-backup-';
const LAST_BACKUP_KEY = 'kt-last-backup';
const MAX_BACKUPS = 7; // Keep last 7 days

export function getLastBackupTime(): string | null {
  return localStorage.getItem(LAST_BACKUP_KEY);
}

export function shouldAutoBackup(): boolean {
  const last = getLastBackupTime();
  if (!last) return true;
  const lastDate = new Date(last).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return lastDate !== today;
}

export function performAutoBackup(data: AppData): string {
  const timestamp = new Date().toISOString();
  const key = BACKUP_PREFIX + timestamp.slice(0, 10);
  
  // Save backup
  localStorage.setItem(key, JSON.stringify({ data, timestamp }));
  localStorage.setItem(LAST_BACKUP_KEY, timestamp);
  
  // Cleanup old backups (keep only MAX_BACKUPS)
  cleanupOldBackups();
  
  return timestamp;
}

function cleanupOldBackups() {
  const backupKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(BACKUP_PREFIX)) backupKeys.push(key);
  }
  backupKeys.sort().reverse();
  backupKeys.slice(MAX_BACKUPS).forEach(k => localStorage.removeItem(k));
}

export function listBackups(): { date: string; timestamp: string; key: string }[] {
  const backups: { date: string; timestamp: string; key: string }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(BACKUP_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          backups.push({
            date: key.replace(BACKUP_PREFIX, ''),
            timestamp: parsed.timestamp,
            key,
          });
        }
      } catch {}
    }
  }
  return backups.sort((a, b) => b.date.localeCompare(a.date));
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
