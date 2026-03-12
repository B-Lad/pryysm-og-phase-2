'use client';

import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import type { UnassignedJob, Printer } from '@/hooks/use-workspace';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ListTree, PlusCircle, Zap, Trash2, Edit, Clock, AlertTriangle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const priorityBadge: Record<string,string> = { high:'bg-red-500/20 text-red-700 border border-red-500/30', medium:'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30', low:'bg-green-500/20 text-green-700 border border-green-500/30' };
const statusBadge: Record<string,string> = { printing:'bg-green-100 text-green-800', idle:'bg-blue-100 text-blue-800', maintenance:'bg-yellow-100 text-yellow-800', offline:'bg-red-100 text-red-800' };
const TECHS = ['FDM','SLA','SLS','MJF','DLP','EBM','DMLS'];

export default function JobAllotmentPage() {
  const { unassignedJobs, printers, addUnassignedJob, deleteUnassignedJob, assignJobToPrinter, autoAssignJob } = useWorkspace();
  const [techFilter, setTechFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'priority'|'deadline'|'items'>('priority');
  const [isAddOpen, setAddOpen] = useState(false);
  const [editJob, setEditJob] = useState<UnassignedJob|null>(null);
  const [deleteId, setDeleteId] = useState<number|string|null>(null);
  const [assignJob, setAssignJob] = useState<UnassignedJob|null>(null);
  const [assignPrinter, setAssignPrinter] = useState<string>('');
  const [form, setForm] = useState({name:'',projectCode:'',priority:'medium',deadline:format(new Date(),'yyyy-MM-dd'),requiredTechnology:'FDM',estimatedTime:'60',items:'1',notes:''});
  const sf = (k: string, v: string) => setForm(f=>({...f,[k]:v}));

  const filteredJobs = useMemo(()=>{
    let jobs=[...unassignedJobs];
    if(techFilter!=='all') jobs=jobs.filter(j=>j.requiredTechnology===techFilter);
    jobs.sort((a,b)=>{
      if(sortBy==='priority'){const po={high:0,medium:1,low:2};return (po[a.priority as keyof typeof po]||1)-(po[b.priority as keyof typeof po]||1);}
      if(sortBy==='deadline') return new Date(a.deadline).getTime()-new Date(b.deadline).getTime();
      return (b.items||0)-(a.items||0);
    });
    return jobs;
  },[unassignedJobs,techFilter,sortBy]);

  const filteredPrinters = useMemo(()=>{
    let ps=[...printers];
    if(techFilter!=='all') ps=ps.filter(p=>p.technology===techFilter);
    if(statusFilter!=='all') ps=ps.filter(p=>p.status===statusFilter);
    return ps;
  },[printers,techFilter,statusFilter]);

  const formatTime = (mins: number) => {
    const h=Math.floor(mins/60); const m=mins%60;
    return h>0?`${h}h ${m}m`:`${m}m`;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const job = { id:editJob?.id||Date.now(), name:form.name, projectCode:form.projectCode||`PROJ-${Date.now()}`, priority:form.priority as 'low'|'medium'|'high', deadline:form.deadline, requiredTechnology:form.requiredTechnology, estimatedTime:parseInt(form.estimatedTime)||60, items:parseInt(form.items)||1 };
    addUnassignedJob(job as any);
    setAddOpen(false); setEditJob(null);
    setForm({name:'',projectCode:'',priority:'medium',deadline:format(new Date(),'yyyy-MM-dd'),requiredTechnology:'FDM',estimatedTime:'60',items:'1',notes:''});
  };

  const handleAssign = () => {
    if(assignJob&&assignPrinter){
      const printer=printers.find(p=>p.id===assignPrinter);
      if(printer){assignJobToPrinter(assignJob,assignPrinter);setAssignJob(null);setAssignPrinter('');}
    }
  };

  const handleAutoAssign = (job: UnassignedJob) => {
    autoAssignJob(job);
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-lg"><ListTree className="text-primary h-6 w-6"/></div>
          <div><h1 className="text-2xl font-bold">Job Allotment</h1><p className="text-sm text-muted-foreground">Assign print jobs to printers</p></div>
        </div>
        <Button onClick={()=>setAddOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Add New Job</Button>
      </header>

      {/* Filters & Sort */}
      <Card><CardContent className="p-4">
        <div className="flex flex-wrap gap-4">
          <Select value={techFilter} onValueChange={setTechFilter}><SelectTrigger className="w-[200px]"><SelectValue placeholder="All Technologies"/></SelectTrigger><SelectContent><SelectItem value="all">All Technologies</SelectItem>{TECHS.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses"/></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="printing">Printing</SelectItem><SelectItem value="idle">Idle</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="offline">Offline</SelectItem></SelectContent></Select>
          <Select value={sortBy} onValueChange={(v)=>setSortBy(v as any)}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort by"/></SelectTrigger><SelectContent><SelectItem value="priority">Sort: Priority</SelectItem><SelectItem value="deadline">Sort: Deadline</SelectItem><SelectItem value="items">Sort: Items</SelectItem></SelectContent></Select>
        </div>
      </CardContent></Card>

      {/* Job Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Job Queue ({filteredJobs.length})</CardTitle>
          <CardDescription>Unassigned print jobs waiting for printer assignment</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Job Name</TableHead><TableHead>Technology</TableHead><TableHead>Priority</TableHead><TableHead>Deadline</TableHead><TableHead>Est. Time</TableHead><TableHead>Items</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredJobs.length>0 ? filteredJobs.map(job=>{
                const isOverdue=new Date(job.deadline)<new Date();
                return (
                  <TableRow key={job.id}>
                    <TableCell><div className="font-medium">{job.name}</div><div className="text-xs text-muted-foreground">{job.projectCode}</div></TableCell>
                    <TableCell><Badge variant="outline">{job.requiredTechnology}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={cn('capitalize',priorityBadge[job.priority])}>{job.priority}</Badge></TableCell>
                    <TableCell><div className={cn('font-medium text-sm',isOverdue?'text-destructive':'')}>{format(new Date(job.deadline),'dd-MM-yyyy')}</div>{isOverdue&&<div className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3"/>Overdue</div>}</TableCell>
                    <TableCell><div className="flex items-center gap-1 text-sm"><Clock className="h-4 w-4 text-muted-foreground"/>{formatTime(job.estimatedTime||60)}</div></TableCell>
                    <TableCell>{job.items||1}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={()=>{setAssignJob(job);setAssignPrinter('');}}>Assign</Button>
                        <Button size="sm" variant="ghost" onClick={()=>handleAutoAssign(job)}><Zap className="h-4 w-4 text-yellow-500"/></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={()=>setDeleteId(job.id)}><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No jobs in queue. Add a new job to get started.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Printer Status */}
      <Card>
        <CardHeader><CardTitle>Printer Status ({filteredPrinters.length})</CardTitle><CardDescription>Available printers for job assignment</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrinters.map(p=>(
              <div key={p.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{p.name}</p>
                  <Badge className={statusBadge[p.status]||''}>{p.status}</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Technology: <span className="text-foreground font-medium">{p.technology}</span></p>
                  <p>Location: {p.location}</p>
                  {p.currentJob&&<p className="text-xs">Current: {p.currentJob.name}</p>}
                </div>
              </div>
            ))}
            {filteredPrinters.length===0&&<div className="col-span-full text-center text-muted-foreground py-8">No printers match the selected filters.</div>}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Job Dialog */}
      <Dialog open={isAddOpen||!!editJob} onOpenChange={()=>{setAddOpen(false);setEditJob(null);}}>
        <DialogContent><DialogHeader><DialogTitle>{editJob?'Edit Job':'Add New Job'}</DialogTitle></DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2"><Label>Job Name *</Label><Input value={form.name} onChange={e=>sf('name',e.target.value)} required/></div>
            <div className="space-y-2"><Label>Project Code</Label><Input value={form.projectCode} onChange={e=>sf('projectCode',e.target.value)}/></div>
            <div className="space-y-2"><Label>Technology *</Label><Select value={form.requiredTechnology} onValueChange={v=>sf('requiredTechnology',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{TECHS.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Priority</Label><Select value={form.priority} onValueChange={v=>sf('priority',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e=>sf('deadline',e.target.value)}/></div>
            <div className="space-y-2"><Label>Est. Time (mins)</Label><Input type="number" min="1" value={form.estimatedTime} onChange={e=>sf('estimatedTime',e.target.value)}/></div>
            <div className="space-y-2"><Label>Items</Label><Input type="number" min="1" value={form.items} onChange={e=>sf('items',e.target.value)}/></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={()=>{setAddOpen(false);setEditJob(null);}}>Cancel</Button><Button type="submit">{editJob?'Update':'Add Job'}</Button></DialogFooter>
        </form>
        </DialogContent>
      </Dialog>

      {/* Assign Job Dialog */}
      <Dialog open={!!assignJob} onOpenChange={()=>setAssignJob(null)}>
        <DialogContent><DialogHeader><DialogTitle>Assign Job to Printer</DialogTitle></DialogHeader>
        {assignJob&&<div className="space-y-4">
          <div className="p-3 border rounded-lg bg-muted/30">
            <p className="font-medium">{assignJob.name}</p>
            <p className="text-sm text-muted-foreground">{assignJob.requiredTechnology} · {formatTime(assignJob.estimatedTime||60)} · {assignJob.items||1} items</p>
          </div>
          <div className="space-y-2"><Label>Select Printer</Label>
            <Select value={assignPrinter} onValueChange={setAssignPrinter}>
              <SelectTrigger><SelectValue placeholder="Choose a printer"/></SelectTrigger>
              <SelectContent>
                {printers.filter(p=>p.technology===assignJob.requiredTechnology&&(p.status==='idle'||p.status==='printing')).map(p=>(
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.status})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={()=>setAssignJob(null)}>Cancel</Button><Button onClick={handleAssign} disabled={!assignPrinter}>Assign</Button></DialogFooter>
        </div>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId!==null} onOpenChange={()=>setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Job</AlertDialogTitle><AlertDialogDescription>Remove this job from the queue?</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={()=>{if(deleteId!==null){deleteUnassignedJob(deleteId);setDeleteId(null)}}}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
