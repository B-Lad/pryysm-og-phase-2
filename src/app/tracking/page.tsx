'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import type { Order } from '@/hooks/use-workspace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Workflow, Search, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type KanbanColId = 'order-received'|'printing'|'qc'|'packing'|'dispatched';

const colMap: Record<KanbanColId, Order['status'][]> = {
  'order-received':['pending'],
  'printing':['in-progress','overdue'],
  'qc':['qc'],
  'packing':['packing'],
  'dispatched':['dispatched','completed'],
};

const statusToCol: Record<Order['status'],KanbanColId> = {
  pending:'order-received','in-progress':'printing',overdue:'printing',qc:'qc',packing:'packing',dispatched:'dispatched',completed:'dispatched',
};

const statusBadge: Record<Order['status'],string> = {
  completed:'bg-green-100 text-green-800',dispatched:'bg-blue-100 text-blue-800','in-progress':'bg-cyan-100 text-cyan-800',
  overdue:'bg-red-200 text-red-900',packing:'bg-orange-100 text-orange-800',pending:'bg-gray-100 text-gray-800',qc:'bg-purple-100 text-purple-800',
};

const priorityBadge: Record<Order['priority'],string> = {
  high:'bg-red-500/20 text-red-700',medium:'bg-yellow-500/20 text-yellow-700',low:'bg-green-500/20 text-green-700',
};

const colColors: Record<KanbanColId,string> = {
  'order-received':'border-t-blue-500','printing':'border-t-yellow-500','qc':'border-t-purple-500','packing':'border-t-orange-500','dispatched':'border-t-green-500',
};

const colTitles: Record<KanbanColId,string> = {
  'order-received':'Order Received','printing':'Printing','qc':'Quality Control','packing':'Packing','dispatched':'Dispatched',
};

const STATUSES: Order['status'][] = ['pending','in-progress','qc','packing','dispatched','completed','overdue'];

export default function TrackingPage() {
  const { orders, customers, updateOrderStatus } = useWorkspace();
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<Order|null>(null);
  const [highlighted, setHighlighted] = useState<string|null>(null);
  const [dragItem, setDragItem] = useState<{id:number,sourceCol:KanbanColId}|null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanColId|null>(null);
  const cardRefs = useRef<Record<string,HTMLDivElement|null>>({});

  useEffect(()=>{
    const id = localStorage.getItem('highlightOrderId');
    if(id){setHighlighted(id);localStorage.removeItem('highlightOrderId');}
  },[]);

  useEffect(()=>{
    if(highlighted&&cardRefs.current[highlighted]){
      cardRefs.current[highlighted]?.scrollIntoView({behavior:'smooth',block:'center'});
      const t=setTimeout(()=>setHighlighted(null),2500);
      return ()=>clearTimeout(t);
    }
  },[highlighted]);

  const columns = useMemo(()=>{
    const sq = search.toLowerCase();
    return (['order-received','printing','qc','packing','dispatched'] as KanbanColId[]).map(colId=>({
      id: colId,
      title: colTitles[colId],
      items: orders.filter(o=>colMap[colId].includes(o.status)&&(!sq||o.customer.toLowerCase().includes(sq)||o.orderNumber.toLowerCase().includes(sq)))
    }));
  },[orders,search]);

  const handleDrop = useCallback((targetCol: KanbanColId)=>{
    if(!dragItem||dragItem.sourceCol===targetCol) return;
    const newStatus = colMap[targetCol][0];
    if(newStatus) updateOrderStatus(dragItem.id,newStatus);
    setDragItem(null); setDragOverCol(null);
  },[dragItem,updateOrderStatus]);

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-lg"><Workflow className="text-primary h-6 w-6"/></div>
          <div><h1 className="text-2xl font-bold">Project Tracking</h1><p className="text-sm text-muted-foreground">Visualize and manage your entire workflow</p></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder="Search orders..." className="pl-9 w-64" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        </div>
      </header>

      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[70vh]">
        {columns.map(col=>(
          <div key={col.id} className={cn('flex-shrink-0 w-72 rounded-lg border-t-4 bg-muted/30',colColors[col.id],dragOverCol===col.id?'ring-2 ring-primary bg-primary/5':'')}
            onDragOver={e=>{e.preventDefault();setDragOverCol(col.id)}}
            onDragLeave={()=>setDragOverCol(null)}
            onDrop={()=>handleDrop(col.id)}
          >
            <div className="p-3 font-semibold flex items-center justify-between">
              <span>{col.title}</span>
              <Badge variant="secondary" className="text-xs">{col.items.length}</Badge>
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              {col.items.map(order=>(
                <div key={order.id} ref={el=>{cardRefs.current[order.orderNumber]=el}}
                  className={cn('bg-background border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all',highlighted===order.orderNumber&&'ring-2 ring-yellow-400 bg-yellow-50 animate-pulse')}
                  draggable onDragStart={()=>setDragItem({id:order.id,sourceCol:col.id})} onDragEnd={()=>{setDragItem(null);setDragOverCol(null)}}
                  onClick={()=>setSelectedCard(order)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-sm truncate">{order.customer}</p>
                    <Badge className={cn('text-xs',priorityBadge[order.priority])}>{order.priority}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{order.orderNumber}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{order.items} items · {order.printerTech}</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Due: <span className={cn('font-medium',new Date(order.deadline)<new Date()&&order.status!=='completed'&&order.status!=='dispatched'?'text-destructive':'')}>
                      {format(new Date(order.deadline),'dd-MM-yyyy')}
                    </span>
                  </div>
                </div>
              ))}
              {col.items.length===0&&(
                <div className={cn('h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground',dragOverCol===col.id?'border-primary/50 bg-primary/5':'border-muted-foreground/20')}>
                  Drop here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={()=>setSelectedCard(null)}>
        <DialogContent><DialogHeader><DialogTitle>Order Details</DialogTitle></DialogHeader>
        {selectedCard&&(
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[['Order #',selectedCard.orderNumber],['Project Code',selectedCard.projectCode],['Customer',selectedCard.customer],['Items',selectedCard.items],['Technology',selectedCard.printerTech],['Sales Person',selectedCard.salesPerson]].map(([k,v])=>(<div key={k as string}><p className="text-muted-foreground">{k}</p><p className="font-semibold">{v}</p></div>))}
              <div><p className="text-muted-foreground">Deadline</p><p className={cn('font-semibold',new Date(selectedCard.deadline)<new Date()&&selectedCard.status!=='completed'?'text-destructive':'')}>{format(new Date(selectedCard.deadline),'dd-MM-yyyy')}</p></div>
              <div><p className="text-muted-foreground">Status</p><Badge className={cn('mt-1',statusBadge[selectedCard.status])}>{selectedCard.status.replace('-',' ')}</Badge></div>
            </div>
            {selectedCard.notes&&<div><p className="text-muted-foreground">Notes</p><p>{selectedCard.notes}</p></div>}
            <div>
              <p className="font-medium mb-2">Move to:</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s=><Button key={s} size="sm" variant={selectedCard.status===s?'default':'outline'} className="capitalize" onClick={()=>{updateOrderStatus(selectedCard.id,s);setSelectedCard({...selectedCard,status:s})}}>                  {s.replace('-',' ')}</Button>)}
              </div>
            </div>
          </div>
        )}
        <DialogFooter><Button variant="outline" onClick={()=>setSelectedCard(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
