// Offline-first localStorage data store for Karachi Tailors

export type SuitStatus = 'received' | 'cutting' | 'stitching' | 'finishing' | 'packed' | 'ready' | 'delivered';

export interface Measurements {
  kameezLength: string;
  chest: string;
  shoulder: string;
  sleeve: string;
  collar: string;
  teera: string;
  kamar: string;
  daman: string;
  cuff: string;
  frontPocket: string;
  shalwarLength: string;
  waist: string;
  hip: string;
  pancha: string;
  notes: string;
  // Custom structural options
  kameezType?: string;
  cuffType?: string;
  pocketType?: string;
  bottomType?: string;
  buttonType?: string;
  customFields?: Record<string, string>;
}

export interface MeasurementRecord {
  id: string;
  measurements: Measurements;
  date: string;
  note: string;
}

export interface Customer {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  address: string;
  measurements: Measurements;
  measurementHistory: MeasurementRecord[];
  createdAt: string;
}

export interface StatusChange {
  status: SuitStatus;
  timestamp: string;
}

export interface SuitLocation {
  box: string;
  line: string;
  khanna: string;
}

export interface OrderSuit {
  id: string;
  status: SuitStatus;
  workerId?: string;
  workers?: Partial<Record<SuitStatus, string>>;
  type: 'kameez' | 'shalwar' | 'full_suit';
  designWork: boolean;
  notes: string;
  statusHistory: StatusChange[];
  location?: SuitLocation;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: 'cash' | 'bank' | 'easypaisa' | 'jazzcash' | 'other';
  note: string;
}

