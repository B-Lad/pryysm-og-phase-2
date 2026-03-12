'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Factory, Printer, ZoomIn, ZoomOut, RotateCcw, Plus, Trash2, Move } from 'lucide-react';

type EquipmentType = 'printer' | 'workbench' | 'storage' | 'packaging' | 'door' | 'window';

interface PlacedItem {
  id: string;
  type: EquipmentType;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  printerId?: string;
}

const PALETTE: { type: EquipmentType; label: string; color: string; w: number; h: number }[] = [
  { type: 'printer', label: 'Printer', color: '#3b82f6', w: 80, h: 80 },
  { type: 'workbench', label: 'Workbench', color: '#10b981', w: 120, h: 60 },
  { type: 'storage', label: 'Storage', color: '#f59e0b', w: 60, h: 80 },
  { type: 'packaging', label: 'Packing Area', color: '#8b5cf6', w: 100, h: 80 },
  { type: 'door', label: 'Door', color: '#6b7280', w: 40, h: 20 },
  { type: 'window', label: 'Window', color: '#93c5fd', w: 60, h: 16 },
];

const statusColors: Record<string, string> = {
  printing: '#22c55e', idle: '#94a3b8', maintenance: '#f59e0b', offline: '#ef4444'
};

export default function FactoryLayoutPage() {
  const { printers } = useWorkspace();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<PlacedItem[]>(() => {
    // Pre-populate with printers in a grid
    return printers.slice(0, 6).map((p, i) => ({
      id: `printer-${p.id}`,
      type: 'printer' as EquipmentType,
      label: p.codeName || p.name,
      x: 40 + (i % 3) * 120,
      y: 60 + Math.floor(i / 3) * 120,
      w: 80,
      h: 80,
      color: statusColors[p.status] || '#94a3b8',
      printerId: p.id,
    }));
  });
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [gridSize] = useState(20);
  const [showGrid, setShowGrid] = useState(true);

  const snap = (v: number) => Math.round(v / gridSize) * gridSize;

  const addItem = (palette: typeof PALETTE[0]) => {
    const newItem: PlacedItem = {
      id: `${palette.type}-${Date.now()}`,
      type: palette.type,
      label: palette.label,
      x: 40, y: 40,
      w: palette.w, h: palette.h,
      color: palette.color,
    };
    setItems(prev => [...prev, newItem]);
    setSelected(newItem.id);
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setSelected(id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const item = items.find(x => x.id === id);
    if (!item) return;
    const offsetX = (e.clientX - rect.left) / zoom - item.x;
    const offsetY = (e.clientY - rect.top) / zoom - item.y;
    setDragging({ id, ox: offsetX, oy: offsetY });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = snap((e.clientX - rect.left) / zoom - dragging.ox);
    const y = snap((e.clientY - rect.top) / zoom - dragging.oy);
    setItems(prev => prev.map(item => item.id === dragging.id ? { ...item, x: Math.max(0, x), y: Math.max(0, y) } : item));
  }, [dragging, zoom]);

  const handleMouseUp = () => setDragging(null);

  const deleteSelected = () => {
    if (selected) { setItems(prev => prev.filter(x => x.id !== selected)); setSelected(null); }
  };

  const reset = () => {
    setItems(printers.slice(0, 6).map((p, i) => ({
      id: `printer-${p.id}`, type: 'printer' as EquipmentType, label: p.codeName || p.name,
      x: 40 + (i % 3) * 120, y: 60 + Math.floor(i / 3) * 120, w: 80, h: 80,
      color: statusColors[p.status] || '#94a3b8', printerId: p.id,
    })));
    setSelected(null);
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-lg"><Factory className="text-primary h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Factory Layout</h1>
            <p className="text-sm text-muted-foreground">Drag and drop to arrange your factory floor</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(1)}>Reset Zoom</Button>
          <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />Reset Layout</Button>
        </div>
      </header>

      <div className="flex gap-4">
        {/* Palette */}
        <div className="w-48 flex-shrink-0 space-y-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Add Equipment</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {PALETTE.map(p => (
                <button key={p.type} onClick={() => addItem(p)} className="w-full flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 text-sm text-left transition-colors">
                  <div className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: p.color + '33', border: `2px solid ${p.color}` }}>
                    {p.type === 'printer' ? <Printer className="h-4 w-4" style={{ color: p.color }} /> : <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: p.color }} />}
                  </div>
                  {p.label}
                </button>
              ))}
            </CardContent>
          </Card>
          {selected && (
            <Button variant="destructive" size="sm" className="w-full" onClick={deleteSelected}>
              <Trash2 className="mr-2 h-4 w-4" />Remove Selected
            </Button>
          )}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Legend</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-xs">
              {Object.entries(statusColors).map(([s, c]) => (
                <div key={s} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} /><span className="capitalize">{s}</span></div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Canvas */}
        <div className="flex-1 border rounded-xl overflow-auto bg-muted/20">
          <div
            ref={canvasRef}
            className="relative cursor-default"
            style={{
              width: 800, height: 600, transform: `scale(${zoom})`, transformOrigin: '0 0',
              backgroundImage: showGrid ? `radial-gradient(circle, #cbd5e1 1px, transparent 1px)` : 'none',
              backgroundSize: `${gridSize}px ${gridSize}px`,
              minWidth: 800 * zoom, minHeight: 600 * zoom,
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Room border */}
            <div className="absolute inset-4 border-4 border-gray-400 rounded-lg pointer-events-none" style={{ borderStyle: 'dashed' }} />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground pointer-events-none">Factory Floor</div>

            {items.map(item => {
              const printer = item.printerId ? printers.find(p => p.id === item.printerId) : null;
              const isSelected = selected === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    position: 'absolute', left: item.x, top: item.y, width: item.w, height: item.h,
                    backgroundColor: item.color + '22',
                    border: `2px solid ${isSelected ? '#1d4ed8' : item.color}`,
                    borderRadius: 8,
                    boxShadow: isSelected ? `0 0 0 3px #93c5fd` : 'none',
                    cursor: 'grab',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 600, textAlign: 'center', padding: 4,
                    userSelect: 'none',
                    transition: dragging?.id === item.id ? 'none' : 'box-shadow 0.15s',
                  }}
                  onMouseDown={e => handleMouseDown(e, item.id)}
                >
                  {item.type === 'printer' && <Printer className="mb-1" style={{ color: item.color, width: 18, height: 18 }} />}
                  <span style={{ color: item.color, fontSize: 9, lineHeight: 1.2 }}>{item.label}</span>
                  {printer && (
                    <span style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{printer.status}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
