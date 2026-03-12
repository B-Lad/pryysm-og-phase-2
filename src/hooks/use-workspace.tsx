'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './use-auth';
import { toast } from './use-toast';
import {
  generateOrders, INITIAL_CUSTOMERS, generateDocuments, INITIAL_PRINTERS,
  generateSpools, generateResins, generatePowders, generateInventory, generateUnassignedJobs,
  calcInvStatus, calcMatStatus,
  type Order, type Customer, type Document, type Printer, type PrinterStatus,
  type Spool, type Resin, type Powder, type InventoryItem, type UnassignedJob, type ShippingLog,
} from './workspace-data';

export type { Order, Customer, Document, Printer, PrinterStatus, PrinterTechnology, Spool, Resin, Powder, InventoryItem, UnassignedJob, ShippingLog };
export type { Currency, MaterialStatus } from './workspace-data';

interface WorkspaceState {
  orders: Order[];
  customers: Customer[];
  documents: Document[];
  printers: Printer[];
  spools: Spool[];
  resins: Resin[];
  powders: Powder[];
  inventory: InventoryItem[];
  unassignedJobs: UnassignedJob[];
  shippingLogs: ShippingLog[];
  idCounters: Record<string, number>;
}

interface WorkspaceContextType extends WorkspaceState {
  isLoading: boolean;
  addOrder: (order: Omit<Order, 'id' | 'status'>) => Order;
  updateOrderStatus: (id: number, status: Order['status']) => void;
  addCustomer: (c: Omit<Customer, 'id' | 'customerCode'>) => Customer;
  updateCustomer: (c: Customer) => void;
  deleteCustomer: (id: string) => void;
  addPrinter: (p: Omit<Printer, 'id' | 'currentJob'>) => void;
  deletePrinter: (id: string) => void;
  updatePrinterStatus: (id: string, status: PrinterStatus) => void;
  addUnassignedJob: (job: UnassignedJob) => void;
  assignJobToPrinter: (job: UnassignedJob, printerId: string) => void;
  autoAssignJob: (job: UnassignedJob) => void;
  deleteUnassignedJob: (id: number | string) => void;
  addSpool: (s: Omit<Spool, 'id' | 'spoolId' | 'status'>) => void;
  deleteSpool: (id: number) => void;
  logSpoolUsage: (id: number, amount: number) => void;
  addResin: (r: Omit<Resin, 'id' | 'resinId' | 'status'>) => void;
  deleteResin: (id: number) => void;
  logResinUsage: (id: number, amount: number) => void;
  addPowder: (p: Omit<Powder, 'id' | 'powderId' | 'status'>) => void;
  deletePowder: (id: number) => void;
  logPowderUsage: (id: number, amount: number) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'barcode' | 'status'>) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;
  useInventoryItem: (id: string, qty: number) => void;
  addShippingLog: (log: Omit<ShippingLog, 'id' | 'createdAt'>) => void;
  resetToSampleData: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

