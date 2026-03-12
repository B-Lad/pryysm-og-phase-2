'use client';

import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import type { Spool, Resin, Powder } from '@/hooks/use-workspace';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Download, LogIn, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';

const statusColors: Record<string,string> = { New:'bg-sky-100 text-sky-800', Active:'bg-green-100 text-green-800', Low:'bg-yellow-100 text-yellow-800', Critical:'bg-red-100 text-red-800', Empty:'bg-gray-100 text-gray-800' };

type MaterialItem = (Spool|Resin|Powder) & { itemType:'spool'|'resin'|'powder' };

export default function MaterialLogPage() {
  const { spools, resins, powders, printers, logSpoolUsage, logResinUsage, logPowderUsage } = useWorkspace();
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [returnAmounts, setReturnAmounts] = useState<Record<string,string>>({});

  const allMaterials = useMemo((): MaterialItem[] => [
    ...(spools||[]).map((s:Spool)=>({...s,itemType:'spool' as const})),
    ...(resins||[]).map((r:Resin)=>({...r,itemType:'resin' as const})),
    ...(powders||[]).map((p:Powder)=>({...p,itemType:'powder' as const})),
  ],[spools,resins,powders]);

  const filtered = useMemo(()=>allMaterials.filter(m=>{
    if(typeFilter!=='all'&&m.itemType!==typeFilter) return false;
    if(statusFilter!=='all'&&m.status!==statusFilter) return false;
    if(dateFrom&&m.purchaseDate<dateFrom) return false;
    if(dateTo&&m.purchaseDate>dateTo) return false;
    return true;
  }),[allMaterials,typeFilter,statusFilter,dateFrom,dateTo]);

  const assigned = useMemo(()=>allMaterials.filter(m=>(m as any).assignedToPrinterId),[allMaterials]);

  const getRemaining = (m: MaterialItem) => {
    if(m.itemType==='spool') return `${(m as Spool).weight-(m as Spool).used}g / ${(m as Spool).weight}g`;
    if(m.itemType==='resin') return `${(m as Resin).volume-(m as Resin).used}ml / ${(m as Resin).volume}ml`;
    return `${((m as Powder).weight-(m as Powder).used).toFixed(2)}kg / ${(m as Powder).weight.toFixed(2)}kg`;
  };

  const getRemainingPct = (m: MaterialItem) => {
    if(m.itemType==='spool'){const s=m as Spool;return s.weight>0?((s.weight-s.used)/s.weight)*100:0;}
    if(m.itemType==='resin'){const r=m as Resin;return r.volume>0?((r.volume-r.used)/r.volume)*100:0;}
    const p=m as Powder;return p.weight>0?((p.weight-p.used)/p.weight)*100:0;
  };

  const handleReturn = (m: MaterialItem) => {
    const key=`${m.itemType}-${m.id}`;
    const amt=parseFloat(returnAmounts[key]||'0');
    if(amt>0){
      if(m.itemType==='spool') logSpoolUsage(m.id as number,amt);
      else if(m.itemType==='resin') logResinUsage(m.id as number,amt);
      else logPowderUsage(m.id as number,amt);
      setReturnAmounts(prev=>({...prev,[key]:''}));
    }
  };

  const exportCSV = () => {
    const rows = [['ID','Name','Type','Status','Remaining','Purchase Date'],...filtered.map(m=>[m.id,m.name,m.itemType,m.status,getRemaining(m),m.purchaseDate])];
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='material-log.csv'; a.click();
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-lg"><History className="text-primary h-6 w-6"/></div>
          <div><h1 className="text-2xl font-bold">Material Log</h1><p className="text-sm text-muted-foreground">Track material usage and check-in/out</p></div>
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4"/>Export CSV</Button>
      </header>

      {/* Filters */}
      <Card><CardContent className="p-4">
        <div className="flex flex-wrap gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-[150px]"><SelectValue placeholder="All Types"/></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="spool">Filaments</SelectItem><SelectItem value="resin">Resins</SelectItem><SelectItem value="powder">Powders</SelectItem></SelectContent></Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status"/></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="New">New</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Low">Low</SelectItem><SelectItem value="Critical">Critical</SelectItem><SelectItem value="Empty">Empty</SelectItem></SelectContent></Select>
          <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">From:</span><Input type="date" className="w-40" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></div>
          <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">To:</span><Input type="date" className="w-40" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></div>
          <Button variant="ghost" size="sm" onClick={()=>{setTypeFilter('all');setStatusFilter('all');setDateFrom('');setDateTo('');}}>Clear</Button>
        </div>
      </CardContent></Card>

      {/* Main log table */}
      <Card>
        <CardHeader><CardTitle>Material Inventory Log</CardTitle><CardDescription>Showing {filtered.length} of {allMaterials.length} items</CardDescription></CardHeader>
        <CardContent><div className="overflow-x-auto"><Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Remaining</TableHead><TableHead>Usage %</TableHead><TableHead>Purchase Date</TableHead><TableHead>Log Usage</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map(m=>{
              const key=`${m.itemType}-${m.id}`;
              const pct=getRemainingPct(m);
              return (
                <TableRow key={key}>
                  <TableCell><div className="font-medium">{m.name}</div><div className="text-xs text-muted-foreground">{m.brand}</div></TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{m.itemType}</Badge></TableCell>
                  <TableCell><Badge className={statusColors[m.status]||'bg-gray-100'}>{m.status}</Badge></TableCell>
                  <TableCell className="text-sm">{getRemaining(m)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-2 w-20"/>
                      <span className="text-xs">{pct.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{m.purchaseDate?format(new Date(m.purchaseDate),'dd-MM-yyyy'):'—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Input type="number" min="0" step="0.1" className="h-8 w-20" placeholder="Amt" value={returnAmounts[key]||''} onChange={e=>setReturnAmounts(prev=>({...prev,[key]:e.target.value}))}/>
                      <Button size="sm" variant="outline" className="h-8" onClick={()=>handleReturn(m)}>Log</Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table></div></CardContent>
      </Card>

      {/* Assigned Materials */}
      {assigned.length>0&&(
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><LogOut className="text-destructive"/>Currently Assigned to Printers</CardTitle><CardDescription>Materials checked out to active printers</CardDescription></CardHeader>
          <CardContent><Table>
            <TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Type</TableHead><TableHead>Assigned Printer</TableHead><TableHead>Remaining</TableHead></TableRow></TableHeader>
            <TableBody>
              {assigned.map(m=>{
                const printer = printers.find((p:any)=>p.id===(m as any).assignedToPrinterId);
                return (
                  <TableRow key={`a-${m.itemType}-${m.id}`}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{m.itemType}</Badge></TableCell>
                    <TableCell>{printer?.name||'Unknown'}</TableCell>
                    <TableCell>{getRemaining(m)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></CardContent>
        </Card>
      )}
    </div>
  );
}
