'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { PackageCheck, Printer, Package, Search, CheckCircle2, Clock, TruckIcon } from 'lucide-react';
import { format } from 'date-fns';

type AddressInfo = { name:string;company:string;line1:string;hasLine2:boolean;line2:string;city:string;state:string;zip:string;country:string;phone:{prefix:string;number:string} };
type PackageDetails = { trackingNumber:string;weight:string;weightUnit:'kg'|'lb';length:string;width:string;height:string;dimensionUnit:'cm'|'in';contents:string };
type ShippingInfo = { from:AddressInfo;to:AddressInfo;orderId:string;barcode:string;itemNumber:string;packageDetails:PackageDetails };

const COUNTRIES = [{ code:'US', name:'United States' },{ code:'CA', name:'Canada' },{ code:'GB', name:'United Kingdom' },{ code:'AU', name:'Australia' },{ code:'DE', name:'Germany' },{ code:'FR', name:'France' },{ code:'IN', name:'India' },{ code:'AE', name:'United Arab Emirates' }];
const PHONE_PREFIXES = [{ value:'+1', label:'US/CA (+1)' },{ value:'+44', label:'UK (+44)' },{ value:'+91', label:'IN (+91)' },{ value:'+971', label:'AE (+971)' },{ value:'+61', label:'AU (+61)' },{ value:'+49', label:'DE (+49)' }];

const defaultFrom: AddressInfo = { name:'PrintFlow Inc.', company:'PrintFlow by 3D Prodigy', line1:'123 Maker Lane', hasLine2:true, line2:'Suite 100', city:'Innovation City', state:'TX', zip:'75001', country:'US', phone:{ prefix:'+1', number:'555-123-4567' } };
const blankTo: AddressInfo = { name:'', company:'', line1:'', hasLine2:false, line2:'', city:'', state:'', zip:'', country:'US', phone:{ prefix:'+1', number:'' } };
const blankPkg: PackageDetails = { trackingNumber:'', weight:'', weightUnit:'kg', length:'', width:'', height:'', dimensionUnit:'cm', contents:'' };

function blankShipping(): ShippingInfo { return { from:{...defaultFrom}, to:{...blankTo}, orderId:`SHIP-${Date.now()}`, barcode:'N/A', itemNumber:'N/A', packageDetails:{...blankPkg} }; }

function ShippingLabelPreview({ info }: { info: ShippingInfo }) {
  const fmtAddr = (a: AddressInfo) => [a.name,a.company,a.line1,a.hasLine2&&a.line2,`${a.city}, ${a.state} ${a.zip}`,a.country,a.phone?.number?`${a.phone.prefix} ${a.phone.number}`:''].filter(Boolean);
  return (
    <div className="bg-white border-2 border-gray-800 rounded-lg p-6 font-mono text-sm w-full max-w-md mx-auto">
      <div className="flex justify-between items-start mb-4">
        <div><p className="font-bold text-lg">PRIORITY</p><p className="text-xs text-gray-500">EXPRESS MAIL</p></div>
        <div className="text-right"><p className="font-bold">{info.orderId}</p><p className="text-xs">{info.itemNumber}</p></div>
      </div>
      <Separator className="mb-4"/>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div><p className="text-xs font-bold uppercase text-gray-500 mb-1">From</p>{fmtAddr(info.from).map((l,i)=><p key={i} className="text-xs">{l as string}</p>)}</div>
        <div><p className="text-xs font-bold uppercase text-gray-500 mb-1">To</p>{fmtAddr(info.to).map((l,i)=><p key={i} className={`text-xs ${i===0?'font-bold':''}`}>{l as string}</p>)}</div>
      </div>
      <Separator className="mb-4"/>
      <div className="bg-gray-800 text-white p-3 text-center rounded mb-4">
        <p className="font-mono text-lg tracking-widest">{info.barcode||info.packageDetails.trackingNumber||'—'}</p>
        <div className="flex justify-center gap-1 mt-1">{Array.from({length:40}).map((_,i)=><div key={i} className={`h-6 bg-white ${Math.random()>0.4?'w-0.5':'w-1'}`}/>)}</div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div><p className="text-gray-500">Weight</p><p className="font-semibold">{info.packageDetails.weight} {info.packageDetails.weightUnit}</p></div>
        <div><p className="text-gray-500">Dimensions</p><p className="font-semibold">{info.packageDetails.length}×{info.packageDetails.width}×{info.packageDetails.height} {info.packageDetails.dimensionUnit}</p></div>
        <div><p className="text-gray-500">Contents</p><p className="font-semibold truncate">{info.packageDetails.contents||'—'}</p></div>
      </div>
    </div>
  );
}

