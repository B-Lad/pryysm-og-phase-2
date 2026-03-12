'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calculator, Save, RefreshCw, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

type Currency = 'USD' | 'EUR' | 'AED' | 'INR';
const exchangeRates: Record<Currency, number> = { USD: 1, EUR: 0.93, AED: 3.67, INR: 83.33 };
const currencySymbols: Record<Currency, string> = { USD: '$', EUR: '€', AED: 'AED ', INR: '₹' };

interface SavedCalc {
  id: string;
  jobName: string;
  date: string;
  total: number;
  consumerPrice: number;
  resellerPrice: number;
  currency: Currency;
}

const DEFAULT_INPUTS = {
  jobName: '',
  printerTech: 'FDM',
  material: 'PLA',
  materialCost: 0.05,
  printTime: 1,
  powerCost: 0.03,
  laborRate: 15,
  overheadRate: 10,
  quantity: 1,
  consumerMargin: 40,
  resellerMargin: 25,
  currency: 'USD' as Currency,
};

export default function CostingPage() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [log, setLog] = useState<SavedCalc[]>([]);

  const ch = (k: keyof typeof inputs, v: any) => setInputs(prev => ({ ...prev, [k]: v }));
  const fmt = (v: number) => `${currencySymbols[inputs.currency]}${(v * exchangeRates[inputs.currency]).toFixed(2)}`;

  const results = useMemo(() => {
    const materialTotal = inputs.materialCost * inputs.quantity;
    const powerTotal = inputs.powerCost * inputs.printTime * inputs.quantity;
    const laborTotal = inputs.laborRate * (inputs.printTime / 60) * inputs.quantity;
    const overhead = (materialTotal + powerTotal + laborTotal) * (inputs.overheadRate / 100);
    const subtotal = materialTotal + powerTotal + laborTotal + overhead;
    const consumerPrice = subtotal * (1 + inputs.consumerMargin / 100);
    const resellerPrice = subtotal * (1 + inputs.resellerMargin / 100);
    return { materialTotal, powerTotal, laborTotal, overhead, subtotal, consumerPrice, resellerPrice };
  }, [inputs]);

  const saveCalc = () => {
    if (!inputs.jobName) return;
    setLog(prev => [{
      id: Date.now().toString(),
      jobName: inputs.jobName,
      date: new Date().toISOString(),
      total: results.subtotal,
      consumerPrice: results.consumerPrice,
      resellerPrice: results.resellerPrice,
      currency: inputs.currency,
    }, ...prev]);
  };

  const rows = [
    { label: 'Material Cost', value: results.materialTotal, detail: `${inputs.materialCost}/unit × ${inputs.quantity} units` },
    { label: 'Power Cost', value: results.powerTotal, detail: `${inputs.powerCost}/hr × ${inputs.printTime} hrs × ${inputs.quantity}` },
    { label: 'Labor Cost', value: results.laborTotal, detail: `${inputs.laborRate}/hr × ${(inputs.printTime / 60).toFixed(2)} hrs × ${inputs.quantity}` },
    { label: `Overhead (${inputs.overheadRate}%)`, value: results.overhead, detail: 'Applied to all costs' },
  ];

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      <header className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg"><Calculator className="text-primary h-6 w-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">Job Costing</h1>
          <p className="text-sm text-muted-foreground">Calculate accurate pricing for 3D print jobs</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Job Parameters</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Job Name</Label>
                <Input value={inputs.jobName} onChange={e => ch('jobName', e.target.value)} placeholder="e.g. Prototype Part A" />
              </div>
              <div className="space-y-2">
                <Label>Technology</Label>
                <Select value={inputs.printerTech} onValueChange={v => ch('printerTech', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['FDM', 'SLA', 'SLS', 'MJF', 'DLP', 'EBM', 'DMLS'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Material</Label>
                <Select value={inputs.material} onValueChange={v => ch('material', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['PLA', 'ABS', 'PETG', 'TPU', 'Resin', 'PA12', 'PA11', 'TPU Powder'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Material Cost (USD/unit)</Label>
                <Input type="number" step="0.01" value={inputs.materialCost} onChange={e => ch('materialCost', +e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Print Time (minutes)</Label>
                <Input type="number" value={inputs.printTime} onChange={e => ch('printTime', +e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Power Cost (USD/hr)</Label>
                <Input type="number" step="0.01" value={inputs.powerCost} onChange={e => ch('powerCost', +e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Labor Rate (USD/hr)</Label>
                <Input type="number" step="0.01" value={inputs.laborRate} onChange={e => ch('laborRate', +e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Overhead (%)</Label>
                <Input type="number" value={inputs.overheadRate} onChange={e => ch('overheadRate', +e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" value={inputs.quantity} onChange={e => ch('quantity', +e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pricing Margins</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={inputs.currency} onValueChange={v => ch('currency', v as Currency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(['USD', 'EUR', 'AED', 'INR'] as Currency[]).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Consumer Margin (%)</Label>
                <Input type="number" value={inputs.consumerMargin} onChange={e => ch('consumerMargin', +e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Reseller Margin (%)</Label>
                <Input type="number" value={inputs.resellerMargin} onChange={e => ch('resellerMargin', +e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Cost Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {rows.map(row => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{row.label}</span><span className="font-medium">{fmt(row.value)}</span></div>
                  <p className="text-xs text-muted-foreground">{row.detail}</p>
                </div>
              ))}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between font-bold"><span>Total Cost</span><span>{fmt(results.subtotal)}</span></div>
                <div className="flex justify-between text-blue-600 font-semibold"><span>Consumer Price</span><span>{fmt(results.consumerPrice)}</span></div>
                <div className="flex justify-between text-green-600 font-semibold"><span>Reseller Price</span><span>{fmt(results.resellerPrice)}</span></div>
              </div>
            </CardContent>
          </Card>
          <Button className="w-full" onClick={saveCalc} disabled={!inputs.jobName}>
            <Save className="mr-2 h-4 w-4" />Save to Log
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setInputs(DEFAULT_INPUTS)}>
            <RefreshCw className="mr-2 h-4 w-4" />Reset
          </Button>
        </div>
      </div>

      {/* Log */}
      <Card>
        <CardHeader><CardTitle>Calculation Log</CardTitle><CardDescription>Previously saved cost calculations</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Job Name</TableHead><TableHead>Date</TableHead><TableHead>Total Cost</TableHead><TableHead>Consumer Price</TableHead><TableHead>Reseller Price</TableHead></TableRow></TableHeader>
            <TableBody>
              {log.length > 0 ? log.map(l => (
                <TableRow key={l.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{l.jobName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(l.date), 'dd MMM yyyy, HH:mm')}</TableCell>
                  <TableCell>{currencySymbols[l.currency]}{(l.total * exchangeRates[l.currency]).toFixed(2)}</TableCell>
                  <TableCell className="text-blue-600 font-medium">{currencySymbols[l.currency]}{(l.consumerPrice * exchangeRates[l.currency]).toFixed(2)}</TableCell>
                  <TableCell className="text-green-600 font-medium">{currencySymbols[l.currency]}{(l.resellerPrice * exchangeRates[l.currency]).toFixed(2)}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No calculations saved yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
