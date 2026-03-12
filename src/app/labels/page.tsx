'use client';

import React, { useState, useRef } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tags, Printer, Layers3, Droplet, Sparkles, Package, QrCode, Download } from 'lucide-react';

function QRPlaceholder({ value, size = 60 }: { value: string; size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="bg-black flex items-center justify-center rounded">
      <QrCode className="text-white" style={{ width: size * 0.7, height: size * 0.7 }} />
    </div>
  );
}

function OrderLabel({ order, customer }: { order: any; customer: any }) {
  return (
    <div className="border-2 border-gray-800 rounded-lg p-4 bg-white w-72 font-sans text-xs print:break-inside-avoid">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-bold text-base text-blue-700">PrintFlow</p>
          <p className="text-gray-500 text-[10px]">by 3D Prodigy</p>
        </div>
        <QRPlaceholder value={order.orderNumber} size={50} />
      </div>
      <div className="border-t pt-2 space-y-1">
        <p className="font-bold text-sm">{order.orderNumber}</p>
        <p className="text-gray-600">{order.customer}</p>
        <p className="text-gray-500">Project: {order.projectCode}</p>
        <div className="flex gap-2 mt-1">
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-medium">{order.printerTech}</span>
          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px]">{order.items} items</span>
        </div>
        <p className="text-gray-500">Deadline: {order.deadline}</p>
      </div>
    </div>
  );
}

