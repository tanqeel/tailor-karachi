// Offline-first localStorage data store for Karachi Tailors

export type SuitStatus = 'received' | 'cutting' | 'stitching' | 'finishing' | 'packed' | 'ready' | 'delivered';

export interface Measurements {
  // Kameez
  kameezLength: string;
  chest: string;
  shoulder: string;
  sleeve: string;
  collar: string;
  daman: string;
  cuff: string;
  frontPocket: string;
  // Shalwar
  shalwarLength: string;
  waist: string;
  hip: string;
  pancha: string;
  // Notes
  notes: string;
}

export interface Customer {
  id: string;
  customerId: string; // e.g. KT-0001
  name: string;
  phone: string;
  measurements: Measurements;
  createdAt: string;
}

export interface OrderSuit {
  id: string;
  status: SuitStatus;
  workerId?: string;
  type: 'kameez' | 'shalwar' | 'full_suit';
  designWork: boolean;
  notes: string;
}

export interface Order {
  id: string;
  customerId: string;
  suits: OrderSuit[];
  totalAmount: number;
  advancePaid: number;
  paymentStatus: 'advance' | 'partial' | 'paid' | 'pending';
  deadline: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface WorkerAdvance {
  id: string;
  amount: number;
  date: string;
  note: string;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  rateKameez: number;
  rateShalwar: number;
  rateSuit: number;
  rateDesign: number;
  advances: WorkerAdvance[];
  active: boolean;
}

export interface AppData {
  customers: Customer[];
  orders: Order[];
  workers: Worker[];
}

const STORAGE_KEY = 'karachi-tailors-data';

export const emptyMeasurements: Measurements = {
  kameezLength: '', chest: '', shoulder: '', sleeve: '', collar: '', daman: '', cuff: '', frontPocket: '',
  shalwarLength: '', waist: '', hip: '', pancha: '', notes: '',
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { customers: [], orders: [], workers: [] };
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generateCustomerId(customers: Customer[]): string {
  const num = customers.length + 1;
  return `KT-${String(num).padStart(4, '0')}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function exportBackup(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `karachi-tailors-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getDeadlineStatus(deadline: string): 'overdue' | 'urgent' | 'approaching' | 'ok' {
  const now = new Date();
  const dl = new Date(deadline);
  const diffDays = (dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'overdue';
  if (diffDays < 1) return 'urgent';
  if (diffDays < 3) return 'approaching';
  return 'ok';
}

export function getWorkerEarnings(worker: Worker, orders: Order[], period: 'daily' | 'weekly' | 'monthly'): number {
  const now = new Date();
  let startDate: Date;
  if (period === 'daily') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'weekly') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  let total = 0;
  for (const order of orders) {
    if (new Date(order.createdAt) < startDate) continue;
    for (const suit of order.suits) {
      if (suit.workerId !== worker.id) continue;
      if (suit.type === 'kameez') total += worker.rateKameez;
      else if (suit.type === 'shalwar') total += worker.rateShalwar;
      else total += worker.rateSuit;
      if (suit.designWork) total += worker.rateDesign;
    }
  }
  return total;
}

export function getWorkerAdvancesTotal(worker: Worker, period: 'weekly'): number {
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return worker.advances
    .filter(a => new Date(a.date) >= startDate)
    .reduce((sum, a) => sum + a.amount, 0);
}
