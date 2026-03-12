import Link from 'next/link';
import { Layers, Cpu, Workflow, FileText, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <header className="px-6 h-16 flex items-center shadow-sm sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800">Pryysm <span className="text-sm font-normal text-slate-400">by 3D Prodigy</span></span>
        </Link>
        <nav className="ml-auto flex items-center gap-4">
          <Link href="#features" className="text-sm text-slate-600 hover:text-slate-800">Features</Link>
          <Link href="/login" className="text-sm text-slate-600 hover:text-slate-800">Login</Link>
          <Link href="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">Get Started</Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="py-24 text-center px-4">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> 3D Print Farm Management — Built for Scale
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
              The Operating System for Your{' '}
              <span className="text-indigo-600">3D Printing Farm</span>
            </h1>
            <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Manage orders, printers, materials, customers, and finances — all in one intelligent platform.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/signup" className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-base font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Start Free Trial</Link>
              <Link href="/login" className="border border-slate-200 text-slate-700 px-6 py-3 rounded-xl text-base font-semibold hover:bg-slate-50 transition-colors">Sign In →</Link>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-slate-50 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Everything you need to run your print farm</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Cpu, title: 'AI Job Scheduling', desc: 'Intelligent auto-assignment finds the best printer for each job, maximizing utilization and meeting deadlines.' },
                { icon: Workflow, title: 'Visual Project Tracking', desc: 'Kanban board gives you live visibility over every order from receipt to dispatch.' },
                { icon: FileText, title: 'Complete Finance Hub', desc: 'Generate quotations, POs, and invoices. Track revenue, costs, and profitability in one place.' },
              ].map(f => (
                <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                    <f.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">All modules included</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Dashboard', 'Orders', 'Customers', 'Project Tracking', 'Job Allotment', 'Printer Mgmt', 'Raw Materials', 'Material Log', 'Spares & Stores', 'Order Dispatch', 'AI Chat', 'Finance'].map(m => (
                <div key={m} className="flex items-center gap-2 p-3 rounded-lg border border-slate-100 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {m}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-10 px-6 text-center text-sm">
        <p>© {new Date().getFullYear()} Pryysm by 3D Prodigy. All rights reserved.</p>
      </footer>
    </div>
  );
}
