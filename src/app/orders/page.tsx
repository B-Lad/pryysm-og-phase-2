'use client';

import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import type { Order } from '@/hooks/use-workspace';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Box, Clock, AlertTriangle, CheckCircle, Search, Eye, Trash2, Plus, List, PlusCircle, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusBadge: Record<Order['status'], string> = {
  completed: 'bg-green-100 text-green-800', dispatched: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-cyan-100 text-cyan-800', overdue: 'bg-red-200 text-red-900 font-semibold border border-red-300',
  packing: 'bg-orange-100 text-orange-800', pending: 'bg-gray-100 text-gray-800', qc: 'bg-purple-100 text-purple-800',
};
const priorityBadge: Record<Order['priority'], string> = {
  high: 'bg-red-500/20 text-red-700 border border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30',
  low: 'bg-green-500/20 text-green-700 border border-green-500/30',
};
const STATUSES: Order['status'][] = ['pending','in-progress','qc','packing','dispatched','completed','overdue'];
const TECHS = ['FDM','SLA','SLS','MJF','DLP','EBM','DMLS'];
const SALES = ['John Smith','Sarah Johnson','Mike Davis','Lisa Chen','David Wilson'];

function getDaysRemaining(dl: string) {
  const t = new Date(); t.setHours(0,0,0,0);
  const d = new Date(dl); d.setHours(0,0,0,0);
  const diff = Math.ceil((d.getTime()-t.getTime())/86400000);
  if (diff<0) return 'Overdue'; if (diff===0) return 'Due Today'; if (diff===1) return '1 day left'; return `${diff} days left`;
}

