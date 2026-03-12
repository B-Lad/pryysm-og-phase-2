import { subDays, addDays } from 'date-fns';

export type Currency = 'USD' | 'EUR' | 'AED' | 'INR';
export type MaterialStatus = 'New' | 'Active' | 'Low' | 'Critical' | 'Empty';
export type PrinterStatus = 'printing' | 'idle' | 'maintenance' | 'offline';
export type PrinterTechnology = 'FDM' | 'SLA' | 'SLS' | 'DLP' | 'MJF' | 'EBM' | 'DMLS';
export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
export type InventoryCategory = 'Packing Material' | 'Electronics' | 'Tools' | 'Miscellaneous';
export type OrderStatus = 'pending' | 'in-progress' | 'overdue' | 'qc' | 'packing' | 'dispatched' | 'completed';

export interface Order {
  id: number;
  customer: string;
  orderNumber: string;
  projectCode: string;
  orderDate: string;
  deadline: string;
  status: OrderStatus;
  items: number;
  priority: 'low' | 'medium' | 'high';
  printerTech: string;
  salesPerson: string;
  notes?: string;
  imageUrl?: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  taxId?: string;
}

export interface Document {
  id: string;
  customerId: string;
  orderNumber: string;
  type: 'Quotation' | 'Purchase Order' | 'Tax Invoice';
  date: string;
  amount: number;
}

export interface Printer {
  id: string;
  name: string;
  model: string;
  codeName: string;
  location: string;
  technology: PrinterTechnology;
  capacity: string;
  material: string;
  status: PrinterStatus;
  currentJob?: { name: string; progress: number } | null;
}

export interface Spool {
  id: number;
  spoolId: string;
  name: string;
  brand: string;
  color: string;
  material: string;
  finish: string;
  weight: number;
  used: number;
  price: number;
  currency: Currency;
  purchaseDate: string;
  notes?: string;
  status: MaterialStatus;
  assignedToPrinterId?: string | null;
  location?: string;
  minStock: number;
  minOrder: number;
}

export interface Resin {
  id: number;
  resinId: string;
  name: string;
  brand: string;
  color: string;
  type: string;
  volume: number;
  used: number;
  price: number;
  currency: Currency;
  purchaseDate: string;
  notes?: string;
  status: MaterialStatus;
  assignedToPrinterId?: string | null;
  location?: string;
  minStock: number;
  minOrder: number;
}

export interface Powder {
  id: number;
  powderId: string;
  name: string;
  brand: string;
  material: string;
  color?: string;
  weight: number;
  used: number;
  price: number;
  currency: Currency;
  purchaseDate: string;
  notes?: string;
  status: MaterialStatus;
  assignedToPrinterId?: string | null;
  location?: string;
  minStock: number;
  minOrder: number;
}

export interface InventoryItem {
  id: string;
  barcode: string;
  name: string;
  description?: string;
  category: InventoryCategory;
  quantity: number;
  minStock: number;
  minOrder: number;
  location?: string;
  status: StockStatus;
}

export interface UnassignedJob {
  id: number | string;
  name: string;
  projectCode: string;
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  requiredTechnology: string;
  estimatedTime: number;
  items: number;
  orderNumber?: string;
}

export interface ShippingLog {
  id: string;
  orderId: string;
  from: string;
  to: string;
  trackingNumber: string;
  weight: string;
  contents: string;
  createdAt: string;
}

// ─── Status helpers ──────────────────────────────────────────────────────────

export function calcMatStatus(used: number, total: number): MaterialStatus {
  if (total <= 0 || used >= total) return 'Empty';
  const r = ((total - used) / total) * 100;
  if (r <= 10) return 'Critical';
  if (r <= 30) return 'Low';
  if (used === 0) return 'New';
  return 'Active';
}

export function calcInvStatus(qty: number, min: number): StockStatus {
  if (qty <= 0) return 'Out of Stock';
  if (qty < min) return 'Low Stock';
  return 'In Stock';
}

// ─── Data generators ─────────────────────────────────────────────────────────

const customerNames = ['Innovate LLC', 'Design Co.', 'Engineering Dynamics', 'AeroSpace Solutions', 'MediTech Devices', 'Auto Parts Pro'];
const printerTechs = ['FDM', 'SLA', 'SLS', 'MJF'];
const salesPeople = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Chen', 'David Wilson'];