export interface Order {
  id: string;
  customerId: string;
  suits: OrderSuit[];
  totalAmount: number;
  advancePaid: number;
  paymentStatus: 'advance' | 'partial' | 'paid' | 'pending';
  paymentHistory: PaymentRecord[];
  deadline: string;
  notes: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface WorkerAdvance {
  id: string;
  amount: number;
  date: string;
  note: string;
}

export interface WorkerPayment {
  id: string;
  amount: number;
  date: string;
  note: string;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  role: string;
  experience: string;
  rateKameez: number;
  rateShalwar: number;
  rateSuit: number;
  rateDesign: number;
  advances: WorkerAdvance[];
  payments: WorkerPayment[];
  active: boolean;
}

export interface AppData {
  customers: Customer[];
  orders: Order[];
  workers: Worker[];
}

const STORAGE_KEY = 'karachi-tailors-data';
const STATUS_FLOW: SuitStatus[] = ['received', 'cutting', 'stitching', 'finishing', 'packed', 'ready', 'delivered'];

export const emptyMeasurements: Measurements = {
  kameezLength: '', chest: '', shoulder: '', sleeve: '', collar: '', teera: '', kamar: '', daman: '', cuff: '', frontPocket: '',
  shalwarLength: '', waist: '', hip: '', pancha: '', notes: '',
  kameezType: '', cuffType: '', pocketType: '', bottomType: '', buttonType: '',
  customFields: {},
};

function normalizeSuit(s: Partial<OrderSuit> & { workerId?: string }, createdAt: string): OrderSuit {
  const currentWorker = s.workerId || s.workers?.[s.status || 'received'];
  return {
    id: s.id || generateId(),
    status: s.status || 'received',
    type: s.type || 'full_suit',
    designWork: !!s.designWork,
    notes: s.notes || '',
    ...s,
    workerId: currentWorker,
    workers: s.workers || (currentWorker ? { [s.status || 'received']: currentWorker } : {}),
    statusHistory: s.statusHistory || [{ status: s.status || 'received', timestamp: createdAt }],
  } as OrderSuit;
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      data.customers = (data.customers || []).map((c: Customer) => ({
        ...c,
        address: c.address || '',
        measurementHistory: c.measurementHistory || [],
        measurements: { ...emptyMeasurements, ...c.measurements },
      }));
      data.orders = (data.orders || []).map((o: Order) => ({
        ...o,
        suits: (o.suits || []).map((s: OrderSuit) => normalizeSuit(s, o.createdAt)),
        notes: o.notes || '',
        paymentHistory: o.paymentHistory || [],
      }));
      data.workers = (data.workers || []).map((w: Worker) => ({
        ...w,
        role: w.role || '',
        experience: w.experience || '',
        payments: w.payments || [],
      }));
      return data;
    }
  } catch (e) {
    console.warn('LocalStorage data corrupted', e);
  }
  return { customers: [], orders: [], workers: [] };
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generateCustomerId(customers: Customer[]): string {
  const num = customers.length + 1;
  return `KT-${String(num).padStart(3, '0')}`;
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

function hasReachedStatus(suit: OrderSuit, status: SuitStatus): boolean {
  const currentIndex = STATUS_FLOW.indexOf(suit.status);
  const statusIndex = STATUS_FLOW.indexOf(status);
  if (currentIndex >= statusIndex) return true;
  return (suit.statusHistory || []).some((entry) => entry.status === status);
}

export function getAssignedWorkerIds(suit: OrderSuit): string[] {
  const ids = new Set<string>();
  if (suit.workerId) ids.add(suit.workerId);
  Object.values(suit.workers || {}).forEach((id) => {
    if (id) ids.add(id);
  });
  return Array.from(ids);
}

export function getWorkerForSuitStatus(suit: OrderSuit, status: SuitStatus = suit.status): string | undefined {
  return suit.workers?.[status] || (status === suit.status ? suit.workerId : undefined) || suit.workers?.ready || suit.workers?.packed;
}

function getSuitRate(worker: Worker, suit: OrderSuit): number {
  let total = suit.type === 'kameez'
    ? worker.rateKameez
    : suit.type === 'shalwar'
      ? worker.rateShalwar
      : worker.rateSuit;
  if (suit.designWork) total += worker.rateDesign;
  return total;
}

export function getWorkerEarnings(worker: Worker, orders: Order[], period: 'daily' | 'weekly' | 'monthly'): number {
  const now = new Date();
  const startDate = period === 'daily'
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
    : period === 'weekly'
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let total = 0;
  for (const order of orders) {
    if (new Date(order.createdAt) < startDate) continue;
    for (const suit of order.suits) {
      const matchedStatuses = Object.entries(suit.workers || {})
        .filter(([, workerId]) => workerId === worker.id)
        .map(([status]) => status as SuitStatus)
        .filter((status) => hasReachedStatus(suit, status));

      if (matchedStatuses.length > 0) {
        total += matchedStatuses.length * getSuitRate(worker, suit);
        continue;
      }

      if (suit.workerId === worker.id) {
        total += getSuitRate(worker, suit);
      }
    }
  }
  return total;
}

export function getWorkerAdvancesTotal(worker: Worker, period: 'weekly' | 'all'): number {
  if (period === 'all') return worker.advances.reduce((sum, a) => sum + a.amount, 0);
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return worker.advances
    .filter((a) => new Date(a.date) >= startDate)
    .reduce((sum, a) => sum + a.amount, 0);
}

export function getWorkerPaymentsTotal(worker: Worker, period: 'weekly' | 'all'): number {
  if (period === 'all') return (worker.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return (worker.payments || [])
    .filter((p) => new Date(p.date) >= startDate)
    .reduce((sum, p) => sum + p.amount, 0);
}

export function getWorkerSuitsCount(worker: Worker, orders: Order[], period: 'weekly' | 'all'): number {
  const now = new Date();
  const startDate = period === 'all' ? new Date(0) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  let count = 0;

  for (const order of orders) {
    if (new Date(order.createdAt) < startDate) continue;
    for (const suit of order.suits) {
      const completedAssignments = Object.entries(suit.workers || {})
        .filter(([, workerId]) => workerId === worker.id)
        .map(([status]) => status as SuitStatus)
        .filter((status) => hasReachedStatus(suit, status));

      if (completedAssignments.length > 0) {
        count += completedAssignments.length;
        continue;
      }

      if (suit.workerId === worker.id) count += 1;
    }
  }

  return count;
}
