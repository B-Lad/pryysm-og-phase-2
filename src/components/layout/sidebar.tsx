'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Users, Printer, Boxes, Tags,
  PlusCircle, ListTree, PackageCheck, History, Factory,
  Workflow, Bot, ChevronLeft, ChevronRight, Settings, LogOut,
  DollarSign, Calculator, Wrench
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tracking', label: 'Project Tracking', icon: Workflow },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/job-allotment', label: 'Job Allotment', icon: ListTree },
  { href: '/printers', label: 'Printer Management', icon: Printer },
  { href: '/add-remove-printer', label: 'Add/Remove Printer', icon: PlusCircle },
  { href: '/raw-material', label: 'Raw Material', icon: Boxes },
  { href: '/material-log', label: 'Material Log', icon: History },
  { href: '/inventory', label: 'Spares & Stores', icon: Wrench },
  { href: '/order-dispatch', label: 'Order Dispatch', icon: PackageCheck },
  { href: '/finance', label: 'Finance', icon: DollarSign },
  { href: '/costing', label: 'Costing', icon: Calculator },
  { href: '/labels', label: 'Labels', icon: Tags },
  { href: '/layout-page', label: 'Factory Layout', icon: Factory },
  { href: '/ai-chat', label: 'AI Chat', icon: Bot },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? 'w-14' : 'w-60'} bg-slate-900 text-white flex flex-col shrink-0 transition-all duration-200 h-screen sticky top-0`}>
      {/* Logo */}
      <div className={`flex items-center gap-2 px-4 py-5 border-b border-slate-700 ${collapsed ? 'justify-center' : ''}`}>
        <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">PF</div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm leading-tight">PrintFlow</p>
            <p className="text-xs text-slate-400 leading-tight">by 3D Prodigy</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700 p-3 space-y-1">
        {!collapsed && user && (
          <div className="px-2 py-1 mb-1">
            <p className="text-xs text-slate-400 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