export function generateOrders(): Order[] {
  const orders: Order[] = [];
  const today = new Date();
  for (let i = 1; i <= 40; i++) {
    const orderDate = subDays(today, Math.floor(Math.random() * 120));
    const deadline = addDays(orderDate, Math.floor(Math.random() * 10) + 5);
    let status: OrderStatus;
    if (deadline < today && i % 4 !== 0) status = 'overdue';
    else if (i % 4 === 0) status = 'completed';
    else status = 'in-progress';
    orders.push({
      id: i,
      customer: customerNames[i % customerNames.length],
      orderNumber: `ORD-${String(i).padStart(3, '0')}`,
      projectCode: `PRJ-${String(i).padStart(3, '0')}`,
      orderDate: orderDate.toISOString().split('T')[0],
      deadline: deadline.toISOString().split('T')[0],
      status, items: Math.floor(Math.random() * 10) + 1,
      priority: (['low', 'medium', 'high'] as const)[i % 3],
      printerTech: printerTechs[i % printerTechs.length],
      salesPerson: salesPeople[i % salesPeople.length],
      notes: `Notes for order ${i}`,
    });
  }
  // Add pending orders
  for (let i = 41; i <= 46; i++) {
    const orderDate = subDays(today, i - 40);
    orders.push({
      id: i, customer: customerNames[i % customerNames.length],
      orderNumber: `ORD-${String(i).padStart(3, '0')}`,
      projectCode: `PRJ-${String(i).padStart(3, '0')}`,
      orderDate: orderDate.toISOString().split('T')[0],
      deadline: addDays(orderDate, 15).toISOString().split('T')[0],
      status: 'pending', items: Math.floor(Math.random() * 20) + 1,
      priority: (['low', 'medium', 'high'] as const)[i % 3],
      printerTech: printerTechs[i % printerTechs.length],
      salesPerson: salesPeople[i % salesPeople.length],
    });
  }
  return orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
}

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'CUST-001', customerCode: 'INNO-01', name: 'Innovate LLC', email: 'contact@innovatellc.com', phone: '555-123-4567', address: '123 Tech Park, Silicon Valley, CA 94043', company: 'Innovate LLC', taxId: 'TAX-INNO-123' },
  { id: 'CUST-002', customerCode: 'DSGN-01', name: 'Design Co.', email: 'accounts@designco.net', phone: '555-987-6543', address: '456 Creative Ave, Arts District, NY 10013', company: 'Design Co.', taxId: 'TAX-DSGN-456' },
  { id: 'CUST-003', customerCode: 'ENGI-01', name: 'Engineering Dynamics', email: 'procurement@engdynamics.com', phone: '555-555-1212', address: '789 Industrial Blvd, Detroit, MI 48226', company: 'Engineering Dynamics', taxId: 'TAX-ENGI-789' },
  { id: 'CUST-004', customerCode: 'AERO-01', name: 'AeroSpace Solutions', email: 'contact@aerospacesol.com', phone: '555-234-5678', address: '321 Flight Path, Seattle, WA 98108', company: 'AeroSpace Solutions', taxId: 'TAX-AERO-321' },
  { id: 'CUST-005', customerCode: 'MEDI-01', name: 'MediTech Devices', email: 'info@meditech.dev', phone: '555-345-6789', address: '654 Health Ave, Boston, MA 02110', company: 'MediTech Devices', taxId: 'TAX-MEDI-654' },
  { id: 'CUST-006', customerCode: 'AUTO-01', name: 'Auto Parts Pro', email: 'sales@autopartspro.com', phone: '555-456-7890', address: '987 Piston St, Dearborn, MI 48120', company: 'Auto Parts Pro', taxId: 'TAX-AUTO-987' },
];

