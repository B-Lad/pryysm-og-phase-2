'use client';

import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import { useAuth } from '@/hooks/use-auth';
import { isThisMonth, isThisYear, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  ShoppingCart, DollarSign, Printer, AlertTriangle, TrendingUp,
  TrendingDown, Package, Layers3, Droplet, Sparkles, Clock, CheckCircle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { cn } from '@/lib/utils';

type Currency = 'USD' | 'EUR' | 'AED' | 'INR';
type Timeframe = 'month' | 'year';
const exchangeRates: Record<Currency, number> = { USD: 1, EUR: 0.93, AED: 3.67, INR: 83.33 };
const currencySymbols: Record<Currency, string> = { USD: '$', EUR: '€', AED: 'AED ', INR: '₹' };
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const statusBadge: Record<string, string> = {
  completed: 'bg-green-100 text-green-800', dispatched: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-cyan-100 text-cyan-800', overdue: 'bg-red-200 text-red-900',
  packing: 'bg-orange-100 text-orange-800', pending: 'bg-gray-100 text-gray-800', qc: 'bg-purple-100 text-purple-800',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { orders, printers, inventory, documents, spools, resins, powders, isLoading } = useWorkspace();
  const [currency, setCurrency] = useState<Currency>('USD');
  const [timeframe, setTimeframe] = useState<Timeframe>('month');

  const fmt = (amount: number) => `${currencySymbols[currency]}${(amount * exchangeRates[currency]).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const filteredOrders = useMemo(() =>
    orders.filter(o => timeframe === 'month' ? isThisMonth(new Date(o.orderDate)) : isThisYear(new Date(o.orderDate)))
  , [orders, timeframe]);

  const revenue = useMemo(() =>
    documents.filter(d => d.type === 'Tax Invoice' && (timeframe === 'month' ? isThisMonth(new Date(d.date)) : isThisYear(new Date(d.date)))).reduce((s, d) => s + d.amount, 0)
  , [documents, timeframe]);

  const prevRevenue = useMemo(() => {
    const now = new Date();
    return documents.filter(d => {
      const dd = new Date(d.date);
      if (timeframe === 'month') return dd.getMonth() === now.getMonth() - 1 && dd.getFullYear() === now.getFullYear();
      return dd.getFullYear() === now.getFullYear() - 1;
    }).reduce((s, d) => s + d.amount, 0);
  }, [documents, timeframe]);

  const revChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

  const activePrinters = printers.filter(p => p.status === 'printing').length;
  const totalPrinters = printers.length;

  const criticalMaterials = useMemo(() => [
    ...spools.filter(s => s.status === 'Critical' || s.status === 'Low').map(s => ({ name: s.name, type: 'Filament', status: s.status, remaining: `${s.weight - s.used}g / ${s.weight}g` })),
    ...resins.filter(r => r.status === 'Critical' || r.status === 'Low').map(r => ({ name: r.name, type: 'Resin', status: r.status, remaining: `${r.volume - r.used}ml / ${r.volume}ml` })),
    ...powders.filter(p => p.status === 'Critical' || p.status === 'Low').map(p => ({ name: p.name, type: 'Powder', status: p.status, remaining: `${(p.weight - p.used).toFixed(1)}kg / ${p.weight}kg` })),
  ], [spools, resins, powders]);

  const lowStockInventory = inventory.filter(i => i.status !== 'In Stock').slice(0, 5);

  // Chart data
  const ordersByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredOrders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace('-', ' '), value }));
  }, [filteredOrders]);

  const revenueByTech = useMemo(() => {
    const techMap: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const doc = documents.find(d => d.orderNumber === o.orderNumber);
      const amount = doc ? doc.amount : o.items * 35;
      techMap[o.printerTech] = (techMap[o.printerTech] || 0) + amount;
    });
    return Object.entries(techMap).map(([name, value]) => ({ name, value: +(value * exchangeRates[currency]).toFixed(0) }));
  }, [filteredOrders, documents, currency]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {user?.name || 'Admin'} — {format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-card border rounded-full p-1 shadow-sm">
            <Button variant={timeframe === 'month' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeframe('month')} className="rounded-full px-4">This Month</Button>
            <Button variant={timeframe === 'year' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeframe('year')} className="rounded-full px-4">This Year</Button>
          </div>
          <div className="flex items-center bg-card border rounded-full p-1 shadow-sm">
            {(['USD', 'EUR', 'AED', 'INR'] as Currency[]).map(c => (
              <Button key={c} variant={currency === c ? 'default' : 'ghost'} size="sm" onClick={() => setCurrency(c)} className="rounded-full px-3 text-xs">{c}</Button>
            ))}
          </div>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
            <p className="text-xs text-muted-foreground">{timeframe === 'month' ? 'This month' : 'This year'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(revenue)}</div>
            <div className={`flex items-center gap-1 text-xs mt-1 ${revChange >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {revChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(revChange).toFixed(1)}% vs previous {timeframe}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Printers</CardTitle>
            <Printer className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePrinters} / {totalPrinters}</div>
            <Progress value={totalPrinters > 0 ? (activePrinters / totalPrinters) * 100 : 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${criticalMaterials.length + lowStockInventory.length > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {criticalMaterials.length + lowStockInventory.length}
            </div>
            <p className="text-xs text-muted-foreground">materials & inventory</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>{timeframe === 'month' ? 'This month' : 'This year'}</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ordersByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-16">No data for this period</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Technology</CardTitle>
            <CardDescription>{currencySymbols[currency]} breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByTech.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={revenueByTech} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {revenueByTech.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${currencySymbols[currency]}${v}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-16">No revenue data</p>}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader><CardTitle>Recent Orders</CardTitle><CardDescription>Latest 5 orders</CardDescription></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {recentOrders.map(o => {
                  const doc = documents.find(d => d.orderNumber === o.orderNumber);
                  const amount = doc ? doc.amount * exchangeRates[currency] : o.items * 35 * exchangeRates[currency];
                  return (
                    <TableRow key={o.id}>
                      <TableCell><div className="font-medium">{o.orderNumber}</div><div className="text-xs text-muted-foreground">{o.printerTech}</div></TableCell>
                      <TableCell className="text-sm">{o.customer}</TableCell>
                      <TableCell><Badge variant="secondary" className={cn('text-xs capitalize', statusBadge[o.status])}>{o.status.replace('-', ' ')}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{currencySymbols[currency]}{amount.toFixed(0)}</TableCell>
                    </TableRow>
                  );
                })}
                {recentOrders.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No orders yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Material & Inventory Alerts */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" />Raw Material Status</CardTitle></CardHeader>
            <CardContent>
              {criticalMaterials.length > 0 ? (
                <div className="space-y-2">
                  {criticalMaterials.slice(0, 4).map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {m.type === 'Filament' ? <Layers3 className="h-4 w-4 text-blue-500" /> : m.type === 'Resin' ? <Droplet className="h-4 w-4 text-purple-500" /> : <Sparkles className="h-4 w-4 text-green-500" />}
                        <div><p className="text-sm font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.remaining}</p></div>
                      </div>
                      <Badge className={m.status === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{m.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 py-4">
                  <CheckCircle className="h-5 w-5" /><p className="text-sm font-medium">All materials in good condition!</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-orange-500" />Inventory Status</CardTitle></CardHeader>
            <CardContent>
              {lowStockInventory.length > 0 ? (
                <div className="space-y-2">
                  {lowStockInventory.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.quantity} units remaining</p></div>
                      <Badge className={item.status === 'Out of Stock' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{item.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 py-4">
                  <CheckCircle className="h-5 w-5" /><p className="text-sm font-medium">All inventory stocked!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
