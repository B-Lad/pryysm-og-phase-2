'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Layers, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    const { error } = await signup(form.name, form.email, form.password);
    if (error) { setError(error); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-indigo-600 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create account</h1>
          <p className="text-slate-500 text-sm mt-1">Start managing your print farm</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[{l:'Full Name',k:'name',t:'text',p:'Your name'},{l:'Email',k:'email',t:'email',p:'you@example.com'},{l:'Password',k:'password',t:'password',p:'Min 6 characters'},{l:'Confirm Password',k:'confirm',t:'password',p:'Repeat password'}].map(f=>(
              <div key={f.k}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.l}</label>
                <input type={f.t} value={(form as any)[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})} required placeholder={f.p}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
            ))}
            {error && <p className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {loading && <Loader2 className="w-4 h-4 animate-spin"/>} Create Account
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account? <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
