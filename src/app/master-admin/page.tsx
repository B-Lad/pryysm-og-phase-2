'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Shield, Users, Activity, DollarSign, TrendingUp, LogOut, Plus, Eye, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

// Mock multi-tenant data for master admin view
const MOCK_TENANTS = [
  { id: 't1', name: 'Alpha 3D Studio', email: 'admin@alpha3d.com', plan: 'Pro', status: 'active', printers: 8, orders: 243, revenue: 18450, joined: '2024-01-15' },
  { id: 't2', name: 'BetaFab Labs', email: 'ops@betafab.io', plan: 'Team', status: 'active', printers: 22, orders: 891, revenue: 67200, joined: '2023-11-20' },
  { id: 't3', name: 'Gamma Prints', email: 'hello@gammaprints.co', plan: 'Basic', status: 'trial', printers: 3, orders: 47, revenue: 2100, joined: '2024-03-01' },
  { id: 't4', name: 'Delta Make Co.', email: 'info@deltamake.com', plan: 'Pro', status: 'suspended', printers: 6, orders: 188, revenue: 14300, joined: '2023-09-10' },
  { id: 't5', name: 'EpsilonFab', email: 'admin@epsilonfab.net', plan: 'Enterprise', status: 'active', printers: 45, orders: 2104, revenue: 142000, joined: '2023-06-05' },
];

const planColors: Record<string, string> = { Basic: 'bg-gray-100 text-gray-700', Pro: 'bg-blue-100 text-blue-800', Team: 'bg-purple-100 text-purple-800', Enterprise: 'bg-amber-100 text-amber-800' };
const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-800', trial: 'bg-sky-100 text-sky-800', suspended: 'bg-red-100 text-red-800' };

export default function MasterAdminPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [viewTenant, setViewTenant] = useState<typeof MOCK_TENANTS[0] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', plan: 'Basic' });

  // Redirect if not master
  if (user && user.role !== 'master') {
    router.replace('/dashboard');
    return null;
  }

  const filtered = MOCK_TENANTS.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
  );

  const totals = {
    tenants: MOCK_TENANTS.length,
    active: MOCK_TENANTS.filter(t => t.status === 'active').length,
    revenue: MOCK_TENANTS.reduce((s, t) => s + t.revenue, 0),
    printers: MOCK_TENANTS.reduce((s, t) => s + t.printers, 0),
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-amber-400" />
          <div>
            <span className="font-bold text-lg">PrintFlow</span>
            <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Master Admin</Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{user?.email}</span>
          <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />Logout
          </Button>
        </div>
      </nav>

      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tenants', val: totals.tenants, icon: Users, color: 'text-blue-400' },
            { label: 'Active', val: totals.active, icon: Activity, color: 'text-green-400' },
            { label: 'Total Revenue', val: `$${totals.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-amber-400' },
            { label: 'Total Printers', val: totals.printers, icon: TrendingUp, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-400">{s.label}</span><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <p className="text-2xl font-bold">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Tenant Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold">Tenants</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenants..." className="pl-9 bg-gray-800 border-gray-700 text-white w-56" />
              </div>
              <Button className="bg-amber-500 hover:bg-amber-600 text-black" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />Add Tenant
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Company</TableHead>
                <TableHead className="text-gray-400">Plan</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Printers</TableHead>
                <TableHead className="text-gray-400">Orders</TableHead>
                <TableHead className="text-gray-400">Revenue</TableHead>
                <TableHead className="text-gray-400">Joined</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id} className="border-gray-800 hover:bg-gray-800/50">
                  <TableCell>
                    <p className="font-medium text-white">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.email}</p>
                  </TableCell>
                  <TableCell><span className={`px-2 py-0.5 rounded text-xs font-medium ${planColors[t.plan]}`}>{t.plan}</span></TableCell>
                  <TableCell><span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[t.status]}`}>{t.status}</span></TableCell>
                  <TableCell className="text-gray-300">{t.printers}</TableCell>
                  <TableCell className="text-gray-300">{t.orders.toLocaleString()}</TableCell>
                  <TableCell className="text-amber-400 font-medium">${t.revenue.toLocaleString()}</TableCell>
                  <TableCell className="text-gray-400 text-sm">{format(new Date(t.joined), 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => setViewTenant(t)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View Tenant Modal */}
      <Dialog open={!!viewTenant} onOpenChange={() => setViewTenant(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{viewTenant?.name}</DialogTitle></DialogHeader>
          {viewTenant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { l: 'Email', v: viewTenant.email },
                  { l: 'Plan', v: viewTenant.plan },
                  { l: 'Status', v: viewTenant.status },
                  { l: 'Joined', v: format(new Date(viewTenant.joined), 'dd MMM yyyy') },
                  { l: 'Printers', v: viewTenant.printers },
                  { l: 'Total Orders', v: viewTenant.orders },
                  { l: 'Total Revenue', v: `$${viewTenant.revenue.toLocaleString()}` },
                ].map(row => (
                  <div key={row.l} className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">{row.l}</p>
                    <p className="font-medium mt-0.5">{row.v}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">Impersonate</Button>
                <Button variant="outline" className="flex-1">Reset Password</Button>
                {viewTenant.status === 'active' ? (
                  <Button variant="destructive" className="flex-1">Suspend</Button>
                ) : (
                  <Button className="flex-1">Activate</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Tenant Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Tenant</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Company Name</Label><Input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Admin Email</Label><Input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <select className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background" value={newUser.plan} onChange={e => setNewUser(p => ({ ...p, plan: e.target.value }))}>
                {['Basic', 'Pro', 'Team', 'Enterprise'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => { setAddOpen(false); }}>Create Tenant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
