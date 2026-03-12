'use client';

import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Plus, Printer, Receipt, ShoppingBag, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

type DocType = 'Quotation' | 'Purchase Order' | 'Tax Invoice';

const exchangeRates: Record<string, number> = { USD: 1, EUR: 0.93, AED: 3.67, INR: 83.33 };
const currencySymbols: Record<string, string> = { USD: '$', EUR: '€', AED: 'AED ', INR: '₹' };

interface LineItem { description: string; qty: number; rate: number; }

function generateDocNumber(type: DocType) {
  const prefix = type === 'Quotation' ? 'QT' : type === 'Purchase Order' ? 'PO' : 'INV';
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}

export default function FinancePage() {
  const { orders, customers, documents } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'quotation' | 'po' | 'invoice' | 'log'>('quotation');
  const [currency, setCurrency] = useState('USD');
  const [form, setForm] = useState({
    customerId: '',
    orderId: '',
    docNumber: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
    notes: '',
    taxRate: 5,
    discount: 0,
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', qty: 1, rate: 0 }]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<DocType>('Quotation');

  const selectedCustomer = customers.find(c => c.id === form.customerId);
  const selectedOrder = orders.find(o => String(o.id) === form.orderId);

  const subtotal = lineItems.reduce((s, i) => s + i.qty * i.rate, 0);
  const discountAmt = subtotal * (form.discount / 100);
  const taxAmt = (subtotal - discountAmt) * (form.taxRate / 100);
  const total = subtotal - discountAmt + taxAmt;
  const fmt = (v: number) => `${currencySymbols[currency]}${(v * exchangeRates[currency]).toFixed(2)}`;

  const addLine = () => setLineItems(prev => [...prev, { description: '', qty: 1, rate: 0 }]);
  const updateLine = (i: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };
  const removeLine = (i: number) => setLineItems(prev => prev.filter((_, idx) => idx !== i));

  const openPreview = (type: DocType) => {
    setPreviewType(type);
    if (!form.docNumber) setForm(prev => ({ ...prev, docNumber: generateDocNumber(type) }));
    setPreviewOpen(true);
  };

  // Pre-fill from order
  const loadOrder = (orderId: string) => {
    const order = orders.find(o => String(o.id) === orderId);
    if (!order) return;
    const customer = customers.find(c => c.name === order.customer);
    setForm(prev => ({ ...prev, orderId, customerId: customer?.id || '' }));
    setLineItems([{ description: `3D Print Job: ${order.orderNumber} — ${order.printerTech} (${order.items} items)`, qty: order.items, rate: 35 }]);
  };

  const typeToTab: Record<DocType, string> = { 'Quotation': 'quotation', 'Purchase Order': 'po', 'Tax Invoice': 'invoice' };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-lg"><DollarSign className="text-primary h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Finance</h1>
            <p className="text-sm text-muted-foreground">Generate quotations, purchase orders & invoices</p>
          </div>
        </div>
        <div className="flex items-center bg-card border rounded-full p-1 shadow-sm">
          {(['USD', 'EUR', 'AED', 'INR']).map(c => (
            <Button key={c} variant={currency === c ? 'default' : 'ghost'} size="sm" onClick={() => setCurrency(c)} className="rounded-full px-4">{c}</Button>
          ))}
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="quotation"><FileText className="mr-2 h-4 w-4" />Quotation</TabsTrigger>
          <TabsTrigger value="po"><ShoppingBag className="mr-2 h-4 w-4" />Purchase Order</TabsTrigger>
          <TabsTrigger value="invoice"><Receipt className="mr-2 h-4 w-4" />Tax Invoice</TabsTrigger>
          <TabsTrigger value="log">Document Log</TabsTrigger>
        </TabsList>

        {(['quotation', 'po', 'invoice'] as const).map(tab => {
          const docType: DocType = tab === 'quotation' ? 'Quotation' : tab === 'po' ? 'Purchase Order' : 'Tax Invoice';
          return (
            <TabsContent key={tab} value={tab} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader><CardTitle>Document Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Document Number</Label>
                        <Input value={form.docNumber} onChange={e => setForm(p => ({ ...p, docNumber: e.target.value }))} placeholder={`Auto-generated`} />
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Customer</Label>
                        <Select value={form.customerId} onValueChange={v => setForm(p => ({ ...p, customerId: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                          <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Link to Order</Label>
                        <Select value={form.orderId} onValueChange={loadOrder}>
                          <SelectTrigger><SelectValue placeholder="Select order (optional)" /></SelectTrigger>
                          <SelectContent>{orders.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.orderNumber} — {o.customer}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tax Rate (%)</Label>
                        <Input type="number" value={form.taxRate} onChange={e => setForm(p => ({ ...p, taxRate: +e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount (%)</Label>
                        <Input type="number" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: +e.target.value }))} />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Notes</Label>
                        <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Payment terms, delivery notes..." />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Line Items</CardTitle>
                        <Button variant="outline" size="sm" onClick={addLine}><Plus className="mr-2 h-4 w-4" />Add Line</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50%]">Description</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lineItems.map((line, i) => (
                            <TableRow key={i}>
                              <TableCell><Input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Item description" /></TableCell>
                              <TableCell><Input type="number" value={line.qty} onChange={e => updateLine(i, 'qty', +e.target.value)} className="w-20" /></TableCell>
                              <TableCell><Input type="number" step="0.01" value={line.rate} onChange={e => updateLine(i, 'rate', +e.target.value)} className="w-28" /></TableCell>
                              <TableCell className="font-medium">{fmt(line.qty * line.rate)}</TableCell>
                              <TableCell><Button variant="ghost" size="sm" onClick={() => removeLine(i)} className="text-destructive">✕</Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {selectedCustomer && (
                        <div className="p-3 bg-muted rounded-lg text-sm">
                          <p className="font-medium">{selectedCustomer.name}</p>
                          <p className="text-muted-foreground">{selectedCustomer.email}</p>
                          {selectedCustomer.address && <p className="text-muted-foreground text-xs mt-1">{selectedCustomer.address}</p>}
                        </div>
                      )}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal)}</span></div>
                        {form.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({form.discount}%)</span><span>-{fmt(discountAmt)}</span></div>}
                        <div className="flex justify-between"><span className="text-muted-foreground">Tax ({form.taxRate}%)</span><span>{fmt(taxAmt)}</span></div>
                        <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{fmt(total)}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Button className="w-full" onClick={() => openPreview(docType)}>
                    <Printer className="mr-2 h-4 w-4" />Preview & Print
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => openPreview(docType)}>
                    <Download className="mr-2 h-4 w-4" />Download PDF
                  </Button>
                </div>
              </div>
            </TabsContent>
          );
        })}

        <TabsContent value="log">
          <Card>
            <CardHeader>
              <CardTitle>Document Log</CardTitle>
              <CardDescription>All generated financial documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doc #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length > 0 ? documents.slice(0, 50).map(doc => {
                    const cust = customers.find(c => c.id === doc.customerId);
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-mono text-sm">{doc.id}</TableCell>
                        <TableCell><Badge variant="outline">{doc.type}</Badge></TableCell>
                        <TableCell>{cust?.name || '—'}</TableCell>
                        <TableCell>{doc.orderNumber}</TableCell>
                        <TableCell>{format(new Date(doc.date), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-right font-medium">{currencySymbols[currency]}{(doc.amount * exchangeRates[currency]).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No documents yet. Generate a quotation, PO, or invoice above.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewType} Preview</DialogTitle>
          </DialogHeader>
          <div className="bg-white border rounded-lg p-8 font-sans text-sm" id="doc-preview">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-2xl font-bold text-blue-700">PrintFlow</h1>
                <p className="text-xs text-gray-500">by 3D Prodigy</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold uppercase text-gray-700">{previewType}</h2>
                <p className="text-gray-500"># {form.docNumber || generateDocNumber(previewType)}</p>
                <p className="text-gray-500">{format(new Date(form.date), 'dd MMMM yyyy')}</p>
              </div>
            </div>
            {/* Bill To */}
            {selectedCustomer && (
              <div className="mb-6">
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Bill To</p>
                <p className="font-semibold">{selectedCustomer.name}</p>
                <p className="text-gray-600">{selectedCustomer.email}</p>
                {selectedCustomer.address && <p className="text-gray-600 text-xs">{selectedCustomer.address}</p>}
                {selectedCustomer.taxId && <p className="text-gray-500 text-xs">Tax ID: {selectedCustomer.taxId}</p>}
              </div>
            )}
            {/* Line Items */}
            <table className="w-full mb-6 text-sm">
              <thead><tr className="bg-gray-100"><th className="text-left p-2">Description</th><th className="p-2 text-center">Qty</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">Amount</th></tr></thead>
              <tbody>
                {lineItems.map((l, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{l.description}</td>
                    <td className="p-2 text-center">{l.qty}</td>
                    <td className="p-2 text-right">{fmt(l.rate)}</td>
                    <td className="p-2 text-right">{fmt(l.qty * l.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Totals */}
            <div className="flex justify-end mb-6">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{fmt(subtotal)}</span></div>
                {form.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({form.discount}%)</span><span>-{fmt(discountAmt)}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Tax ({form.taxRate}%)</span><span>{fmt(taxAmt)}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-1 mt-1"><span>Total</span><span>{fmt(total)}</span></div>
              </div>
            </div>
            {form.notes && <p className="text-gray-500 text-xs border-t pt-4">Notes: {form.notes}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
