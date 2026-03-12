'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Layers, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, loginAsDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await login(email, password);
    if (error) { setError('Invalid email or password. Please try again.'); setLoading(false); }
  };

  const handleDemo = () => {
    setDemoLoading(true);
    loginAsDemo();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-indigo-600 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to Pryysm</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"/>
                <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            {error && <p className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {loading && <Loader2 className="w-4 h-4 animate-spin"/>} Sign In
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"/></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">or</span></div>
          </div>

          <button onClick={handleDemo} disabled={demoLoading} className="w-full border border-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
            {demoLoading && <Loader2 className="w-4 h-4 animate-spin"/>} Try Demo (No Account Needed)
          </button>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Don't have an account? <Link href="/signup" className="text-indigo-600 font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
