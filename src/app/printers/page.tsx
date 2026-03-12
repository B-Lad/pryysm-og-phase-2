'use client';

import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import type { Printer } from '@/hooks/use-workspace';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GanttChartSquare, Zap, Server, Wrench, XCircle, Printer as PrinterIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusBorder: Record<Printer['status'],string> = { printing:'border-l-4 border-green-500', idle:'border-l-4 border-blue-500', maintenance:'border-l-4 border-yellow-500', offline:'border-l-4 border-red-500' };
const statusText: Record<Printer['status'],string> = { printing:'bg-green-100 text-green-800', idle:'bg-blue-100 text-blue-800', maintenance:'bg-yellow-100 text-yellow-800', offline:'bg-red-100 text-red-800' };

const techNames: Record<string,string> = { FDM:'FDM (Fused Deposition Modeling)', SLA:'SLA (Stereolithography)', DLP:'DLP (Digital Light Processing)', SLS:'SLS (Selective Laser Sintering)', MJF:'MJF (Multi Jet Fusion)', EBM:'EBM (Electron Beam Melting)', DMLS:'DMLS (Direct Metal Laser Sintering)' };

export default function PrintersPage() {
  const { printers } = useWorkspace();
  const [techFilter, setTechFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const technologies = useMemo(()=>[...new Set(printers.map(p=>p.technology))],[printers]);

  const filtered = useMemo(()=>printers.filter(p=>{
    const techOk = techFilter==='all'||p.technology===techFilter;
    const statOk = statusFilter==='all'||p.status===statusFilter;
    return techOk&&statOk;
  }),[printers,techFilter,statusFilter]);

  const counts = useMemo(()=>{
    return { printing:printers.filter(p=>p.status==='printing').length, idle:printers.filter(p=>p.status==='idle').length, maintenance:printers.filter(p=>p.status==='maintenance').length, offline:printers.filter(p=>p.status==='offline').length };
  },[printers]);

  const getUtilization = (p: Printer) => {
    if (p.status==='printing') return 100;
    if (p.status==='idle') return 0;
    if (p.status==='maintenance') return 0;
    return 0;
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-lg"><GanttChartSquare className="text-primary h-6 w-6"/></div>
          <div><h1 className="text-2xl font-bold">3D Printer Management</h1><p className="text-sm text-muted-foreground">View status and schedule of all printers</p></div>
        </div>
      </header>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Printing</CardTitle><Zap className="h-5 w-5 text-green-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{counts.printing}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Idle</CardTitle><Server className="h-5 w-5 text-blue-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{counts.idle}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Maintenance</CardTitle><Wrench className="h-5 w-5 text-yellow-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{counts.maintenance}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Offline</CardTitle><XCircle className="h-5 w-5 text-red-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{counts.offline}</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="w-full md:w-auto md:min-w-[220px]">
          <Label className="text-sm font-medium">Filter by Technology</Label>
          <Select value={techFilter} onValueChange={setTechFilter}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="All Technologies"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technologies</SelectItem>
              {technologies.map(t=><SelectItem key={t} value={t}>{techNames[t]||t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-auto md:min-w-[180px]">
          <Label className="text-sm font-medium">Filter by Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="All Statuses"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="printing">Printing</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Printer Cards Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Printers ({filtered.length})</CardTitle>
          <CardDescription>Current status of all printers in the fleet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length > 0 ? filtered.map(p => (
              <div key={p.id} className={cn('p-4 border rounded-lg hover:bg-muted/50 transition-colors', statusBorder[p.status])}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{p.name}</h3>
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', statusText[p.status])}>
                    {p.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <PrinterIcon className="w-10 h-10 text-muted-foreground"/>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1 flex-1">
                    <div><span className="font-medium text-foreground">Technology:</span> {p.technology}</div>
                    <div><span className="font-medium text-foreground">Capacity:</span> {p.capacity}</div>
                    <div><span className="font-medium text-foreground">Material:</span> {p.material}</div>
                    <div><span className="font-medium text-foreground">Location:</span> {p.location}</div>
                    <div className="flex items-center gap-1 text-xs pt-1">
                      <Clock className="h-3 w-3"/>
                      {p.status==='printing'&&p.currentJob ? `Printing: ${p.currentJob.name}` : `Status: ${p.status}`}
                    </div>
                  </div>
                </div>
                {p.status==='printing'&&p.currentJob?.progress!=null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress</span><span>{p.currentJob.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full transition-all" style={{width:`${p.currentJob.progress}%`}}/>
                    </div>
                  </div>
                )}
                <div className="mt-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Utilization: </span>
                  {p.status==='printing'?'Active':'Inactive'}
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center text-muted-foreground py-12">
                No printers match the selected filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Printer Schedule Overview</CardTitle>
          <CardDescription>Summary of current and upcoming print jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {printers.filter(p=>p.currentJob).length > 0 ? (
              printers.filter(p=>p.currentJob).map(p=>(
                <div key={p.id} className="flex items-center gap-4 p-3 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Printing: {p.currentJob!.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800 text-xs">{p.currentJob!.progress?.toFixed(0)}% done</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No active print jobs. Assign jobs via Job Allotment.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
