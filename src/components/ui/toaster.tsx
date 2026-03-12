'use client';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function Toaster() {
  const { toasts, subscribe } = useToast();
  useEffect(() => { return subscribe(); }, [subscribe]);
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto max-w-sm rounded-xl px-4 py-3 shadow-lg text-sm font-medium text-white transition-all animate-in slide-in-from-bottom-5 ${t.variant === 'destructive' ? 'bg-red-600' : 'bg-slate-900'}`}>
          <p className="font-semibold">{t.title}</p>
          {t.description && <p className="text-xs opacity-80 mt-0.5">{t.description}</p>}
        </div>
      ))}
    </div>
  );
}
