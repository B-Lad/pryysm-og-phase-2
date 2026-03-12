'use client';

import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import type { InventoryItem } from '@/hooks/use-workspace';
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
import { Box, LayoutDashboard, List, PlusCircle, Repeat, Search, Edit, Trash2, Package, Cpu, Wrench, Shapes } from 'lucide-react';
import { cn } from '@/lib/utils';

type StockStatus = 'In Stock'|'Low Stock'|'Out of Stock';
type Category = 'Packing Material'|'Electronics'|'Tools'|'Miscellaneous';
const statusBadge: Record<string,string> = { 'In Stock':'bg-green-100 text-green-800', 'Low Stock':'bg-yellow-100 text-yellow-800', 'Out of Stock':'bg-red-100 text-red-800' };
const statusBorder: Record<string,string> = { 'In Stock':'border-green-500', 'Low Stock':'border-yellow-400', 'Out of Stock':'border-red-500' };
const CATEGORIES: Category[] = ['Packing Material','Electronics','Tools','Miscellaneous'];
const CatIcons: Record<string,React.ElementType> = { 'Packing Material':Package, 'Electronics':Cpu, 'Tools':Wrench, 'Miscellaneous':Shapes };

export default function InventoryPage() {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, useInventoryItem } = useWorkspace();
  const [tab, setTab] = useState('dashboard');
  const [search, setSearch] = useState(''); const [catFilter, setCatFilter] = useState<Category|'all'>('all'); const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editItem, setEditItem] = useState<InventoryItem|null>(null);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [useQty, setUseQty] = useState<Record<string,string>>({});
  const [form, setForm] = useState({name:'',category:'Miscellaneous' as Category,quantity:'0',minStock:'5',location:'',description:''});
  const sf = (k: string, v: string) => setForm(f=>({...f,[k]:v}));

  const dashStats = useMemo(()=>({
    total:inventory.length,
    inStock:inventory.filter(i=>i.status==='In Stock').length,
    lowStock:inventory.filter(i=>i.status==='Low Stock').length,
    outOfStock:inventory.filter(i=>i.status==='Out of Stock').length,
    byCategory: CATEGORIES.map(c=>({cat:c,count:inventory.filter(i=>i.category===c).length}))
  }),[inventory]);

  const filtered = useMemo(()=>inventory.filter(i=>{
    const ms=search.toLowerCase();
    return (i.name.toLowerCase().includes(ms)||(i.description||'').toLowerCase().includes(ms))&&
      (catFilter==='all'||i.category===catFilter)&&
      (statusFilter==='all'||i.status===statusFilter);
  }),[inventory,search,catFilter,statusFilter]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addInventoryItem({name:form.name,category:form.category,quantity:+form.quantity,minStock:+form.minStock,minOrder:Math.max(1,+form.minStock),location:form.location,description:form.description});
    setForm({name:'',category:'Miscellaneous',quantity:'0',minStock:'5',location:'',description:''});
    setTab('inventory');
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if(editItem) { updateInventoryItem(editItem); setEditItem(null); }
  };

  const handleUse = (id: string) => {
    const qty = parseInt(useQty[id]||'1');
    if(qty>0) { useInventoryItem(id,qty); setUseQty(prev=>({...prev,[id]:''})); }
  };

  const TABS = [{id:'dashboard',label:'Dashboard',Icon:LayoutDashboard},{id:'inventory',label:'Inventory',Icon:List},{id:'add-item',label:'Add Item',Icon:PlusCircle},{id:'reorder',label:'Reorder',Icon:Repeat}];

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      <header className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg"><Box className="text-primary h-6 w-6"/></div>
        <div><h1 className="text-2xl font-bold">Spares and Stores</h1><p className="text-sm text-muted-foreground">Manage spare parts and store items</p></div>
      </header>

      <div className="flex gap-1 flex-wrap border-b">
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab===t.id?'border-primary text-primary':'border-transparent text-muted-foreground hover:text-foreground'}`}><t.Icon className="h-4 w-4"/>{t.label}</button>)}
      </div>

      {tab==='dashboard'&&(
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[{l:'Total Items',v:dashStats.total},{l:'In Stock',v:dashStats.inStock,green:true},{l:'Low Stock',v:dashStats.lowStock,yellow:true},{l:'Out of Stock',v:dashStats.outOfStock,red:true}].map(s=>(
              <Card key={s.l}><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{s.l}</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.red?'text-destructive':s.yellow?'text-yellow-600':s.green?'text-green-600':''}`}>{s.v}</div></CardContent></Card>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {dashStats.byCategory.map(({cat,count})=>{
              const Icon = CatIcons[cat]||Box;
              return <Card key={cat}><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Icon className="h-4 w-4"/>{cat}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{count}</div></CardContent></Card>;
            })}
          </div>
          <Card>
            <CardHeader><CardTitle>Low Stock Alert</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {inventory.filter(i=>i.status==='Low Stock'||i.status==='Out of Stock').slice(0,10).map(i=>(
                  <div key={i.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div><p className="font-medium">{i.name}</p><p className="text-sm text-muted-foreground">{i.category}</p></div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{i.quantity} units</span>
                      <Badge className={statusBadge[i.status]||''}>{i.status}</Badge>
                    </div>
                  </div>
                ))}
                {inventory.filter(i=>i.status==='Low Stock'||i.status==='Out of Stock').length===0&&<p className="text-center text-muted-foreground py-4">All stock levels are healthy!</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab==='inventory'&&(
        <div className="space-y-4">
          <Card><CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/><Input placeholder="Search items..." className="pl-10" value={search} onChange={e=>setSearch(e.target.value)}/></div>
              <Select value={catFilter} onValueChange={(v)=>setCatFilter(v as any)}><SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories"/></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses"/></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="In Stock">In Stock</SelectItem><SelectItem value="Low Stock">Low Stock</SelectItem><SelectItem value="Out of Stock">Out of Stock</SelectItem></SelectContent></Select>
            </div>
          </CardContent></Card>
          <Card>
            <CardHeader><CardTitle>Inventory ({filtered.length})</CardTitle></CardHeader>
            <CardContent><div className="overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Location</TableHead><TableHead>Qty</TableHead><TableHead>Min Stock</TableHead><TableHead>Status</TableHead><TableHead>Use</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map(item=>(
                  <TableRow key={item.id}>
                    <TableCell><div className="font-medium">{item.name}</div>{item.description&&<div className="text-xs text-muted-foreground">{item.description}</div>}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.location||'—'}</TableCell>
                    <TableCell className="font-medium">{item.quantity}</TableCell>
                    <TableCell>{item.minStock}</TableCell>
                    <TableCell><Badge className={statusBadge[item.status]||'bg-gray-100'}>{item.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Input type="number" min="1" placeholder="Qty" className="h-8 w-16" value={useQty[item.id]||''} onChange={e=>setUseQty(prev=>({...prev,[item.id]:e.target.value}))}/>
                        <Button size="sm" variant="outline" className="h-8" onClick={()=>handleUse(item.id)}>Use</Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>setEditItem(item)}><Edit className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={()=>setDeleteId(item.id)}><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div></CardContent>
          </Card>
        </div>
      )}

      {tab==='add-item'&&(
        <Card>
          <CardHeader><CardTitle>Add New Item</CardTitle><CardDescription>Add a new spare part or store item</CardDescription></CardHeader>
          <CardContent><form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e=>sf('name',e.target.value)} required/></div>
              <div className="space-y-2"><Label>Category *</Label><Select value={form.category} onValueChange={v=>sf('category',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Quantity *</Label><Input type="number" min="0" value={form.quantity} onChange={e=>sf('quantity',e.target.value)} required/></div>
              <div className="space-y-2"><Label>Min Stock Level</Label><Input type="number" min="0" value={form.minStock} onChange={e=>sf('minStock',e.target.value)}/></div>
              <div className="space-y-2"><Label>Location</Label><Input placeholder="e.g. Shelf A1" value={form.location} onChange={e=>sf('location',e.target.value)}/></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e=>sf('description',e.target.value)}/></div>
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={()=>setTab('inventory')}>Cancel</Button><Button type="submit">Add Item</Button></div>
          </form></CardContent>
        </Card>
      )}

      {tab==='reorder'&&(
        <Card>
          <CardHeader><CardTitle>Reorder Management</CardTitle><CardDescription>Items needing restock</CardDescription></CardHeader>
          <CardContent><Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Current Qty</TableHead><TableHead>Min Stock</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {inventory.filter(i=>i.status==='Low Stock'||i.status==='Out of Stock').map(i=>(
                <TableRow key={i.id}><TableCell className="font-medium">{i.name}</TableCell><TableCell>{i.category}</TableCell><TableCell className="font-bold text-destructive">{i.quantity}</TableCell><TableCell>{i.minStock}</TableCell><TableCell><Badge className={statusBadge[i.status]||''}>{i.status}</Badge></TableCell></TableRow>
              ))}
              {inventory.filter(i=>i.status==='Low Stock'||i.status==='Out of Stock').length===0&&<TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">All stock levels are healthy!</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={()=>setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
        {editItem&&<form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={editItem.name} onChange={e=>setEditItem({...editItem,name:e.target.value})}/></div>
            <div className="space-y-2"><Label>Category</Label><Select value={editItem.category} onValueChange={v=>setEditItem({...editItem,category:v as Category})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={editItem.quantity} onChange={e=>setEditItem({...editItem,quantity:+e.target.value})}/></div>
            <div className="space-y-2"><Label>Min Stock</Label><Input type="number" value={editItem.minStock} onChange={e=>setEditItem({...editItem,minStock:+e.target.value})}/></div>
            <div className="space-y-2 col-span-2"><Label>Location</Label><Input value={editItem.location||''} onChange={e=>setEditItem({...editItem,location:e.target.value})}/></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={()=>setEditItem(null)}>Cancel</Button><Button type="submit">Save Changes</Button></DialogFooter>
        </form>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId!==null} onOpenChange={()=>setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Item</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={()=>{if(deleteId){deleteInventoryItem(deleteId);setDeleteId(null)}}}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
