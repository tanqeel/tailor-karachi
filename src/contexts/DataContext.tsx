import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppData, Customer, Order, Worker, generateId, generateCustomerId, emptyMeasurements } from '@/lib/store';
import { loadDataFromDB, saveDataToDB } from '@/lib/db';

interface DataContextType {
  data: AppData;
  loading: boolean;
  addCustomer: (c: Omit<Customer, 'id' | 'customerId' | 'createdAt' | 'measurementHistory'>) => Customer;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addOrder: (o: Omit<Order, 'id' | 'createdAt'>) => Order;
  updateOrder: (id: string, o: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  addWorker: (w: Omit<Worker, 'id' | 'advances' | 'payments' | 'active'>) => Worker;
  updateWorker: (id: string, w: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;
  setData: (d: AppData) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, _setData] = useState<AppData>({ customers: [], orders: [], workers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDataFromDB().then(d => { _setData(d); setLoading(false); });
  }, []);

  const persist = useCallback((d: AppData) => { _setData(d); saveDataToDB(d); }, []);

  const addCustomer = useCallback((c: Omit<Customer, 'id' | 'customerId' | 'createdAt' | 'measurementHistory'>) => {
    const customer: Customer = {
      ...c,
      id: generateId(),
      customerId: generateCustomerId(data.customers),
      address: c.address || '',
      measurements: c.measurements || emptyMeasurements,
      measurementHistory: [],
      createdAt: new Date().toISOString(),
    };
    const next = { ...data, customers: [...data.customers, customer] };
    persist(next);
    return customer;
  }, [data, persist]);

  const updateCustomer = useCallback((id: string, c: Partial<Customer>) => {
    persist({ ...data, customers: data.customers.map(x => x.id === id ? { ...x, ...c } : x) });
  }, [data, persist]);

  const deleteCustomer = useCallback((id: string) => {
    persist({ ...data, customers: data.customers.filter(x => x.id !== id) });
  }, [data, persist]);

  const addOrder = useCallback((o: Omit<Order, 'id' | 'createdAt'>) => {
    const order: Order = { ...o, id: generateId(), createdAt: new Date().toISOString() };
    persist({ ...data, orders: [...data.orders, order] });
    return order;
  }, [data, persist]);

  const updateOrder = useCallback((id: string, o: Partial<Order>) => {
    persist({ ...data, orders: data.orders.map(x => x.id === id ? { ...x, ...o } : x) });
  }, [data, persist]);

  const deleteOrder = useCallback((id: string) => {
    persist({ ...data, orders: data.orders.filter(x => x.id !== id) });
  }, [data, persist]);

  const addWorker = useCallback((w: Omit<Worker, 'id' | 'advances' | 'payments' | 'active'>) => {
    const worker: Worker = { ...w, id: generateId(), advances: [], payments: [], active: true };
    persist({ ...data, workers: [...data.workers, worker] });
    return worker;
  }, [data, persist]);

  const updateWorker = useCallback((id: string, w: Partial<Worker>) => {
    persist({ ...data, workers: data.workers.map(x => x.id === id ? { ...x, ...w } : x) });
  }, [data, persist]);

  const deleteWorker = useCallback((id: string) => {
    persist({ ...data, workers: data.workers.filter(x => x.id !== id) });
  }, [data, persist]);

  const setData = useCallback((d: AppData) => persist(d), [persist]);

  return (
    <DataContext.Provider value={{
      data, loading, addCustomer, updateCustomer, deleteCustomer,
      addOrder, updateOrder, deleteOrder,
      addWorker, updateWorker, deleteWorker, setData,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
