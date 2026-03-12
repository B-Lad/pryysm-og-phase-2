'use client';
import { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import { useAuth } from '@/hooks/use-auth';
import { Bot, Send, Plus, Trash2, User, X } from 'lucide-react';

interface Message { role: 'user'|'assistant'; content: string; }
interface Conversation { id: string; title: string; messages: Message[]; }

const SUGGESTED = [
  'Which orders are overdue right now?',
  'Which printers are idle?',
  'What materials are running low?',
  'Summarize today\'s production status',
  'Which jobs are unassigned?',
  'Show me customers with most orders',
];

export default function AiChatPage() {
  const { user } = useAuth();
  const { orders, printers, customers, spools, resins, inventory, unassignedJobs, powders } = useWorkspace();
  const [conversations, setConversations] = useState<Conversation[]>([{ id: '1', title: 'New Chat', messages: [] }]);
  const [activeId, setActiveId] = useState('1');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const active = conversations.find(c => c.id === activeId)!;

  const systemPrompt = `You are PrintFlow AI, the intelligent assistant for ${user?.name}'s 3D printing farm managed by PrintFlow.

Current workspace data (${new Date().toLocaleDateString()}):
- Orders: ${orders.length} total | ${orders.filter(o=>o.status==='pending').length} pending | ${orders.filter(o=>o.status==='in-progress').length} in-progress | ${orders.filter(o=>o.status==='overdue').length} OVERDUE | ${orders.filter(o=>o.status==='completed').length} completed
- Printers: ${printers.length} total | ${printers.filter(p=>p.status==='printing').length} printing | ${printers.filter(p=>p.status==='idle').length} idle | ${printers.filter(p=>p.status==='maintenance').length} maintenance | ${printers.filter(p=>p.status==='offline').length} offline
- Customers: ${customers.length} active customers
- Materials: ${spools.length} spools | ${resins.length} resins | ${powders.length} powders
- Low/critical materials: ${[...spools,...resins,...powders].filter(m=>m.status==='Critical'||m.status==='Low').map(m=>m.name).join(', ')||'None'}
- Inventory alerts: ${inventory.filter(i=>i.status!=='In Stock').length} items below minimum stock
- Unassigned jobs: ${unassignedJobs.length}
- Recent overdue orders: ${orders.filter(o=>o.status==='overdue').slice(0,5).map(o=>`${o.orderNumber} (${o.customer}, due ${o.deadline})`).join('; ')||'None'}
- Printers currently printing: ${printers.filter(p=>p.status==='printing').map(p=>`${p.name} (${p.currentJob?.name||'unknown job'}, ${p.currentJob?.progress||0}%)`).join('; ')||'None'}

Be concise, helpful, and professional. Use bullet points for lists. Provide actionable insights.`;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [active?.messages]);

  const send = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;
    const userMsg: Message = { role: 'user', content };
    const newMsgs = [...active.messages, userMsg];
    const title = active.messages.length === 0 ? content.slice(0, 45) : active.title;
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, messages: newMsgs, title } : c));
    setInput(''); setLoading(true);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs, systemPrompt }),
      });
      const data = await resp.json();
      const aiMsg: Message = { role: 'assistant', content: data.content || 'Sorry, I encountered an error. Please check the API key is configured.' };
      setConversations(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...newMsgs, aiMsg] } : c));
    } catch {
      setConversations(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...newMsgs, { role: 'assistant', content: '❌ Failed to connect. Please check your ANTHROPIC_API_KEY is set in Vercel environment variables.' }] } : c));
    } finally { setLoading(false); }
  };

  const newChat = () => {
    const id = Date.now().toString();
    setConversations(prev => [...prev, { id, title: 'New Chat', messages: [] }]);
    setActiveId(id);
  };

  const clearChat = () => {
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, messages: [], title: 'New Chat' } : c));
  };

  const deleteChat = (id: string) => {
    if (conversations.length === 1) { clearChat(); return; }
    const remaining = conversations.filter(c => c.id !== id);
    setConversations(remaining);
    if (activeId === id) setActiveId(remaining[remaining.length - 1].id);
  };

  // Simple markdown-like rendering
  const renderMessage = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold">{line.slice(2,-2)}</p>;
      if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
      if (line.match(/^\d+\./)) return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\.\s/,'')}</li>;
      if (line === '') return <br key={i}/>;
      // Bold inline
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return <p key={i}>{parts.map((p,j) => j%2===1 ? <strong key={j}>{p}</strong> : p)}</p>;
    });
  };

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 bg-slate-900 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-700">
          <button onClick={newChat} className="flex items-center gap-2 w-full bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors">
            <Plus className="w-4 h-4"/>New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(c=>(
            <div key={c.id} onClick={()=>setActiveId(c.id)} className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${activeId===c.id?'bg-blue-700 text-white':'text-slate-300 hover:bg-slate-800'}`}>
              <Bot className="w-3.5 h-3.5 shrink-0"/>
              <span className="flex-1 truncate">{c.title}</span>
              <button onClick={e=>{e.stopPropagation();deleteChat(c.id);}} className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"><X className="w-3 h-3"/></button>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-slate-700 text-xs text-slate-500 text-center">
          PrintFlow AI · Powered by Claude
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-700"/>
            <span className="font-semibold text-slate-800 text-sm">{active.title}</span>
          </div>
          {active.messages.length > 0 && (
            <button onClick={clearChat} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50">
              <Trash2 className="w-3 h-3"/>Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {active.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div>
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Bot className="w-8 h-8 text-blue-700"/>
                </div>
                <h2 className="font-bold text-slate-800 text-lg">PrintFlow AI</h2>
                <p className="text-slate-400 text-sm mt-1">Ask anything about your print farm</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                {SUGGESTED.map(s=>(
                  <button key={s} onClick={()=>send(s)} className="text-left text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 hover:border-blue-300 hover:bg-blue-50 transition-colors text-slate-600 shadow-sm">{s}</button>
                ))}
              </div>
            </div>
          )}

          {active.messages.map((msg, i)=>(
            <div key={i} className={`flex gap-3 ${msg.role==='user'?'justify-end':''}`}>
              {msg.role==='assistant' && <div className="w-7 h-7 bg-blue-700 rounded-lg flex items-center justify-center shrink-0 mt-0.5"><Bot className="w-4 h-4 text-white"/></div>}
              <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role==='user'?'bg-blue-700 text-white rounded-tr-none':'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>
                {msg.role==='assistant' ? <div className="space-y-1">{renderMessage(msg.content)}</div> : msg.content}
              </div>
              {msg.role==='user' && <div className="w-7 h-7 bg-slate-300 rounded-lg flex items-center justify-center shrink-0 mt-0.5"><User className="w-4 h-4 text-slate-600"/></div>}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 bg-blue-700 rounded-lg flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-white"/></div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-5">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div className="bg-white border-t border-slate-200 p-4">
          <div className="flex gap-3 items-end">
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
              placeholder="Ask about orders, printers, materials…" rows={1}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 leading-relaxed"/>
            <button onClick={()=>send()} disabled={!input.trim()||loading}
              className="bg-blue-700 text-white p-2.5 rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-colors shrink-0">
              <Send className="w-4 h-4"/>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 text-center">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
