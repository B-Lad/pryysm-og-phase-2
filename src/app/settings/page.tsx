'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, User, Download, Upload, RefreshCw, LogOut, KeyRound, Bell, Moon, Globe, Database, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { orders, customers, printers, spools, resins, powders, inventory, resetToSampleData } = useWorkspace();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [prefs, setPrefs] = useState({ currency: 'USD', timezone: 'UTC+4', theme: 'light', notifications: true, emailAlerts: false });
  const [codes, setCodes] = useState({ orderPrefix: 'ORD', projectPrefix: 'PRJ', customerPrefix: 'CUST', spoolPrefix: 'SP', resinPrefix: 'RS', powderPrefix: 'PW' });

  const exportData = () => {
    const data = { orders, customers, printers, spools, resins, powders, inventory, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `printflow-backup-${Date.now()}.json`; a.click();
    toast({ title: 'Export successful', description: 'Your workspace data has been downloaded.' });
  };

  const SECTIONS = [
    {
      id: 'profile', title: 'Profile', icon: User, desc: 'Your account information',
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Full Name</Label><Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={profile.email} type="email" onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} /></div>
          <div className="col-span-2"><Button>Save Profile</Button></div>
        </div>
      )
    },
    {
      id: 'preferences', title: 'Preferences', icon: Globe, desc: 'App-wide display settings',
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Default Currency</Label>
            <Select value={prefs.currency} onValueChange={v => setPrefs(p => ({ ...p, currency: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{['USD', 'EUR', 'AED', 'INR'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={prefs.timezone} onValueChange={v => setPrefs(p => ({ ...p, timezone: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{['UTC+4', 'UTC+0', 'UTC+5:30', 'UTC-5', 'UTC+8'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between col-span-2 p-3 border rounded-lg">
            <div><p className="text-sm font-medium">Email Alerts</p><p className="text-xs text-muted-foreground">Receive low-stock & overdue notifications</p></div>
            <Switch checked={prefs.emailAlerts} onCheckedChange={v => setPrefs(p => ({ ...p, emailAlerts: v }))} />
          </div>
          <div className="flex items-center justify-between col-span-2 p-3 border rounded-lg">
            <div><p className="text-sm font-medium">In-App Notifications</p><p className="text-xs text-muted-foreground">Show toast messages for actions</p></div>
            <Switch checked={prefs.notifications} onCheckedChange={v => setPrefs(p => ({ ...p, notifications: v }))} />
          </div>
        </div>
      )
    },
    {
      id: 'codes', title: 'Code Settings', icon: KeyRound, desc: 'Customise auto-generated IDs & prefixes',
      content: (
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(codes).map(([k, v]) => (
            <div key={k} className="space-y-2">
              <Label className="capitalize">{k.replace('Prefix', ' Prefix')}</Label>
              <Input value={v} onChange={e => setCodes(p => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
          <div className="col-span-3"><Button>Save Code Settings</Button></div>
        </div>
      )
    },
    {
      id: 'data', title: 'Data & Backup', icon: Database, desc: 'Export, import, or reset your workspace',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Orders', val: orders.length }, { label: 'Customers', val: customers.length },
              { label: 'Printers', val: printers.length }, { label: 'Spools', val: spools.length },
              { label: 'Resins', val: resins.length }, { label: 'Inventory', val: inventory.length },
            ].map(s => (
              <div key={s.label} className="p-3 border rounded-lg">
                <p className="text-2xl font-bold">{s.val}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={exportData}><Download className="mr-2 h-4 w-4" />Export JSON</Button>
            <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Import JSON</Button>
            <Button variant="outline" onClick={resetToSampleData}><RefreshCw className="mr-2 h-4 w-4" />Reset to Sample Data</Button>
          </div>
          <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <p className="text-sm font-medium text-destructive">Danger Zone</p>
            <p className="text-xs text-muted-foreground mt-1">This will permanently delete all your workspace data.</p>
            <Button variant="destructive" size="sm" className="mt-3"><Trash2 className="mr-2 h-4 w-4" />Delete All Data</Button>
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-lg"><Settings className="text-primary h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your workspace preferences</p>
          </div>
        </div>
        <Button variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
      </header>

      <div className="space-y-6">
        {SECTIONS.map(sec => (
          <Card key={sec.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><sec.icon className="h-5 w-5 text-primary" />{sec.title}</CardTitle>
              <CardDescription>{sec.desc}</CardDescription>
            </CardHeader>
            <CardContent>{sec.content}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
