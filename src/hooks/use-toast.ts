import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let toastQueue: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

function notify() {
  listeners.forEach(fn => fn([...toastQueue]));
}

export function toast({ title, description, variant = 'default' }: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2);
  toastQueue.push({ id, title, description, variant });
  notify();
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    notify();
  }, 3500);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const subscribe = useCallback(() => {
    const fn = (t: Toast[]) => setToasts(t);
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  }, []);

  return { toast, toasts, subscribe };
}
