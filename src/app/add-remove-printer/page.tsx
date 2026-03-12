'use client';

import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import type { Printer, PrinterStatus, PrinterTechnology } from '@/hooks/use-workspace';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, PlusCircle, Printer as PrinterIcon, Wrench, CheckCircle, ShieldOff } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const TECHS: PrinterTechnology[] = ['FDM','SLA','SLS','DLP','MJF','EBM','DMLS'];
const statusBorder: Record<PrinterStatus,string> = { printing:'border-l-4 border-green-500', idle:'border-l-4 border-blue-500', maintenance:'border-l-4 border-yellow-500', offline:'border-l-4 border-red-500' };
const statusText: Record<PrinterStatus,string> = { printing:'text-green-600 bg-green-100', idle:'text-blue-600 bg-blue-100', maintenance:'text-yellow-600 bg-yellow-100', offline:'text-red-600 bg-red-100' };

export default function AddRemovePrinterPage() {
  const { printers, addPrinter, deletePrinter, updatePrinterStatus } = useWorkspace();
  const [isAddOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [statusFilter, setStatusFilter] = useState<'all'|PrinterStatus>('all');

  const [name, setName] = useState(''); const [model, setModel] = useState(''); const [codeName, setCodeName] = useState('');
  const [location, setLocation] = useState('Lab 1'); const [technology, setTechnology] = useState<PrinterTechnology>('FDM');
  const [capacity, setCapacity] = useState('Standard'); const [material, setMaterial] = useState('PLA');
  const [initDate, setInitDate] = useState(format(new Date(),'yyyy-MM-dd'));

  const filtered = useMemo(()=>{
    if (statusFilter==='all') return printers;
    return printers.filter(p=>p.status===statusFilter);
  },[printers,statusFilter]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name||!model||!location||!technology||!codeName||!capacity||!material) return;
    addPrinter({ name, model, codeName, location, technology, capacity, material, status:'idle' as PrinterStatus, initializationDate: initDate } as any);
    setAddOpen(false);
    setName(''); setModel(''); setCodeName(''); setLocation('Lab 1'); setTechnology('FDM'); setCapacity('Standard'); setMaterial('PLA'); setInitDate(format(new Date(),'yyyy-MM-dd'));
  };

  const handleStatusChange = (id: string, newStatus: PrinterStatus) => {
    const p = printers.find(p=>p.id===id);
    if (!p) return;
    if (p.status==='printing'&&(newStatus==='maintenance'||newStatus==='offline')) return;
    updatePrinterStatus(id, newStatus);
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-3"><PrinterIcon className="h-8 w-8"/>Printer Fleet Management</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2"><PrinterIcon className="text-primary"/>Printer Fleet ({printers.length})</CardTitle>
              <CardDescription className="mt-1">Manage your printer fleet</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v)=>setStatusFilter(v as any)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Status"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="printing">Printing</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={()=>setAddOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Add Printer</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(p=>(
              <Card key={p.id} className={statusBorder[p.status]}>
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><PrinterIcon className="h-4 w-4 text-muted-foreground"/><span className="truncate">{p.name}</span></CardTitle>
                    <div className={cn('text-xs font-bold capitalize px-2 py-0.5 rounded-full',statusText[p.status])}>{p.status}</div>
                  </div>
                  {p.currentJob&&<div className="text-xs text-muted-foreground pt-1 truncate">Printing: <span className="font-semibold text-foreground">{p.currentJob.name}</span></div>}
                </CardHeader>
                <CardContent className="px-4 pb-3 text-xs text-muted-foreground space-y-1">
                  {p.currentJob&&p.currentJob.progress!=null&&(
                    <div className="space-y-1"><Progress value={p.currentJob.progress} className="h-1.5"/><p className="text-xs text-right">{p.currentJob.progress.toFixed(0)}% complete</p></div>
                  )}
                  <p><span className="font-medium text-foreground">Code:</span> {p.codeName} | <span className="font-medium text-foreground">Location:</span> {p.location}</p>
                  <p><span className="font-medium text-foreground">Tech:</span> {p.technology} | <span className="font-medium text-foreground">Material:</span> {p.material}</p>
                </CardContent>
                <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                  {(p.status==='idle'||p.status==='printing') ? (<>
                    <Button variant="outline" size="sm" onClick={()=>handleStatusChange(p.id,'maintenance')}><Wrench className="mr-1 h-3 w-3 text-yellow-500"/>Maint.</Button>
                    <Button variant="outline" size="sm" onClick={()=>handleStatusChange(p.id,'offline')}><ShieldOff className="mr-1 h-3 w-3 text-red-500"/>Offline</Button>
                  </>) : (
                    <Button variant="outline" size="sm" className="col-span-2" onClick={()=>handleStatusChange(p.id,'idle')}><CheckCircle className="mr-1 h-3 w-3 text-green-500"/>Set to Idle</Button>
                  )}
                  <Button variant="destructive" size="sm" className="col-span-2" onClick={()=>setDeleteId(p.id)}><Trash2 className="mr-2 h-4 w-4"/>Remove</Button>
                </div>
              </Card>
            ))}
            {filtered.length===0&&<div className="col-span-full text-center text-muted-foreground py-12">No printers match the selected status.</div>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Add New Printer</DialogTitle><DialogDescription>Enter printer details.</DialogDescription></DialogHeader>
          <form onSubmit={handleAdd}>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
              {[['Printer Name','text',name,setName,'e.g. Prusa i3 MK3S+'],['Model','text',model,setModel,'e.g. i3 MK3S+'],['Code Name','text',codeName,setCodeName,'e.g. PRUSA02'],['Location','text',location,setLocation,'e.g. Lab 1'],['Capacity','text',capacity,setCapacity,'e.g. Standard'],['Default Material','text',material,setMaterial,'e.g. PLA']].map(([lbl,type,val,setter,ph])=>(
                <div key={lbl as string} className="space-y-2"><Label>{lbl as string}</Label><Input type={type as string} placeholder={ph as string} value={val as string} onChange={e=>(setter as any)(e.target.value)} required/></div>
              ))}
              <div className="space-y-2"><Label>Printer Type</Label>
                <Select value={technology} onValueChange={v=>setTechnology(v as PrinterTechnology)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{TECHS.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Initialization Date</Label><Input type="date" value={initDate} onChange={e=>setInitDate(e.target.value)} required/></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={()=>setAddOpen(false)}>Cancel</Button><Button type="submit">Add Printer</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId!==null} onOpenChange={()=>setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove Printer</AlertDialogTitle><AlertDialogDescription>This will permanently remove this printer from the fleet.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={()=>{if(deleteId){deletePrinter(deleteId);setDeleteId(null)}}}>Remove</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
