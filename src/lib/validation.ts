import { z } from 'zod';
import type { AppData } from './store';

// Sanitize string input - strip potential XSS
export function sanitize(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Sanitize for display only (not storage) - trim and limit length
export function cleanInput(input: string, maxLength = 200): string {
  return input.trim().slice(0, maxLength);
}

// Phone validation (Pakistani format)
export const phoneSchema = z.string()
  .trim()
  .refine(val => val === '' || /^(\+?92|0)?[\s-]?\d{3}[\s-]?\d{7}$/.test(val.replace(/[\s-]/g, '')), {
    message: 'Invalid phone number format',
  });

// Customer validation
export const customerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  phone: phoneSchema,
  address: z.string().trim().max(300, 'Address too long'),
});

// Order validation
export const orderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  deadline: z.string().min(1, 'Deadline is required'),
  totalAmount: z.number().min(0, 'Amount must be positive').max(10_000_000, 'Amount too large'),
  advancePaid: z.number().min(0, 'Advance must be positive').max(10_000_000, 'Advance too large'),
});

// Worker validation
export const workerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  phone: phoneSchema,
  rateKameez: z.number().min(0).max(1_000_000),
  rateShalwar: z.number().min(0).max(1_000_000),
  rateSuit: z.number().min(0).max(1_000_000),
  rateDesign: z.number().min(0).max(1_000_000),
});

// Payment validation
export const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(10_000_000, 'Amount too large'),
  method: z.enum(['cash', 'bank', 'easypaisa', 'jazzcash', 'other']),
  note: z.string().trim().max(200, 'Note too long'),
});

// Backup import validation - deep check structure integrity
export function validateBackupData(data: unknown): { valid: boolean; data?: AppData; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format' };
  }

  const d = data as Record<string, unknown>;

  // Support wrapped format
  const appData = (d.data && typeof d.data === 'object') ? d.data as Record<string, unknown> : d;

  if (!Array.isArray(appData.customers)) return { valid: false, error: 'Missing or invalid customers array' };
  if (!Array.isArray(appData.orders)) return { valid: false, error: 'Missing or invalid orders array' };
  if (!Array.isArray(appData.workers)) return { valid: false, error: 'Missing or invalid workers array' };

  // Validate each customer has required fields
  const customers = appData.customers as Array<{ id?: string; name?: string }>;
  for (const c of customers) {
    if (!c.id || typeof c.id !== 'string') return { valid: false, error: 'Invalid customer: missing id' };
    if (!c.name || typeof c.name !== 'string') return { valid: false, error: `Invalid customer ${c.id}: missing name` };
    if (c.name.length > 200) return { valid: false, error: `Customer name too long: ${c.name.slice(0, 20)}...` };
  }

  // Validate each order
  const orders = appData.orders as Array<{ id?: string; customerId?: string; suits?: any[]; totalAmount?: number }>;
  for (const o of orders) {
    if (!o.id || typeof o.id !== 'string') return { valid: false, error: 'Invalid order: missing id' };
    if (!o.customerId || typeof o.customerId !== 'string') return { valid: false, error: `Invalid order ${o.id}: missing customerId` };
    if (!Array.isArray(o.suits)) return { valid: false, error: `Invalid order ${o.id}: missing suits array` };
    if (typeof o.totalAmount !== 'number' || o.totalAmount < 0) return { valid: false, error: `Invalid order ${o.id}: bad totalAmount` };
  }

  // Validate workers
  const workers = appData.workers as Array<{ id?: string; name?: string }>;
  for (const w of workers) {
    if (!w.id || typeof w.id !== 'string') return { valid: false, error: 'Invalid worker: missing id' };
    if (!w.name || typeof w.name !== 'string') return { valid: false, error: `Invalid worker ${w.id}: missing name` };
  }

  // Size check - prevent massive imports
  const jsonSize = JSON.stringify(appData).length;
  if (jsonSize > 50 * 1024 * 1024) { // 50MB limit
    return { valid: false, error: 'Backup file too large (max 50MB)' };
  }

  return { valid: true, data: appData as unknown as AppData };
}

// Generate checksum for data integrity verification
export function generateChecksum(data: AppData): string {
  const str = JSON.stringify({
    c: data.customers.length,
    o: data.orders.length,
    w: data.workers.length,
    t: data.orders.reduce((s, o) => s + o.totalAmount, 0),
  });
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