function getDefaultData(isNew = false): WorkspaceState {
  if (isNew) {
    return { orders: [], customers: [], documents: [], printers: [], spools: [], resins: [], powders: [], inventory: [], unassignedJobs: [], shippingLogs: [], idCounters: { customer: 1, printer: 1, item: 1, spool: 1, resin: 1, powder: 1 } };
  }
  const orders = generateOrders();
  return {
    orders,
    customers: INITIAL_CUSTOMERS,
    documents: generateDocuments(),
    printers: INITIAL_PRINTERS,
    spools: generateSpools(),
    resins: generateResins(),
    powders: generatePowders(),
    inventory: generateInventory(),
    unassignedJobs: generateUnassignedJobs(orders),
    shippingLogs: [],
    idCounters: { customer: 7, printer: 7, item: 9, spool: 26, resin: 4, powder: 4 },
  };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    const key = `pryysm_ws_${user.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try { setState(JSON.parse(saved)); } catch { setState(getDefaultData()); }
    } else if (localStorage.getItem('new_signup') === 'true') {
      setState(getDefaultData(true));
      localStorage.removeItem('new_signup');
    } else if (localStorage.getItem('isDemoUser') === 'true') {
      setState(getDefaultData());
    } else {
      setState(getDefaultData());
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!state || !user) return;
    const key = `pryysm_ws_${user.id}`;
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [state, user]);

  const update = useCallback((fn: (prev: WorkspaceState) => WorkspaceState) => {
    setState(prev => prev ? fn(prev) : prev);
  }, []);

  const ws = state ?? getDefaultData();

  const ctx: WorkspaceContextType = {
    ...ws,
    isLoading,

    addOrder: (orderData) => {
      const newOrder: Order = { ...orderData, id: Date.now(), status: 'pending', items: Number(orderData.items) };
      const newJob: UnassignedJob = { id: newOrder.id, name: `Order: ${newOrder.orderNumber}`, projectCode: newOrder.projectCode, priority: newOrder.priority, deadline: newOrder.deadline, requiredTechnology: newOrder.printerTech, estimatedTime: newOrder.items * 180, items: newOrder.items, orderNumber: newOrder.orderNumber };
      update(prev => ({ ...prev, orders: [newOrder, ...prev.orders], unassignedJobs: [newJob, ...prev.unassignedJobs] }));
      toast({ title: 'Order created', description: `${newOrder.orderNumber} added to job queue` });
      return newOrder;
    },

    updateOrderStatus: (id, status) => {
      update(prev => ({ ...prev, orders: prev.orders.map(o => o.id === id ? { ...o, status } : o) }));
    },

    addCustomer: (data) => {
      const n = ws.idCounters.customer;
      const newC: Customer = { ...data, id: `CUST-${String(n).padStart(3, '0')}`, customerCode: `C-${n}` };
      update(prev => ({ ...prev, customers: [newC, ...prev.customers], idCounters: { ...prev.idCounters, customer: n + 1 } }));
      toast({ title: 'Customer added' });
      return newC;
    },

    updateCustomer: (c) => {
      update(prev => ({ ...prev, customers: prev.customers.map(x => x.id === c.id ? c : x) }));
      toast({ title: 'Customer updated' });
    },

    deleteCustomer: (id) => {
      update(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) }));
    },

    addPrinter: (data) => {
      const newP: Printer = { ...data, id: `P-${Date.now()}`, currentJob: null };
      update(prev => ({ ...prev, printers: [...prev.printers, newP] }));
      toast({ title: `Printer "${data.name}" added` });
    },

    deletePrinter: (id) => {
      update(prev => ({ ...prev, printers: prev.printers.filter(p => p.id !== id) }));
      toast({ title: 'Printer removed' });
    },

    updatePrinterStatus: (id, status) => {
      update(prev => ({ ...prev, printers: prev.printers.map(p => p.id === id ? { ...p, status } : p) }));
    },

    assignJobToPrinter: (job, printerId) => {
      const printer = ws.printers.find(p => p.id === printerId);
      if (!printer) return;
      update(prev => ({
        ...prev,
        unassignedJobs: prev.unassignedJobs.filter(j => j.id !== job.id),
        printers: prev.printers.map(p => p.id === printerId ? { ...p, status: 'printing', currentJob: { name: job.name, progress: 5 } } : p),
      }));
      toast({ title: `"${job.name}" assigned to ${printer.name}` });
    },

    autoAssignJob: (job) => {
      const compatible = ws.printers.filter(p => (!job.requiredTechnology || p.technology === job.requiredTechnology));
      const best = compatible.find(p => p.status === 'idle') || compatible[0];
      if (!best) { toast({ title: 'No compatible printer found', variant: 'destructive' }); return; }
      ctx.assignJobToPrinter(job, best.id);
      toast({ title: `Auto-assigned to ${best.name} 🤖` });
    },

    addUnassignedJob: (job) => {
      update(prev => ({ ...prev, unassignedJobs: [job, ...prev.unassignedJobs] }));
    },

    deleteUnassignedJob: (id) => {
      update(prev => ({ ...prev, unassignedJobs: prev.unassignedJobs.filter(j => j.id !== id) }));
    },

    addSpool: (data) => {
      const n = ws.idCounters.spool + 1;
      const newS: Spool = { ...data, id: n, spoolId: `SP${String(n).padStart(3, '0')}`, used: 0, status: 'New' };
      update(prev => ({ ...prev, spools: [newS, ...prev.spools], idCounters: { ...prev.idCounters, spool: n } }));
      toast({ title: 'Spool added' });
    },
    deleteSpool: (id) => update(prev => ({ ...prev, spools: prev.spools.filter(s => s.id !== id) })),
    logSpoolUsage: (id, amount) => {
      update(prev => ({ ...prev, spools: prev.spools.map(s => { if (s.id !== id) return s; const u = Math.min(s.used + amount, s.weight); return { ...s, used: u, status: calcMatStatus(u, s.weight) }; }) }));
      toast({ title: 'Usage logged' });
    },

    addResin: (data) => {
      const n = ws.idCounters.resin + 1;
      const newR: Resin = { ...data, id: n, resinId: `RS${String(n).padStart(3, '0')}`, used: 0, status: 'New' };
      update(prev => ({ ...prev, resins: [newR, ...prev.resins], idCounters: { ...prev.idCounters, resin: n } }));
      toast({ title: 'Resin added' });
    },
    deleteResin: (id) => update(prev => ({ ...prev, resins: prev.resins.filter(r => r.id !== id) })),
    logResinUsage: (id, amount) => {
      update(prev => ({ ...prev, resins: prev.resins.map(r => { if (r.id !== id) return r; const u = Math.min(r.used + amount, r.volume); return { ...r, used: u, status: calcMatStatus(u, r.volume) }; }) }));
      toast({ title: 'Usage logged' });
    },

    addPowder: (data) => {
      const n = ws.idCounters.powder + 1;
      const newP: Powder = { ...data, id: n, powderId: `PW${String(n).padStart(3, '0')}`, used: 0, status: 'New' };
      update(prev => ({ ...prev, powders: [newP, ...prev.powders], idCounters: { ...prev.idCounters, powder: n } }));
      toast({ title: 'Powder added' });
    },
    deletePowder: (id) => update(prev => ({ ...prev, powders: prev.powders.filter(p => p.id !== id) })),
    logPowderUsage: (id, amount) => {
      update(prev => ({ ...prev, powders: prev.powders.map(p => { if (p.id !== id) return p; const u = Math.min(p.used + amount, p.weight); return { ...p, used: u, status: calcMatStatus(u, p.weight) }; }) }));
      toast({ title: 'Usage logged' });
    },

    addInventoryItem: (data) => {
      const n = ws.idCounters.item + 1;
      const newItem: InventoryItem = { ...data, id: `ITEM-${n}`, barcode: `ITEM-${Date.now()}`, quantity: Number(data.quantity), minStock: Number(data.minStock), minOrder: Number(data.minOrder || 0), status: calcInvStatus(Number(data.quantity), Number(data.minStock)) };
      update(prev => ({ ...prev, inventory: [newItem, ...prev.inventory], idCounters: { ...prev.idCounters, item: n } }));
      toast({ title: 'Item added to inventory' });
    },

    updateInventoryItem: (item) => {
      const updated = { ...item, status: calcInvStatus(item.quantity, item.minStock) };
      update(prev => ({ ...prev, inventory: prev.inventory.map(i => i.id === item.id ? updated : i) }));
    },

    deleteInventoryItem: (id) => {
      update(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== id) }));
    },

    useInventoryItem: (id, qty) => {
      update(prev => ({ ...prev, inventory: prev.inventory.map(i => { if (i.id !== id) return i; const q = Math.max(0, i.quantity - qty); return { ...i, quantity: q, status: calcInvStatus(q, i.minStock) }; }) }));
      toast({ title: `Used ${qty} units` });
    },

    addShippingLog: (data) => {
      const log: ShippingLog = { ...data, id: `SL-${Date.now()}`, createdAt: new Date().toISOString() };
      update(prev => ({ ...prev, shippingLogs: [log, ...prev.shippingLogs] }));
    },

    resetToSampleData: () => {
      setState(getDefaultData());
      toast({ title: 'Workspace reset to sample data' });
    },
  };

  return <WorkspaceContext.Provider value={ctx}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