export function generateDocuments(): Document[] {
  const docs: Document[] = [];
  let n = 1;
  for (let i = 1; i <= 40; i++) {
    const cust = INITIAL_CUSTOMERS[i % INITIAL_CUSTOMERS.length];
    const d = subDays(new Date(), Math.floor(Math.random() * 180));
    const amt = Math.floor(Math.random() * 2000) + 150;
    docs.push({ id: `DOC-${String(n++).padStart(3,'0')}`, customerId: cust.id, orderNumber: `ORD-${String(i).padStart(3,'0')}`, type: 'Quotation', date: d.toISOString().split('T')[0], amount: amt });
    if (i % 5 !== 0) docs.push({ id: `DOC-${String(n++).padStart(3,'0')}`, customerId: cust.id, orderNumber: `ORD-${String(i).padStart(3,'0')}`, type: 'Purchase Order', date: addDays(d, 2).toISOString().split('T')[0], amount: amt });
    if (i % 3 !== 0) docs.push({ id: `DOC-${String(n++).padStart(3,'0')}`, customerId: cust.id, orderNumber: `ORD-${String(i).padStart(3,'0')}`, type: 'Tax Invoice', date: addDays(d, 7).toISOString().split('T')[0], amount: amt * 1.05 });
  }
  return docs;
}

export const INITIAL_PRINTERS: Printer[] = [
  { id: '1', name: 'Prusa i3 MK3S+', model: 'i3 MK3S+', codeName: 'PRUSA01', location: 'Lab 1', technology: 'FDM', capacity: 'Standard', material: 'PLA', status: 'printing' },
  { id: '2', name: 'Creality Ender 3 Pro', model: 'Ender 3 Pro', codeName: 'ENDER01', location: 'Lab 2', technology: 'FDM', capacity: 'Standard', material: 'PLA', status: 'idle' },
  { id: '3', name: 'Ultimaker S5', model: 'S5', codeName: 'ULTI01', location: 'Design Studio', technology: 'SLA', capacity: 'Large', material: 'Resin', status: 'printing' },
  { id: '4', name: 'Anycubic Mega X', model: 'Mega X', codeName: 'ANYC01', location: 'Workshop', technology: 'FDM', capacity: 'Large', material: 'PETG', status: 'maintenance' },
  { id: '5', name: 'Bambu Lab A1 mini', model: 'A1 mini', codeName: 'BAMBU01', location: 'Lab 3', technology: 'FDM', capacity: 'Small', material: 'PLA', status: 'printing' },
  { id: '6', name: 'EOS Formiga P110', model: 'P 110', codeName: 'EOS01', location: 'Lab 2', technology: 'SLS', capacity: 'Medium', material: 'PA 2200', status: 'idle' },
];

export function generateSpools(): Spool[] {
  const spools: Spool[] = [];
  const configs = [
    { material: 'PLA', brand: 'Overture', color: '#222222', finish: 'Matte', name: 'PLA Black', count: 8 },
    { material: 'PLA', brand: 'Hatchbox', color: '#f0f0f0', finish: 'Glossy', name: 'PLA White', count: 6 },
    { material: 'ABS', brand: 'Sunlu', color: '#cc2222', finish: 'Satin', name: 'ABS Red', count: 4 },
    { material: 'PETG', brand: 'eSun', color: '#2244cc', finish: 'Transparent', name: 'PETG Blue', count: 4 },
    { material: 'TPU', brand: 'NinjaFlex', color: '#888888', finish: 'Flexible', name: 'TPU Grey', count: 3 },
  ];
  let id = 1;
  configs.forEach(c => {
    for (let i = 0; i < c.count; i++) {
      const used = (id % 10) * 100;
      spools.push({ id, spoolId: `SP${String(id).padStart(3, '0')}`, name: c.name, brand: c.brand, color: c.color, material: c.material, finish: c.finish, weight: 1000, used, price: 25, currency: 'USD', purchaseDate: '2024-05-01', status: calcMatStatus(used, 1000), assignedToPrinterId: null, location: `Rack-${i + 1}`, minStock: 2, minOrder: 5 });
      id++;
    }
  });
  return spools;
}

export function generateResins(): Resin[] {
  return [
    { id: 1, resinId: 'RS001', name: 'Standard Resin Grey', brand: 'Elegoo', color: '#808080', type: 'Standard', volume: 1000, used: 400, price: 35, currency: 'USD', purchaseDate: '2024-03-10', status: 'Active', assignedToPrinterId: null, location: 'Resin Cabinet 1', minStock: 1, minOrder: 2 },
    { id: 2, resinId: 'RS002', name: 'Tough Resin White', brand: 'Siraya Tech', color: '#FFFFFF', type: 'Tough', volume: 1000, used: 920, price: 55, currency: 'USD', purchaseDate: '2024-03-15', status: 'Critical', assignedToPrinterId: null, location: 'Resin Cabinet 2', minStock: 1, minOrder: 2 },
    { id: 3, resinId: 'RS003', name: 'Flexible Resin Clear', brand: 'Anycubic', color: '#e8f4f8', type: 'Flexible', volume: 500, used: 100, price: 45, currency: 'EUR', purchaseDate: '2024-04-01', status: 'Active', assignedToPrinterId: null, location: 'Resin Cabinet 1', minStock: 1, minOrder: 1 },
  ];
}

