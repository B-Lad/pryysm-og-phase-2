'use client';

import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import type { Spool, Resin, Powder, MaterialStatus, Currency } from '@/hooks/use-workspace';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter as ModalFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Pencil, Repeat, Layers3, Droplet, Sparkles, LayoutDashboard, ClipboardList } from 'lucide-react';

type MatStatus = MaterialStatus;
const statusColors: Record<string, string> = { New:'bg-sky-100 text-sky-800', Active:'bg-green-100 text-green-800', Low:'bg-yellow-100 text-yellow-800', Critical:'bg-red-100 text-red-800', Empty:'bg-gray-100 text-gray-800' };
const exchangeRates: Record<string, number> = { USD:1, EUR:0.93, AED:3.67, INR:83.33 };
const currencySymbols: Record<string, string> = { USD:'$', EUR:'€', AED:'AED', INR:'₹' };

function calcStatus(used: number, total: number): MatStatus {
  if (total <= 0 || used >= total) return 'Empty';
  const r = ((total - used) / total) * 100;
  if (r <= 10) return 'Critical';
  if (r <= 30) return 'Low';
  if (used === 0) return 'New';
  return 'Active';
}

export default function RawMaterialPage() {
  const { spools, resins, powders, addSpool, deleteSpool, logSpoolUsage, addResin, deleteResin, logResinUsage, addPowder, deletePowder, logPowderUsage } = useWorkspace();
  const [tab, setTab] = useState('dashboard');
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('USD');

  // Modals: null = closed, 'new' = new, or item id = edit
  const [spoolModal, setSpoolModal] = useState<{open:boolean; item:Spool|null}>({open:false,item:null});
  const [resinModal, setResinModal] = useState<{open:boolean; item:Resin|null}>({open:false,item:null});
  const [powderModal, setPowderModal] = useState<{open:boolean; item:Powder|null}>({open:false,item:null});
  const [spoolSearch, setSpoolSearch] = useState('');
  const [resinSearch, setResinSearch] = useState('');
  const [powderSearch, setPowderSearch] = useState('');

  const fmtCurrency = (amt: number) => `${currencySymbols[displayCurrency]}${(amt * exchangeRates[displayCurrency]).toFixed(2)}`;

  const dashStats = useMemo(() => ({
    spools: {
      total: spools.length,
      active: spools.filter(s => s.status === 'Active').length,
      low: spools.filter(s => s.status === 'Low').length,
      critical: spools.filter(s => s.status === 'Critical').length,
      value: spools.reduce((a, s) => a + s.price * exchangeRates[displayCurrency], 0),
    },
    resins: {
      total: resins.length,
      active: resins.filter(r => r.status === 'Active').length,
      low: resins.filter(r => r.status === 'Low').length,
      critical: resins.filter(r => r.status === 'Critical').length,
      value: resins.reduce((a, r) => a + r.price * exchangeRates[displayCurrency], 0),
    },
    powders: {
      total: powders.length,
      active: powders.filter(p => p.status === 'Active').length,
      low: powders.filter(p => p.status === 'Low').length,
      critical: powders.filter(p => p.status === 'Critical').length,
      value: powders.reduce((a, p) => a + p.price * exchangeRates[displayCurrency], 0),
    },
  }), [spools, resins, powders, displayCurrency]);

  const filteredSpools = useMemo(() => spools.filter(s =>
    !spoolSearch || s.name.toLowerCase().includes(spoolSearch.toLowerCase()) || s.brand.toLowerCase().includes(spoolSearch.toLowerCase())
  ), [spools, spoolSearch]);

  const filteredResins = useMemo(() => resins.filter(r =>
    !resinSearch || r.name.toLowerCase().includes(resinSearch.toLowerCase()) || r.brand.toLowerCase().includes(resinSearch.toLowerCase())
  ), [resins, resinSearch]);

  const filteredPowders = useMemo(() => powders.filter(p =>
    !powderSearch || p.name.toLowerCase().includes(powderSearch.toLowerCase()) || p.brand.toLowerCase().includes(powderSearch.toLowerCase())
  ), [powders, powderSearch]);

  const lowStockItems = useMemo(() => [
    ...spools.filter(s => s.status === 'Low' || s.status === 'Critical').map(s => ({ id: `s${s.id}`, name: s.name, type: 'Filament', status: s.status, remaining: `${s.weight - s.used}g / ${s.weight}g` })),
    ...resins.filter(r => r.status === 'Low' || r.status === 'Critical').map(r => ({ id: `r${r.id}`, name: r.name, type: 'Resin', status: r.status, remaining: `${r.volume - r.used}ml / ${r.volume}ml` })),
    ...powders.filter(p => p.status === 'Low' || p.status === 'Critical').map(p => ({ id: `p${p.id}`, name: p.name, type: 'Powder', status: p.status, remaining: `${(p.weight - p.used).toFixed(2)}kg / ${p.weight.toFixed(2)}kg` })),
  ], [spools, resins, powders]);

  const reorderItems = useMemo(() => [
    ...spools.filter(s => s.status === 'Low' || s.status === 'Critical' || s.status === 'Empty').map(s => ({ id: `s${s.id}`, name: s.name, type: 'Filament', status: s.status, min: `${s.minStock}g`, cur: `${s.weight - s.used}g` })),
    ...resins.filter(r => r.status === 'Low' || r.status === 'Critical' || r.status === 'Empty').map(r => ({ id: `r${r.id}`, name: r.name, type: 'Resin', status: r.status, min: `${r.minStock}ml`, cur: `${r.volume - r.used}ml` })),
    ...powders.filter(p => p.status === 'Low' || p.status === 'Critical' || p.status === 'Empty').map(p => ({ id: `p${p.id}`, name: p.name, type: 'Powder', status: p.status, min: `${p.minStock}kg`, cur: `${(p.weight - p.used).toFixed(2)}kg` })),
  ], [spools, resins, powders]);

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'filaments', label: 'Filaments', Icon: Layers3 },
    { id: 'resins', label: 'Resins', Icon: Droplet },
    { id: 'powders', label: 'Powders', Icon: Sparkles },
    { id: 'reorder', label: 'Reorder', Icon: Repeat },
  ];

  const handleSaveSpool = (data: Omit<Spool, 'id' | 'spoolId' | 'status'>) => {
    addSpool(data);
    setSpoolModal({ open: false, item: null });
  };

  const handleSaveResin = (data: Omit<Resin, 'id' | 'resinId' | 'status'>) => {
    addResin(data);
    setResinModal({ open: false, item: null });
  };

  const handleSavePowder = (data: Omit<Powder, 'id' | 'powderId' | 'status'>) => {
    addPowder(data);
    setPowderModal({ open: false, item: null });
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-lg"><ClipboardList className="text-primary h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Raw Material Inventory</h1>
            <p className="text-sm text-muted-foreground">Manage all your 3D printing materials</p>
          </div>
        </div>
        <div className="flex items-center bg-card border rounded-full p-1 shadow-sm">
          {(['USD', 'EUR', 'AED', 'INR'] as Currency[]).map(c => (
            <Button key={c} variant={displayCurrency === c ? 'default' : 'ghost'} size="sm" onClick={() => setDisplayCurrency(c)} className="rounded-full px-4">{c}</Button>
          ))}
        </div>
      </header>

      {/* Tab Nav */}
      <div className="flex gap-1 flex-wrap border-b">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <t.Icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Filaments', stats: dashStats.spools },
              { label: 'Resins', stats: dashStats.resins },
              { label: 'Powders', stats: dashStats.powders },
            ].map(({ label, stats }) => (
              <Card key={label}>
                <CardHeader><CardTitle>{label} Overview</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Active:</span><span className="font-medium text-green-600">{stats.active}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Low:</span><span className="font-medium text-yellow-600">{stats.low}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Critical:</span><span className="font-medium text-red-600">{stats.critical}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Value:</span><span className="font-medium">{currencySymbols[displayCurrency]}{stats.value.toFixed(0)}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle>Low / Critical Stock Alert</CardTitle><CardDescription>Items that need attention</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Remaining</TableHead></TableRow></TableHeader>
                <TableBody>
                  {lowStockItems.length > 0 ? lowStockItems.slice(0, 10).map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                      <TableCell><Badge className={statusColors[item.status] || 'bg-gray-100'}>{item.status}</Badge></TableCell>
                      <TableCell>{item.remaining}</TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">All stock levels are healthy!</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filaments Tab */}
      {tab === 'filaments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { l: 'Total Spools', v: dashStats.spools.total },
              { l: 'Total Value', v: `${currencySymbols[displayCurrency]}${dashStats.spools.value.toFixed(0)}` },
              { l: 'Active', v: dashStats.spools.active },
              { l: 'Critical', v: dashStats.spools.critical, red: true },
            ].map(s => (
              <Card key={s.l}><CardHeader><CardTitle className="text-sm font-medium">{s.l}</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.red ? 'text-destructive' : ''}`}>{s.v}</div></CardContent></Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Filament Spools</CardTitle>
                <Button onClick={() => setSpoolModal({ open: true, item: null })}><Plus className="mr-2 h-4 w-4" />Add Spool</Button>
              </div>
              <Input placeholder="Search name or brand..." value={spoolSearch} onChange={e => setSpoolSearch(e.target.value)} className="mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSpools.map(s => (
                  <Card key={s.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border-2 flex-shrink-0" style={{ backgroundColor: s.color }} />
                          <div><CardTitle className="text-base">{s.name}</CardTitle><CardDescription>{s.brand}</CardDescription></div>
                        </div>
                        <Badge className={statusColors[s.status] || ''}>{s.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                      <div className="text-xs text-muted-foreground flex justify-between"><span>Material: <strong>{s.material}</strong></span></div>
                      <div>
                        <Label className="text-xs">Usage</Label>
                        <Progress value={s.weight > 0 ? ((s.weight - s.used) / s.weight) * 100 : 0} className="h-3" />
                        <p className="text-xs text-right text-muted-foreground">Remaining: {s.weight - s.used}g / {s.weight}g</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Price: {fmtCurrency(s.price)}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSpool(s.id)}><Trash2 className="h-4 w-4" /></Button>
                    </CardFooter>
                  </Card>
                ))}
                {filteredSpools.length === 0 && <div className="col-span-full text-center text-muted-foreground py-8">No filaments found.</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resins Tab */}
      {tab === 'resins' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { l: 'Total Bottles', v: dashStats.resins.total },
              { l: 'Total Value', v: `${currencySymbols[displayCurrency]}${dashStats.resins.value.toFixed(0)}` },
              { l: 'Active', v: dashStats.resins.active },
              { l: 'Critical', v: dashStats.resins.critical, red: true },
            ].map(s => (
              <Card key={s.l}><CardHeader><CardTitle className="text-sm font-medium">{s.l}</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.red ? 'text-destructive' : ''}`}>{s.v}</div></CardContent></Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Resins</CardTitle>
                <Button onClick={() => setResinModal({ open: true, item: null })}><Plus className="mr-2 h-4 w-4" />Add Resin</Button>
              </div>
              <Input placeholder="Search name or brand..." value={resinSearch} onChange={e => setResinSearch(e.target.value)} className="mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResins.map(r => (
                  <Card key={r.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border-2 flex-shrink-0" style={{ backgroundColor: r.color }} />
                          <div><CardTitle className="text-base">{r.name}</CardTitle><CardDescription>{r.brand}</CardDescription></div>
                        </div>
                        <Badge className={statusColors[r.status] || ''}>{r.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                      <div className="text-xs text-muted-foreground">Type: <strong>{r.type}</strong></div>
                      <div>
                        <Label className="text-xs">Usage</Label>
                        <Progress value={r.volume > 0 ? ((r.volume - r.used) / r.volume) * 100 : 0} className="h-3" />
                        <p className="text-xs text-right text-muted-foreground">Remaining: {r.volume - r.used}ml / {r.volume}ml</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Price: {fmtCurrency(r.price)}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteResin(r.id)}><Trash2 className="h-4 w-4" /></Button>
                    </CardFooter>
                  </Card>
                ))}
                {filteredResins.length === 0 && <div className="col-span-full text-center text-muted-foreground py-8">No resins found.</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Powders Tab */}
      {tab === 'powders' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { l: 'Total Batches', v: dashStats.powders.total },
              { l: 'Total Value', v: `${currencySymbols[displayCurrency]}${dashStats.powders.value.toFixed(0)}` },
              { l: 'Active', v: dashStats.powders.active },
              { l: 'Critical', v: dashStats.powders.critical, red: true },
            ].map(s => (
              <Card key={s.l}><CardHeader><CardTitle className="text-sm font-medium">{s.l}</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.red ? 'text-destructive' : ''}`}>{s.v}</div></CardContent></Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Powders</CardTitle>
                <Button onClick={() => setPowderModal({ open: true, item: null })}><Plus className="mr-2 h-4 w-4" />Add Powder</Button>
              </div>
              <Input placeholder="Search name or brand..." value={powderSearch} onChange={e => setPowderSearch(e.target.value)} className="mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPowders.map(p => (
                  <Card key={p.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-10 w-10 text-muted-foreground flex-shrink-0" />
                          <div><CardTitle className="text-base">{p.name}</CardTitle><CardDescription>{p.brand}</CardDescription></div>
                        </div>
                        <Badge className={statusColors[p.status] || ''}>{p.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                      <div className="text-xs text-muted-foreground">Material: <strong>{p.material}</strong></div>
                      <div>
                        <Label className="text-xs">Usage</Label>
                        <Progress value={p.weight > 0 ? ((p.weight - p.used) / p.weight) * 100 : 0} className="h-3" />
                        <p className="text-xs text-right text-muted-foreground">Remaining: {(p.weight - p.used).toFixed(2)}kg / {p.weight.toFixed(2)}kg</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Price: {fmtCurrency(p.price)}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deletePowder(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </CardFooter>
                  </Card>
                ))}
                {filteredPowders.length === 0 && <div className="col-span-full text-center text-muted-foreground py-8">No powders found.</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reorder Tab */}
      {tab === 'reorder' && (
        <Card>
          <CardHeader><CardTitle>Reorder Management</CardTitle><CardDescription>Items flagged for reorder or running low</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Min Stock</TableHead><TableHead>Current</TableHead></TableRow></TableHeader>
              <TableBody>
                {reorderItems.length > 0 ? reorderItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                    <TableCell><Badge className={statusColors[item.status] || 'bg-gray-100'}>{item.status}</Badge></TableCell>
                    <TableCell>{item.min}</TableCell>
                    <TableCell className="font-medium text-destructive">{item.cur}</TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">All stock levels are healthy!</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Spool Modal */}
      <SpoolModal isOpen={spoolModal.open} onClose={() => setSpoolModal({ open: false, item: null })} onSave={handleSaveSpool} />
      <ResinModal isOpen={resinModal.open} onClose={() => setResinModal({ open: false, item: null })} onSave={handleSaveResin} />
      <PowderModal isOpen={powderModal.open} onClose={() => setPowderModal({ open: false, item: null })} onSave={handleSavePowder} />
    </div>
  );
}

// --- Sub-modals ---
type SpoolForm = Omit<Spool, 'id' | 'spoolId' | 'status' | 'assignedToPrinterId'>;
function SpoolModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (d: SpoolForm) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [f, setF] = React.useState<SpoolForm>({ name: '', brand: '', color: '#3B82F6', material: 'PLA', finish: 'Matte', weight: 1000, used: 0, price: 0, currency: 'USD', purchaseDate: today, minOrder: 5, location: '', minStock: 5 } as any);
  const ch = (k: keyof SpoolForm, v: any) => setF(prev => ({ ...prev, [k]: v }));
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>Add New Spool</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave(f); }} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={f.name} onChange={e => ch('name', e.target.value)} required /></div>
            <div className="space-y-2"><Label>Brand</Label><Input value={f.brand} onChange={e => ch('brand', e.target.value)} required /></div>
            <div className="space-y-2"><Label>Material</Label><Input value={f.material} onChange={e => ch('material', e.target.value)} required /></div>
            <div className="space-y-2"><Label>Finish</Label><Input value={(f as any).finish || ''} onChange={e => ch('finish' as any, e.target.value)} /></div>
            <div className="space-y-2 col-span-2"><Label>Color</Label><div className="flex gap-2"><Input type="color" value={f.color} onChange={e => ch('color', e.target.value)} className="h-10 w-16 p-1" /><Input value={f.color} onChange={e => ch('color', e.target.value)} placeholder="#000000" /></div></div>
            <div className="space-y-2"><Label>Weight (g)</Label><Input type="number" value={f.weight} onChange={e => ch('weight', +e.target.value)} required /></div>
            <div className="space-y-2"><Label>Price</Label><Input type="number" step="0.01" value={f.price} onChange={e => ch('price', +e.target.value)} required /></div>
          </div>
          <ModalFooter><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Add Spool</Button></ModalFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ResinForm = Omit<Resin, 'id' | 'resinId' | 'status' | 'assignedToPrinterId'>;
function ResinModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (d: ResinForm) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [f, setF] = React.useState<ResinForm>({ name: '', brand: '', color: '#808080', type: 'Standard', volume: 1000, used: 0, price: 0, currency: 'USD', purchaseDate: today, minOrder: 4, location: '', minStock: 2 });
  const ch = (k: keyof ResinForm, v: any) => setF(prev => ({ ...prev, [k]: v }));
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>Add New Resin</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave(f); }} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={f.name} onChange={e => ch('name', e.target.value)} required /></div>
            <div className="space-y-2"><Label>Brand</Label><Input value={f.brand} onChange={e => ch('brand', e.target.value)} required /></div>
            <div className="space-y-2"><Label>Type</Label><Input value={f.type} onChange={e => ch('type', e.target.value)} required /></div>
            <div className="space-y-2"><Label>Volume (ml)</Label><Input type="number" value={f.volume} onChange={e => ch('volume', +e.target.value)} required /></div>
            <div className="space-y-2 col-span-2"><Label>Color</Label><div className="flex gap-2"><Input type="color" value={f.color} onChange={e => ch('color', e.target.value)} className="h-10 w-16 p-1" /><Input value={f.color} onChange={e => ch('color', e.target.value)} /></div></div>
            <div className="space-y-2"><Label>Price</Label><Input type="number" step="0.01" value={f.price} onChange={e => ch('price', +e.target.value)} required /></div>
          </div>
          <ModalFooter><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Add Resin</Button></ModalFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type PowderForm = Omit<Powder, 'id' | 'powderId' | 'status' | 'assignedToPrinterId'>;
function PowderModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (d: PowderForm) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [f, setF] = React.useState<PowderForm>({ name: '', brand: '', material: 'PA12', weight: 10, used: 0, price: 0, currency: 'USD', purchaseDate: today, minOrder: 2, location: '', minStock: 2 });
  const ch = (k: keyof PowderForm, v: any) => setF(prev => ({ ...prev, [k]: v }));
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>Add New Powder</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave(f); }} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={f.name} onChange={e => ch('name', e.target.value)} required /></div>
            <div className="space-y-2"><Label>Brand</Label><Input value={f.brand} onChange={e => ch('brand', e.target.value)} required /></div>
            <div className="space-y-2"><Label>Material</Label><Input value={f.material} onChange={e => ch('material', e.target.value)} required /></div>
            <div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" step="0.1" value={f.weight} onChange={e => ch('weight', +e.target.value)} required /></div>
            <div className="space-y-2"><Label>Price</Label><Input type="number" step="0.01" value={f.price} onChange={e => ch('price', +e.target.value)} required /></div>
          </div>
          <ModalFooter><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Add Powder</Button></ModalFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
