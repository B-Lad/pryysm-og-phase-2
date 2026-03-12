'use client';

import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import type { Customer } from '@/hooks/use-workspace';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PlusCircle, Search, Users, FileText, ShoppingCart, Receipt, Edit, Eye, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type DocType = 'All'|'Quotation'|'Purchase Order'|'Tax Invoice';
const docTypeIcons: Record<string,React.ElementType> = { Quotation:FileText, 'Purchase Order':ShoppingCart, 'Tax Invoice':Receipt };

export default function CustomersPage() {
  const { customers, documents: allDocuments, addCustomer, updateCustomer, deleteCustomer, orders } = useWorkspace() as any;
  const [isAdding, setIsAdding] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer|null>(null);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer|null>(null);
  const [docTypeFilter, setDocTypeFilter] = useState<DocType>('All');
  const [docSearch, setDocSearch] = useState('');
  const [custSearch, setCustSearch] = useState('');
  const [addForm, setAddForm] = useState({name:'',email:'',phone:'',company:'',address:'',taxId:''});
  const saf = (k: string, v: string) => setAddForm(f=>({...f,[k]:v}));

  const documents = useMemo(()=>{
    let docs = allDocuments||[];
    if(selectedCustomer) docs = docs.filter((d:any)=>d.customerId===selectedCustomer.id);
    if(docTypeFilter!=='All') docs = docs.filter((d:any)=>d.type===docTypeFilter);
    if(docSearch) { const q=docSearch.toLowerCase(); docs=docs.filter((d:any)=>d.orderNumber.toLowerCase().includes(q)||(customers.find((c:Customer)=>c.id===d.customerId)?.name||'').toLowerCase().includes(q)); }
    return docs;
  },[allDocuments,selectedCustomer,docTypeFilter,docSearch,customers]);

  const filteredCustomers = useMemo(()=>(customers||[]).filter((c:Customer)=>c.name.toLowerCase().includes(custSearch.toLowerCase())),[customers,custSearch]);

  const getOrderCount = (customerId: string) => (orders||[]).filter((o:any)=>o.customer===(customers||[]).find((c:Customer)=>c.id===customerId)?.name).length;
  const getTotalSpend = (customerId: string) => {
    const custName = (customers||[]).find((c:Customer)=>c.id===customerId)?.name;
    const custOrders = (orders||[]).filter((o:any)=>o.customer===custName);
    return custOrders.reduce((sum:number,o:any)=>sum+(o.items*35),0);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer({name:addForm.name,email:addForm.email,phone:addForm.phone,company:addForm.company,address:addForm.address,taxId:addForm.taxId});
    setIsAdding(false);
    setAddForm({name:'',email:'',phone:'',company:'',address:'',taxId:''});
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if(editCustomer){updateCustomer(editCustomer);setEditCustomer(null);}
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      <header className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg"><Users className="text-primary h-6 w-6"/></div>
        <div><h1 className="text-2xl font-bold">Customer Management</h1><p className="text-sm text-muted-foreground">Manage customers and their documents</p></div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document Log */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div>
                  <CardTitle>Document Log</CardTitle>
                  {selectedCustomer?(
                    <CardDescription className="flex items-center gap-2 mt-1">Showing: <Badge>{selectedCustomer.name}</Badge>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={()=>setSelectedCustomer(null)}><X className="h-4 w-4"/></Button>
                    </CardDescription>
                  ):<CardDescription>All financial documents</CardDescription>}
                </div>
                <div className="flex gap-1">
                  {(['All','Quotation','Purchase Order','Tax Invoice'] as DocType[]).map(t=>(
                    <Button key={t} size="sm" variant={docTypeFilter===t?'default':'outline'} onClick={()=>setDocTypeFilter(t)} className="text-xs">{t==='Purchase Order'?'PO':t==='Tax Invoice'?'Invoice':t}</Button>
                  ))}
                </div>
              </div>
              <div className="relative mt-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder="Search by order # or customer..." value={docSearch} onChange={e=>setDocSearch(e.target.value)} className="pl-9"/></div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Order #</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(documents||[]).length>0 ? (documents||[]).map((doc:any)=>{
                    const Icon = docTypeIcons[doc.type]||FileText;
                    const cust = (customers||[]).find((c:Customer)=>c.id===doc.customerId);
                    return (
                      <TableRow key={doc.id}>
                        <TableCell><Badge variant="outline" className="flex items-center gap-1.5 w-fit"><Icon className="h-3 w-3"/>{doc.type}</Badge></TableCell>
                        <TableCell className="font-medium">{doc.orderNumber}</TableCell>
                        <TableCell>{cust?.name||'N/A'}</TableCell>
                        <TableCell>{format(new Date(doc.date),'dd-MM-yyyy')}</TableCell>
                        <TableCell>${doc.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  }) : <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No documents found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Customer List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>All Customers</CardTitle>
              <Button size="sm" variant="outline" onClick={()=>setIsAdding(true)}><PlusCircle className="mr-2 h-4 w-4"/>Add New</Button>
            </CardHeader>
            <CardContent>
              {isAdding ? (
                <form onSubmit={handleAdd} className="space-y-3">
                  <Input placeholder="Full Name *" value={addForm.name} onChange={e=>saf('name',e.target.value)} required/>
                  <Input placeholder="Email *" type="email" value={addForm.email} onChange={e=>saf('email',e.target.value)} required/>
                  <Input placeholder="Phone" value={addForm.phone} onChange={e=>saf('phone',e.target.value)}/>
                  <Input placeholder="Company" value={addForm.company} onChange={e=>saf('company',e.target.value)}/>
                  <Input placeholder="Address" value={addForm.address} onChange={e=>saf('address',e.target.value)}/>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="flex-1">Add</Button>
                    <Button type="button" variant="outline" size="sm" onClick={()=>setIsAdding(false)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder="Search..." value={custSearch} onChange={e=>setCustSearch(e.target.value)} className="pl-9"/></div>
                  <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {filteredCustomers.map((c:Customer)=>(
                      <li key={c.id}>
                        <div role="button" tabIndex={0} className={cn('w-full text-left p-3 rounded-lg border flex justify-between items-center cursor-pointer transition-colors',selectedCustomer?.id===c.id?'bg-muted ring-2 ring-primary':'hover:bg-muted/50')} onClick={()=>setSelectedCustomer(selectedCustomer?.id===c.id?null:c)} onKeyDown={e=>e.key==='Enter'&&setSelectedCustomer(selectedCustomer?.id===c.id?null:c)}>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{c.name}</p>
                            {c.company&&<p className="text-sm text-muted-foreground truncate">{c.company}</p>}
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{getOrderCount(c.id)} orders</span>
                              <span className="text-xs text-muted-foreground">• ${getTotalSpend(c.id).toFixed(0)} spend</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Badge variant="outline" className="text-xs">{c.customerCode}</Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e=>{e.stopPropagation();setEditCustomer(c)}}><Edit className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={e=>{e.stopPropagation();setDeleteId(c.id)}}><X className="h-4 w-4"/></Button>
                          </div>
                        </div>
                      </li>
                    ))}
                    {filteredCustomers.length===0&&<p className="text-muted-foreground text-center pt-4">No customers found.</p>}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editCustomer} onOpenChange={()=>setEditCustomer(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
        {editCustomer&&<form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={editCustomer.name} onChange={e=>setEditCustomer({...editCustomer,name:e.target.value})}/></div>
            <div className="space-y-2"><Label>Email</Label><Input value={editCustomer.email} onChange={e=>setEditCustomer({...editCustomer,email:e.target.value})}/></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={editCustomer.phone||''} onChange={e=>setEditCustomer({...editCustomer,phone:e.target.value})}/></div>
            <div className="space-y-2"><Label>Company</Label><Input value={editCustomer.company||''} onChange={e=>setEditCustomer({...editCustomer,company:e.target.value})}/></div>
            <div className="space-y-2 col-span-2"><Label>Address</Label><Input value={editCustomer.address||''} onChange={e=>setEditCustomer({...editCustomer,address:e.target.value})}/></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={()=>setEditCustomer(null)}>Cancel</Button><Button type="submit">Save Changes</Button></DialogFooter>
        </form>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId!==null} onOpenChange={()=>setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Customer</AlertDialogTitle><AlertDialogDescription>This will remove the customer and all their data.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={()=>{if(deleteId){deleteCustomer?.(deleteId);setDeleteId(null)}}}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