export function generatePowders(): Powder[] {
  return [
    { id: 1, powderId: 'PW001', name: 'PA12 White', brand: 'EOS', material: 'PA12', color: '#FFFFFF', weight: 20, used: 5, price: 1200, currency: 'EUR', purchaseDate: '2024-02-20', status: 'Active', assignedToPrinterId: null, location: 'Powder Station 1', minStock: 2, minOrder: 2 },
    { id: 2, powderId: 'PW002', name: 'PA11 Black', brand: 'HP', material: 'PA11', color: '#000000', weight: 15, used: 14.5, price: 1500, currency: 'USD', purchaseDate: '2024-01-30', status: 'Low', assignedToPrinterId: null, location: 'Powder Station 2', minStock: 1, minOrder: 1 },
    { id: 3, powderId: 'PW003', name: 'TPU Powder', brand: 'Formlabs', material: 'TPU', color: '#E0E0E0', weight: 5, used: 0, price: 450, currency: 'USD', purchaseDate: '2024-05-01', status: 'New', assignedToPrinterId: null, location: 'Powder Station 1', minStock: 1, minOrder: 1 },
  ];
}

export function generateInventory(): InventoryItem[] {
  const items = [
    { id: 'item-001', barcode: 'PACK-BOX-SML', name: 'Packing Boxes (Small)', description: '10x10x10cm cardboard boxes', category: 'Packing Material' as InventoryCategory, quantity: 450, minStock: 100, minOrder: 200, location: 'Shelf A-1' },
    { id: 'item-002', barcode: 'PACK-BOX-MED', name: 'Packing Boxes (Medium)', description: '20x20x20cm cardboard boxes', category: 'Packing Material' as InventoryCategory, quantity: 300, minStock: 80, minOrder: 150, location: 'Shelf A-2' },
    { id: 'item-003', barcode: 'PACK-BBL', name: 'Bubble Wrap (Roll)', description: '50m rolls', category: 'Packing Material' as InventoryCategory, quantity: 15, minStock: 5, minOrder: 10, location: 'Shelf B-1' },
    { id: 'item-004', barcode: 'ELEC-STEP-N17', name: 'Stepper Motors', description: 'NEMA 17, 12V', category: 'Electronics' as InventoryCategory, quantity: 15, minStock: 10, minOrder: 10, location: 'Drawer E-2' },
    { id: 'item-005', barcode: 'ELEC-HOTEND', name: 'Hotend Assembly', description: 'FDM hotend complete', category: 'Electronics' as InventoryCategory, quantity: 8, minStock: 5, minOrder: 5, location: 'Drawer E-4' },
    { id: 'item-006', barcode: 'TOOL-CALIPER', name: 'Calipers', description: 'Digital 0-150mm', category: 'Tools' as InventoryCategory, quantity: 8, minStock: 3, minOrder: 5, location: 'Tool Box 3' },
    { id: 'item-007', barcode: 'MISC-ZIP', name: 'Zip Ties (Pack)', description: 'Pack of 100 assorted', category: 'Miscellaneous' as InventoryCategory, quantity: 8, minStock: 3, minOrder: 5, location: 'Drawer M-1' },
    { id: 'item-008', barcode: 'PACK-LABEL', name: 'Shipping Labels (Roll)', description: '500 thermal labels', category: 'Packing Material' as InventoryCategory, quantity: 3, minStock: 2, minOrder: 2, location: 'Desk Area' },
  ];
  return items.map(i => ({ ...i, status: calcInvStatus(i.quantity, i.minStock) }));
}

export function generateUnassignedJobs(orders: Order[]): UnassignedJob[] {
  return orders.filter(o => o.status === 'pending').map(o => ({
    id: o.id,
    name: `Order: ${o.orderNumber}`,
    projectCode: o.projectCode,
    priority: o.priority,
    deadline: o.deadline,
    requiredTechnology: o.printerTech,
    estimatedTime: o.items * 180,
    items: o.items,
    orderNumber: o.orderNumber,
  }));
}