function PrinterLabel({ printer }: { printer: any }) {
  const statusColors: Record<string, string> = {
    printing: 'bg-green-100 text-green-800',
    idle: 'bg-gray-100 text-gray-700',
    maintenance: 'bg-yellow-100 text-yellow-800',
    offline: 'bg-red-100 text-red-800',
  };
  return (
    <div className="border-2 border-gray-800 rounded-lg p-4 bg-white w-72 font-sans text-xs print:break-inside-avoid">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-bold text-base text-blue-700">PrintFlow</p>
          <p className="text-gray-500 text-[10px]">Printer Tag</p>
        </div>
        <QRPlaceholder value={printer.id} size={50} />
      </div>
      <div className="border-t pt-2 space-y-1">
        <p className="font-bold text-sm">{printer.name}</p>
        <p className="text-gray-600">Code: {printer.codeName}</p>
        <p className="text-gray-500">Location: {printer.location}</p>
        <p className="text-gray-500">Tech: {printer.technology} · {printer.material}</p>
        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${statusColors[printer.status] || 'bg-gray-100'}`}>{printer.status.toUpperCase()}</span>
      </div>
    </div>
  );
}

function MaterialLabel({ mat, type }: { mat: any; type: string }) {
  const remaining = type === 'Spool' ? `${mat.weight - mat.used}g / ${mat.weight}g` :
    type === 'Resin' ? `${mat.volume - mat.used}ml / ${mat.volume}ml` :
      `${(mat.weight - mat.used).toFixed(1)}kg / ${mat.weight}kg`;
  const id = mat.spoolId || mat.resinId || mat.powderId;
  return (
    <div className="border-2 border-gray-800 rounded-lg p-4 bg-white w-72 font-sans text-xs print:break-inside-avoid">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-bold text-base text-blue-700">PrintFlow</p>
          <p className="text-gray-500 text-[10px]">{type} Label</p>
        </div>
        <QRPlaceholder value={id} size={50} />
      </div>
      <div className="border-t pt-2 space-y-1">
        <div className="flex items-center gap-2">
          {type === 'Spool' && <div className="w-5 h-5 rounded-full border-2" style={{ backgroundColor: mat.color }} />}
          <p className="font-bold text-sm">{mat.name}</p>
        </div>
        <p className="text-gray-600">ID: {id}</p>
        <p className="text-gray-600">Brand: {mat.brand}</p>
        <p className="text-gray-500">Remaining: {remaining}</p>
        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${mat.status === 'Critical' ? 'bg-red-100 text-red-800' : mat.status === 'Low' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{mat.status}</span>
      </div>
    </div>
  );
}

function InventoryLabel({ item }: { item: any }) {
  return (
    <div className="border-2 border-gray-800 rounded-lg p-4 bg-white w-72 font-sans text-xs print:break-inside-avoid">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-bold text-base text-blue-700">PrintFlow</p>
          <p className="text-gray-500 text-[10px]">Inventory Label</p>
        </div>
        <QRPlaceholder value={item.barcode} size={50} />
      </div>
      <div className="border-t pt-2 space-y-1">
        <p className="font-bold text-sm">{item.name}</p>
        <p className="font-mono text-[10px] text-gray-500">{item.barcode}</p>
        <p className="text-gray-600">Category: {item.category}</p>
        <p className="text-gray-500">Location: {item.location || '—'}</p>
        <p className="text-gray-500">Qty: {item.quantity} (Min: {item.minStock})</p>
      </div>
    </div>
  );
}

export default function LabelsPage() {
  const { orders, customers, printers, spools, resins, powders, inventory } = useWorkspace();
  const [selectedOrder, setSelectedOrder] = useState('');
  const [selectedPrinters, setSelectedPrinters] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const togglePrinter = (id: string) => setSelectedPrinters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleMaterial = (id: string) => setSelectedMaterials(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleInventory = (id: string) => setSelectedInventory(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handlePrint = () => window.print();

  const allMaterials = [
    ...spools.map(s => ({ ...s, _id: `spool-${s.id}`, _type: 'Spool' })),
    ...resins.map(r => ({ ...r, _id: `resin-${r.id}`, _type: 'Resin' })),
    ...powders.map(p => ({ ...p, _id: `powder-${p.id}`, _type: 'Powder' })),
  ];

  const orderObj = orders.find(o => String(o.id) === selectedOrder);
  const customerObj = orderObj ? customers.find(c => c.name === orderObj.customer) : null;

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      <header className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg"><Tags className="text-primary h-6 w-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">Labels</h1>
          <p className="text-sm text-muted-foreground">Generate QR code labels for orders, printers, materials & inventory</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Select Items</CardTitle><CardDescription>Choose what to print labels for</CardDescription></CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={['orders']}>
              <AccordionItem value="orders">
                <AccordionTrigger className="text-sm font-medium"><span className="flex items-center gap-2"><Package className="h-4 w-4" />Order Label</span></AccordionTrigger>
                <AccordionContent>
                  <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                    <SelectTrigger><SelectValue placeholder="Select order" /></SelectTrigger>
                    <SelectContent>{orders.slice(0, 30).map(o => <SelectItem key={o.id} value={String(o.id)}>{o.orderNumber} — {o.customer}</SelectItem>)}</SelectContent>
                  </Select>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="printers">
                <AccordionTrigger className="text-sm font-medium"><span className="flex items-center gap-2"><Printer className="h-4 w-4" />Printer Labels ({selectedPrinters.length})</span></AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {printers.map(p => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                      <input type="checkbox" checked={selectedPrinters.includes(p.id)} onChange={() => togglePrinter(p.id)} className="rounded" />
                      <span className="text-sm">{p.name}</span>
                    </label>
                  ))}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="materials">
                <AccordionTrigger className="text-sm font-medium"><span className="flex items-center gap-2"><Layers3 className="h-4 w-4" />Material Labels ({selectedMaterials.length})</span></AccordionTrigger>
                <AccordionContent className="space-y-2 max-h-48 overflow-y-auto">
                  {allMaterials.map(m => (
                    <label key={m._id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                      <input type="checkbox" checked={selectedMaterials.includes(m._id)} onChange={() => toggleMaterial(m._id)} className="rounded" />
                      <span className="text-xs">{m.name} <span className="text-muted-foreground">({m._type})</span></span>
                    </label>
                  ))}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="inventory">
                <AccordionTrigger className="text-sm font-medium"><span className="flex items-center gap-2"><Package className="h-4 w-4" />Inventory Labels ({selectedInventory.length})</span></AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {inventory.map(i => (
                    <label key={i.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                      <input type="checkbox" checked={selectedInventory.includes(i.id)} onChange={() => toggleInventory(i.id)} className="rounded" />
                      <span className="text-xs">{i.name}</span>
                    </label>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Label Preview</h2>
            <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Print All Labels</Button>
          </div>
          <div ref={printRef} className="flex flex-wrap gap-4 p-4 bg-gray-50 min-h-48 rounded-lg border-dashed border-2">
            {orderObj && <OrderLabel order={orderObj} customer={customerObj} />}
            {selectedPrinters.map(id => {
              const p = printers.find(x => x.id === id);
              return p ? <PrinterLabel key={id} printer={p} /> : null;
            })}
            {selectedMaterials.map(id => {
              const m = allMaterials.find(x => x._id === id);
              return m ? <MaterialLabel key={id} mat={m} type={m._type} /> : null;
            })}
            {selectedInventory.map(id => {
              const item = inventory.find(x => x.id === id);
              return item ? <InventoryLabel key={id} item={item} /> : null;
            })}
            {!orderObj && selectedPrinters.length === 0 && selectedMaterials.length === 0 && selectedInventory.length === 0 && (
              <div className="flex items-center justify-center w-full py-16 text-muted-foreground">
                <div className="text-center"><Tags className="h-12 w-12 mx-auto mb-2 opacity-30" /><p>Select items from the left panel to preview labels</p></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