export default function OrdersPage() {
  const router = useRouter();
  const { orders, customers, documents, addOrder, updateOrderStatus } = useWorkspace();
  const [tab, setTab] = useState<'list'|'new'>('list');
  const [search, setSearch] = useState(''); const [statusF, setStatusF] = useState('all'); const [priorityF, setPriorityF] = useState('all');
  const [viewOrder, setViewOrder] = useState<Order|null>(null);
  const [deleteId, setDeleteId] = useState<number|null>(null);
  const today = format(new Date(),'yyyy-MM-dd');
  const [form, setForm] = useState({ customer:'', orderNumber:'', projectCode:'', items:'1', printerTech:'FDM', orderDate:today, deadline:today, priority:'medium', salesPerson:'', notes:'', imageUrl:'' });
  const sf = (k: string, v: string) => setForm(f=>({...f,[k]:v}));

  const stats = useMemo(()=>({ total:orders.length, pending:orders.filter(o=>o.status==='pending').length, overdue:orders.filter(o=>o.status==='overdue').length, completed:orders.filter(o=>o.status==='completed'||o.status==='dispatched').length }), [orders]);
  const filtered = useMemo(()=>orders.filter(o=>{ const ms=search.toLowerCase(); return (o.customer.toLowerCase().includes(ms)||o.orderNumber.toLowerCase().includes(ms))&&(statusF==='all'||o.status===statusF)&&(priorityF==='all'||o.priority===priorityF); }), [orders,search,statusF,priorityF]);
  const getAmount = (o: Order) => { const doc=(documents as any[])?.find((d:any)=>d.orderNumber===o.orderNumber); return doc?`$${doc.amount.toFixed(2)}`:`$${(o.items*35).toFixed(2)}`; };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if(!form.customer) return; addOrder({ customer:form.customer, orderNumber:form.orderNumber||`PO-${Date.now()}`, projectCode:form.projectCode||`PROJ-${Date.now()}`, items:parseInt(form.items)||1, printerTech:form.printerTech, orderDate:form.orderDate, deadline:form.deadline, priority:form.priority as Order['priority'], salesPerson:form.salesPerson, notes:form.notes, imageUrl:form.imageUrl }); setTab('list'); setForm({customer:'',orderNumber:'',projectCode:'',items:'1',printerTech:'FDM',orderDate:today,deadline:today,priority:'medium',salesPerson:'',notes:'',imageUrl:''}); };
  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(f){const r=new FileReader();r.onload=(ev)=>{if(ev.target?.result)sf('imageUrl',ev.target.result as string)};r.readAsDataURL(f)} };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-lg"><Box className="text-primary h-6 w-6"/></div>
          <div><h1 className="text-2xl font-bold">Order Management</h1><p className="text-sm text-muted-foreground">Track and manage customer orders</p></div>
        </div>
        <Button onClick={()=>setTab('new')}><Plus className="mr-2 h-4 w-4"/>New Order</Button>
      </header>

      <div className="flex gap-2">
        <Button variant={tab==='list'?'default':'outline'} size="sm" onClick={()=>setTab('list')}><List className="mr-2 h-4 w-4"/>Orders List</Button>
        <Button variant={tab==='new'?'default':'outline'} size="sm" onClick={()=>setTab('new')}><PlusCircle className="mr-2 h-4 w-4"/>New Order</Button>
      </div>

      {tab==='list' && (<>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[{label:'Total Orders',val:stats.total,Icon:Box},{label:'Pending',val:stats.pending,Icon:Clock},{label:'Overdue',val:stats.overdue,Icon:AlertTriangle,red:true},{label:'Completed',val:stats.completed,Icon:CheckCircle}].map(s=>(
            <Card key={s.label}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{s.label}</CardTitle><s.Icon className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className={`text-2xl font-bold ${s.red?'text-destructive':''}`}>{s.val}</div></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 h-5 w-5 text-gray-400 -translate-y-1/2"/><Input placeholder="Search by customer or order number..." className="pl-10" value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <div className="flex gap-4">
            <Select value={statusF} onValueChange={setStatusF}><SelectTrigger className="w-[180px]"><SelectValue placeholder="All Status"/></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{STATUSES.map(s=><SelectItem key={s} value={s}>{s.replace('-',' ')}</SelectItem>)}</SelectContent></Select>
            <Select value={priorityF} onValueChange={setPriorityF}><SelectTrigger className="w-[180px]"><SelectValue placeholder="All Priorities"/></SelectTrigger><SelectContent><SelectItem value="all">All Priorities</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select>
          </div>
        </div></CardContent></Card>
        <Card>
          <CardHeader><CardTitle>Orders List</CardTitle><p className="text-sm text-muted-foreground">Showing {filtered.length} of {orders.length} orders</p></CardHeader>
          <CardContent><div className="overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Deadline</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length>0 ? filtered.map((o:Order)=>(
                <TableRow key={o.id}>
                  <TableCell><div className="font-medium">{o.orderNumber}</div><div className="text-sm text-muted-foreground">{o.projectCode}</div></TableCell>
                  <TableCell>{o.customer}</TableCell>
                  <TableCell><div className="font-medium">{format(new Date(o.deadline),'dd-MM-yyyy')}</div><div className="text-xs text-muted-foreground">{getDaysRemaining(o.deadline)}</div></TableCell>
                  <TableCell><Badge variant="secondary" className={cn('capitalize',statusBadge[o.status])}>{o.status.replace('-',' ')}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={cn('capitalize',priorityBadge[o.priority])}>{o.priority}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{getAmount(o)}</TableCell>
                  <TableCell className="text-right"><div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={()=>setViewOrder(o)}><Eye className="h-4 w-4"/></Button>
                    <Button variant="outline" size="sm" onClick={()=>{localStorage.setItem('highlightOrderId',o.orderNumber);router.push('/tracking');}}>Track</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={()=>setDeleteId(o.id)}><Trash2 className="h-4 w-4"/></Button>
                  </div></TableCell>
                </TableRow>
              )) : (<TableRow><TableCell colSpan={7} className="h-24 text-center"><div className="flex flex-col items-center"><Search className="h-12 w-12 text-gray-400 mb-4"/><p className="text-lg font-medium">No orders found</p></div></TableCell></TableRow>)}
            </TableBody>
          </Table></div></CardContent>
        </Card>
      </>)}

      {tab==='new' && (
        <Card><CardHeader><div className="flex items-center gap-3"><div className="bg-primary/10 p-2 rounded-lg"><Plus className="text-primary h-5 w-5"/></div><CardTitle>Create New Order</CardTitle></div></CardHeader>
        <CardContent className="p-6"><form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2"><label className="text-sm font-medium">Customer *</label><Select value={form.customer} onValueChange={v=>sf('customer',v)}><SelectTrigger><SelectValue placeholder="Select customer"/></SelectTrigger><SelectContent>{customers.map((c:any)=><SelectItem key={c.id} value={c.name}>{c.name} ({c.company||'Individual'})</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><label className="text-sm font-medium">Order Number *</label><Input placeholder="PO-2024-001" value={form.orderNumber} onChange={e=>sf('orderNumber',e.target.value)}/></div>
              <div className="space-y-2"><label className="text-sm font-medium">Project Code *</label><Input placeholder="PROJ-001" value={form.projectCode} onChange={e=>sf('projectCode',e.target.value)}/></div>
              <div className="space-y-2"><label className="text-sm font-medium">Number of Items *</label><Input type="number" min="1" value={form.items} onChange={e=>sf('items',e.target.value)}/></div>
              <div className="space-y-2"><label className="text-sm font-medium">Printer Technology *</label><Select value={form.printerTech} onValueChange={v=>sf('printerTech',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{TECHS.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2"><label className="text-sm font-medium">Order Date *</label><Input type="date" value={form.orderDate} onChange={e=>sf('orderDate',e.target.value)}/></div>
              <div className="space-y-2"><label className="text-sm font-medium">Deadline *</label><Input type="date" value={form.deadline} onChange={e=>sf('deadline',e.target.value)}/></div>
              <div className="space-y-2"><label className="text-sm font-medium">Priority *</label><Select value={form.priority} onValueChange={v=>sf('priority',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><label className="text-sm font-medium">Sales Person *</label><Select value={form.salesPerson} onValueChange={v=>sf('salesPerson',v)}><SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger><SelectContent>{SALES.map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">Product Image</label>
            <div className="flex items-center gap-4 mt-2">
              {form.imageUrl?<img src={form.imageUrl} alt="Product" className="w-20 h-20 rounded-lg object-cover"/>:<div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center"><Upload className="h-8 w-8 text-muted-foreground"/></div>}
              <div><input id="img-upload" type="file" accept="image/*" className="hidden" onChange={handleImg}/><label htmlFor="img-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-10 px-4 py-2">Upload Image</label></div>
            </div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">Notes</label><Textarea placeholder="Additional notes..." value={form.notes} onChange={e=>sf('notes',e.target.value)}/></div>
          <div className="flex justify-end gap-4"><Button type="button" variant="outline" onClick={()=>setTab('list')}>Cancel</Button><Button type="submit">Create Order</Button></div>
        </form></CardContent></Card>
      )}

      <Dialog open={!!viewOrder} onOpenChange={()=>setViewOrder(null)}>
        <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Order Details</DialogTitle></DialogHeader>
        {viewOrder&&(<div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            {[['Order #',viewOrder.orderNumber],['Project Code',viewOrder.projectCode],['Customer',viewOrder.customer],['Items',viewOrder.items],['Technology',viewOrder.printerTech],['Sales Person',viewOrder.salesPerson],['Order Date',format(new Date(viewOrder.orderDate),'dd-MM-yyyy')],['Deadline',format(new Date(viewOrder.deadline),'dd-MM-yyyy')],['Amount',getAmount(viewOrder)]].map(([k,v])=>(<div key={k as string}><p className="text-muted-foreground">{k}</p><p className="font-semibold">{v}</p></div>))}
            <div><p className="text-muted-foreground">Status</p><Badge variant="secondary" className={cn('capitalize mt-1',statusBadge[viewOrder.status])}>{viewOrder.status.replace('-',' ')}</Badge></div>
            <div><p className="text-muted-foreground">Priority</p><Badge variant="outline" className={cn('capitalize mt-1',priorityBadge[viewOrder.priority])}>{viewOrder.priority}</Badge></div>
          </div>
          {viewOrder.notes&&<div><p className="text-muted-foreground">Notes</p><p>{viewOrder.notes}</p></div>}
          <div><p className="font-medium mb-2">Update Status</p><div className="flex flex-wrap gap-2">{STATUSES.map(s=><Button key={s} size="sm" variant={viewOrder.status===s?'default':'outline'} className="capitalize" onClick={()=>{updateOrderStatus(viewOrder.id,s);setViewOrder({...viewOrder,status:s})}}>                {s.replace('-',' ')}</Button>)}</div></div>
        </div>)}
        <DialogFooter><Button variant="outline" onClick={()=>setViewOrder(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId!==null} onOpenChange={()=>setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Order</AlertDialogTitle><AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={()=>{if(deleteId!==null){updateOrderStatus(deleteId,'completed');setDeleteId(null)}}}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