export default function OrderDispatchPage() {
  const { shippingLogs, addShippingLog, orders } = useWorkspace() as any;
  const [mode, setMode] = useState<'list'|'custom'>('list');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [info, setInfo] = useState<ShippingInfo>(blankShipping);
  const [logSearch, setLogSearch] = useState('');

  // Build sample orders from workspace orders
  const orderOptions = useMemo(()=>(orders||[]).slice(0,10).map((o:any)=>({ orderId:o.orderNumber, toName:o.customer, barcode:`TRK-${o.orderNumber}` })),[orders]);

  useEffect(()=>{
    if(mode==='list'&&orderOptions.length>0){
      const o=orderOptions.find((x:any)=>x.orderId===selectedOrderId)||orderOptions[0];
      if(o) { setSelectedOrderId(o.orderId); setInfo(prev=>({...prev,orderId:o.orderId,barcode:o.barcode,to:{...blankTo,name:o.toName}})); }
    } else if(mode==='custom') {
      setInfo(blankShipping());
    }
  },[mode,selectedOrderId]);

  const setAddr = (section: 'from'|'to', field: string, val: any) => setInfo(prev=>{const n={...prev};(n[section] as any)[field]=val;return n;});
  const setPkg = (field: string, val: string) => setInfo(prev=>({...prev,packageDetails:{...prev.packageDetails,[field]:val}}));
  const setPhone = (section: 'from'|'to', field: 'prefix'|'number', val: string) => setInfo(prev=>{const n={...prev};n[section].phone[field]=val;return n;});

  const handlePrint = () => { addShippingLog({orderId:info.orderId,from:`${info.from.name}, ${info.from.city}`,to:`${info.to.name}, ${info.to.city}`,trackingNumber:info.packageDetails.trackingNumber}); window.print(); };

  const filteredLogs = useMemo(()=>(shippingLogs||[]).filter((l:any)=>{const q=logSearch.toLowerCase();return !q||l.orderId?.toLowerCase().includes(q)||l.to?.toLowerCase().includes(q);}),[shippingLogs,logSearch]);

  const stats = useMemo(()=>({
    total:(shippingLogs||[]).length,
    thisMonth:(shippingLogs||[]).filter((l:any)=>new Date(l.createdAt||0).getMonth()===new Date().getMonth()).length,
    ready:(orders||[]).filter((o:any)=>o.status==='packing').length,
  }),[shippingLogs,orders]);

  function AddressForm({section,addr}:{section:'from'|'to',addr:AddressInfo}) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Name</Label><Input className="h-8 text-sm" value={addr.name} onChange={e=>setAddr(section,'name',e.target.value)}/></div><div><Label className="text-xs">Company</Label><Input className="h-8 text-sm" value={addr.company} onChange={e=>setAddr(section,'company',e.target.value)}/></div></div>
        <div><Label className="text-xs">Address Line 1</Label><Input className="h-8 text-sm" value={addr.line1} onChange={e=>setAddr(section,'line1',e.target.value)}/></div>
        <div className="flex items-center gap-2"><Switch checked={addr.hasLine2} onCheckedChange={v=>setAddr(section,'hasLine2',v)}/><Label className="text-xs">Address Line 2</Label></div>
        {addr.hasLine2&&<Input className="h-8 text-sm" value={addr.line2} onChange={e=>setAddr(section,'line2',e.target.value)}/>}
        <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">City</Label><Input className="h-8 text-sm" value={addr.city} onChange={e=>setAddr(section,'city',e.target.value)}/></div><div><Label className="text-xs">State</Label><Input className="h-8 text-sm" value={addr.state} onChange={e=>setAddr(section,'state',e.target.value)}/></div></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">ZIP</Label><Input className="h-8 text-sm" value={addr.zip} onChange={e=>setAddr(section,'zip',e.target.value)}/></div>
          <div><Label className="text-xs">Country</Label><Select value={addr.country} onValueChange={v=>setAddr(section,'country',v)}><SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger><SelectContent>{COUNTRIES.map(c=><SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div><Label className="text-xs">Phone</Label>
          <div className="flex gap-2"><Select value={addr.phone.prefix} onValueChange={v=>setPhone(section,'prefix',v)}><SelectTrigger className="h-8 w-32 text-sm"><SelectValue/></SelectTrigger><SelectContent>{PHONE_PREFIXES.map(p=><SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select><Input className="h-8 text-sm" value={addr.phone.number} onChange={e=>setPhone(section,'number',e.target.value)}/></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-lg"><PackageCheck className="text-primary h-6 w-6"/></div>
          <div><h1 className="text-2xl font-bold">Order Dispatch</h1><p className="text-sm text-muted-foreground">Generate and print shipping labels</p></div>
        </div>
        <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Save &amp; Print Label</Button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{l:'Ready to Ship',v:stats.ready,Icon:Package},{l:'Dispatched Total',v:stats.total,Icon:TruckIcon},{l:'This Month',v:stats.thisMonth,Icon:CheckCircle2},{l:'Orders Packing',v:stats.ready,Icon:Clock}].map(s=>(
          <Card key={s.l}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{s.l}</CardTitle><s.Icon className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{s.v}</div></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle>Select Order</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button size="sm" variant={mode==='list'?'default':'outline'} onClick={()=>setMode('list')}>From List</Button>
                <Button size="sm" variant={mode==='custom'?'default':'outline'} onClick={()=>setMode('custom')}>Custom</Button>
              </div>
              {mode==='list'&&<Select value={selectedOrderId} onValueChange={setSelectedOrderId}><SelectTrigger><SelectValue placeholder="Select order"/></SelectTrigger><SelectContent>{orderOptions.map((o:any)=><SelectItem key={o.orderId} value={o.orderId}>{o.orderId} - {o.toName}</SelectItem>)}</SelectContent></Select>}
              {mode==='custom'&&<p className="text-sm text-muted-foreground">Fill in the shipping details below manually.</p>}
            </CardContent>
          </Card>

          <Accordion type="multiple" defaultValue={['recipient','package']} className="space-y-2">
            <Card><AccordionItem value="sender" className="border-0"><AccordionTrigger className="px-6 py-4 font-semibold">Sender Information</AccordionTrigger><AccordionContent className="px-6 pb-6"><AddressForm section="from" addr={info.from}/></AccordionContent></AccordionItem></Card>
            <Card><AccordionItem value="recipient" className="border-0"><AccordionTrigger className="px-6 py-4 font-semibold">Recipient Information</AccordionTrigger><AccordionContent className="px-6 pb-6"><AddressForm section="to" addr={info.to}/></AccordionContent></AccordionItem></Card>
            <Card><AccordionItem value="package" className="border-0"><AccordionTrigger className="px-6 py-4 font-semibold">Package Details</AccordionTrigger><AccordionContent className="px-6 pb-6">
              <div className="space-y-3">
                <div><Label className="text-xs">Tracking #</Label><Input className="h-8 text-sm" value={info.packageDetails.trackingNumber} onChange={e=>setPkg('trackingNumber',e.target.value)}/></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Weight</Label><Input className="h-8 text-sm" value={info.packageDetails.weight} onChange={e=>setPkg('weight',e.target.value)}/></div>
                  <div><Label className="text-xs">Unit</Label><Select value={info.packageDetails.weightUnit} onValueChange={v=>setPkg('weightUnit',v)}><SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="kg">kg</SelectItem><SelectItem value="lb">lb</SelectItem></SelectContent></Select></div>
                </div>
                <div><Label className="text-xs">Dimensions (L×W×H)</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Input placeholder="L" className="h-8 text-sm" value={info.packageDetails.length} onChange={e=>setPkg('length',e.target.value)}/>
                    <Input placeholder="W" className="h-8 text-sm" value={info.packageDetails.width} onChange={e=>setPkg('width',e.target.value)}/>
                    <div className="flex gap-1"><Input placeholder="H" className="h-8 text-sm" value={info.packageDetails.height} onChange={e=>setPkg('height',e.target.value)}/><Select value={info.packageDetails.dimensionUnit} onValueChange={v=>setPkg('dimensionUnit',v)}><SelectTrigger className="h-8 text-sm w-16"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="cm">cm</SelectItem><SelectItem value="in">in</SelectItem></SelectContent></Select></div>
                  </div>
                </div>
                <div><Label className="text-xs">Contents</Label><Input className="h-8 text-sm" value={info.packageDetails.contents} onChange={e=>setPkg('contents',e.target.value)}/></div>
              </div>
            </AccordionContent></AccordionItem></Card>
          </Accordion>
        </div>

        {/* Right: Preview + Log */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Shipping Label Preview</CardTitle></CardHeader>
            <CardContent className="bg-muted/50 rounded-lg p-6"><ShippingLabelPreview info={info}/></CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Shipping Log</CardTitle>
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder="Search logs..." className="pl-9 h-8 w-48 text-sm" value={logSearch} onChange={e=>setLogSearch(e.target.value)}/></div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>To</TableHead><TableHead>Tracking #</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredLogs.length>0 ? filteredLogs.map((l:any)=>(
                    <TableRow key={l.id}><TableCell className="font-medium">{l.orderId}</TableCell><TableCell>{l.to}</TableCell><TableCell className="font-mono text-xs">{l.trackingNumber||'—'}</TableCell><TableCell className="text-sm">{l.createdAt?format(new Date(l.createdAt),'dd-MM-yyyy'):'—'}</TableCell></TableRow>
                  )) : <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No shipping logs yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
