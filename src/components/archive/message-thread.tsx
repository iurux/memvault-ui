import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, FileText, Pencil, Plus, Sparkles, Trash2, UserRound } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import type { Conversation, Message } from '@/lib/api';

export type Draft = { role: Message['role']; content: string };
const roles: Message['role'][] = ['user', 'assistant', 'note'];

function AutoTextarea({ value, onChange, onSave, onCancel, autoFocus, label }: { value: string; onChange: (v: string) => void; onSave: () => void; onCancel: () => void; autoFocus?: boolean; label: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => { const el = ref.current; if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight + 2}px`; } }, [value]);
  return <textarea ref={ref} autoFocus={autoFocus} aria-label={label} className="message-textarea" value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSave(); }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel(); }
  }} />;
}

function Label({ role, source }: { role: Message['role']; source: string }) {
  return <>{role === 'user' ? <UserRound /> : role === 'assistant' ? <Sparkles /> : <FileText />}<span>{role === 'user' ? 'You' : role === 'assistant' ? source : 'Note'}</span></>;
}

export function MessageThread({ conversation, editAll, onEditAllChange, onSave, onDelete, onDirtyChange }: {
  conversation: Conversation; editAll: boolean; onEditAllChange: (v: boolean) => void;
  onSave: (messages: Draft[]) => void; onDelete: (messages: Draft[], removed: number) => void; onDirtyChange: (dirty: boolean) => void;
}) {
  const current: Draft[] = conversation.messages.map(m => ({ role: m.role, content: m.content }));
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [all, setAll] = useState<Draft[]>([]);
  const [adding, setAdding] = useState(false);
  const [newRole, setNewRole] = useState<Message['role']>('note');
  const [newContent, setNewContent] = useState('');

  useEffect(() => { if (editAll) { setAll(current); setEditIndex(null); setAdding(false); } }, [editAll]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = editAll ? JSON.stringify(all) !== JSON.stringify(current) : (editIndex !== null && draft !== current[editIndex]?.content) || (adding && newContent.trim() !== '');
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);

  const saveOne = () => { if (editIndex === null) return; if (draft !== current[editIndex]?.content) onSave(current.map((m, i) => i === editIndex ? { ...m, content: draft } : m)); setEditIndex(null); };
  const move = (i: number, d: number) => { const next = [...current]; const [m] = next.splice(i, 1); if (m) next.splice(i + d, 0, m); onSave(next); };
  const addMessage = () => { if (!newContent.trim()) return; onSave([...current, { role: newRole, content: newContent }]); setNewContent(''); setAdding(false); };
  const saveAll = () => { onSave(all); onEditAllChange(false); };

  return <>
    {(editAll ? all : current).map((message, i) => <article className={`message ${message.role} group/message`} key={i}>
      <div className="message-label">
        {editAll ? <select aria-label="Message role" className="role-select" value={message.role} onChange={e => setAll(a => a.map((m, j) => j === i ? { ...m, role: e.target.value as Message['role'] } : m))}>{roles.map(r => <option key={r} value={r}>{r}</option>)}</select> : <Label role={message.role} source={conversation.source} />}
        {!editAll && editIndex !== i && <span className="message-actions">
          <button type="button" onClick={() => { setEditIndex(i); setDraft(message.content); }}><Pencil />Edit</button>
          <button type="button" aria-label="Move message up" title="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></button>
          <button type="button" aria-label="Move message down" title="Move down" disabled={i === current.length - 1} onClick={() => move(i, 1)}><ArrowDown /></button>
          <button type="button" onClick={() => onDelete(current.filter((_, j) => j !== i), i)}><Trash2 />Delete message</button>
        </span>}
      </div>
      {editAll ? <AutoTextarea label={`Message ${i + 1}`} value={message.content} onChange={v => setAll(a => a.map((m, j) => j === i ? { ...m, content: v } : m))} onSave={saveAll} onCancel={() => onEditAllChange(false)} />
        : editIndex === i ? <div><AutoTextarea autoFocus label="Edit message" value={draft} onChange={setDraft} onSave={saveOne} onCancel={() => setEditIndex(null)} /><div className="edit-row"><span className="mr-auto">⌘ Enter to save · Esc to cancel</span><Button variant="ghost" size="sm" className="text-[11px] h-7" onClick={() => setEditIndex(null)}>Cancel</Button><Button variant="outline" size="sm" className="text-[11px] h-7" onClick={saveOne}>Save</Button></div></div>
        : <div className="prose"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ table: ({ children }) => <div className="table-wrap"><table>{children}</table></div>, a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer">{children}</a> }}>{message.content}</ReactMarkdown></div>}
    </article>)}
    {!editAll && (adding ? <div className="message">
      <div className="message-label gap-3">{roles.map(r => <button key={r} type="button" className={`role-choice ${newRole === r ? 'active' : ''}`} aria-pressed={newRole === r} onClick={() => setNewRole(r)}>{r}</button>)}</div>
      <AutoTextarea autoFocus label="New message" value={newContent} onChange={setNewContent} onSave={addMessage} onCancel={() => { setAdding(false); setNewContent(''); }} />
      <div className="edit-row"><span className="mr-auto">⌘ Enter to add · Esc to cancel</span><Button variant="ghost" size="sm" className="text-[11px] h-7" onClick={() => { setAdding(false); setNewContent(''); }}>Cancel</Button><Button variant="outline" size="sm" className="text-[11px] h-7" disabled={!newContent.trim()} onClick={addMessage}>Add</Button></div>
    </div> : <button type="button" className="add-message" onClick={() => { setNewRole('note'); setAdding(true); }}><Plus />Add message</button>)}
    {editAll && <div className="edit-all-bar"><span className="mr-auto">Editing all messages{dirty ? ' · unsaved changes' : ''}</span><Button variant="ghost" size="sm" className="text-[11px] h-7" onClick={() => onEditAllChange(false)}>Discard</Button><Button variant="outline" size="sm" className="text-[11px] h-7" onClick={saveAll}>Save</Button></div>}
  </>;
}
