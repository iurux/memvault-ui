import { Suspense, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Archive, ArrowLeft, ArrowUpRight, Check, ChevronDown, CircleHelp, FileText, Hash, MoreHorizontal, Moon, Plus, Search, Settings2, Sparkles, Sun, Trash2, UserRound, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { archiveOptions, getApi, type ConversationSummary, type Source } from '@/lib/api';

const sources: Source[] = ['claude', 'chatgpt', 'mcp', 'chat', 'manual'];
function shortDate(value: string) { return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function longDate(value: string) { return new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
function month(value: string) { return new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return <>{text.split(new RegExp(`(${escaped})`, 'gi')).map((part, i) => part.toLocaleLowerCase() === query.toLocaleLowerCase() ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>)}</>;
}
export function ArchiveSkeleton() { return <div className="archive"><aside className="sidebar"><div className="wordmark">memvault</div><div className="skeleton-line" /></aside><div className="list-pane p-6">{Array.from({ length: 6 }, (_, i) => <div className="py-6" key={i}><div className="skeleton-line" /><div className="skeleton-line w-2/3" /></div>)}</div><div className="reader p-10"><div className="skeleton-line w-2/3" /><div className="skeleton-line w-1/3" /></div></div>; }
export default function Memvault() {
  const archive = useSuspenseQuery(archiveOptions());
  const client = useQueryClient();
  const api = getApi();
  const [selected, setSelected] = useState<string | null>(archive.data[0]?.id ?? null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState(''); const [debounced, setDebounced] = useState('');
  const [tag, setTag] = useState(''); const [source, setSource] = useState('');
  const [noteOpen, setNoteOpen] = useState(false); const [deleteOpen, setDeleteOpen] = useState(false);
  const [dark, setDark] = useState(false); const [help, setHelp] = useState(false);
  const [settings, setSettings] = useState(false); const [url, setUrl] = useState(api.baseUrl); const [urlError, setUrlError] = useState('');
  const [actionError, setActionError] = useState(''); const [addingTag, setAddingTag] = useState(false); const [tagDraft, setTagDraft] = useState('');
  const [editing, setEditing] = useState(false); const [titleDraft, setTitleDraft] = useState('');
  const [noteTitle, setNoteTitle] = useState(''); const [noteContent, setNoteContent] = useState(''); const [noteTags, setNoteTags] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const timer = setTimeout(() => setDebounced(query.trim()), 250); return () => clearTimeout(timer); }, [query]);
  useEffect(() => { const saved = localStorage.getItem('memvault-theme') === 'dark'; setDark(saved); document.documentElement.classList.toggle('dark', saved); }, []);
  const tagsQuery = useQuery({ queryKey: ['archive', 'tags'], queryFn: () => api.tags() });
  const filtered = useQuery({ queryKey: ['archive', 'filtered', tag, source], queryFn: () => api.list({ ...(tag ? { tag } : {}), ...(source ? { source } : {}) }), enabled: Boolean(tag || source) });
  const search = useQuery({ queryKey: ['archive', 'search', debounced], queryFn: () => api.search(debounced), enabled: Boolean(debounced) });
  const detail = useQuery({ queryKey: ['archive', 'detail', selected], queryFn: () => api.get(selected ?? ''), enabled: Boolean(selected) });
  const base = tag || source ? filtered.data ?? [] : archive.data;
  const results: ConversationSummary[] = debounced ? (search.data ?? []).flatMap(result => {
    const original = base.find(c => c.id === result.conversation_id);
    return original ? [{ ...original, title: result.title, snippet: result.snippet }] : [];
  }) : base;
  const rows = [...results].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['archive'] }); };
  const patch = useMutation({ mutationFn: (changes: { title?: string; tags?: string[] }) => api.patch(selected ?? '', changes), onSuccess: async () => { setActionError(''); await refresh(); }, onError: e => setActionError(e.message) });
  const create = useMutation({ mutationFn: () => api.note({ title: noteTitle.trim(), content: noteContent.trim(), tags: [...new Set(noteTags.split(',').map(t => t.trim()).filter(Boolean))] }), onSuccess: async ({ id }) => { await refresh(); setSelected(id); setMobileOpen(true); setNoteOpen(false); setNoteTitle(''); setNoteContent(''); setNoteTags(''); setActionError(''); }, onError: e => setActionError(e.message) });
  const remove = useMutation({ mutationFn: () => api.delete(selected ?? ''), onSuccess: async () => { setDeleteOpen(false); setSelected(rows.find(c => c.id !== selected)?.id ?? null); setActionError(''); await refresh(); }, onError: e => setActionError(e.message) });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target;
      const typing = target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);
      if (e.key === 'Escape') { if (noteOpen) setNoteOpen(false); else if (editing) setEditing(false); else if (query) setQuery(''); else setMobileOpen(false); return; }
      if (typing || noteOpen || deleteOpen || settings) return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === '?') setHelp(v => !v);
      if (e.key === 'j' || e.key === 'k') { e.preventDefault(); const index = rows.findIndex(c => c.id === selected); const next = rows[Math.max(0, Math.min(rows.length - 1, index + (e.key === 'j' ? 1 : -1)))]; if (next) setSelected(next.id); }
      if (e.key === 'Enter' && selected) { e.preventDefault(); setMobileOpen(true); }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [rows, selected, query, noteOpen, deleteOpen, editing, settings]);
  const conversation = detail.data;
  const listLoading = (debounced && search.isFetching) || ((tag || source) && filtered.isPending);
  const listError = search.error ?? filtered.error;
  function changeTheme() { const next = !dark; setDark(next); document.documentElement.classList.toggle('dark', next); localStorage.setItem('memvault-theme', next ? 'dark' : 'light'); }
  function saveTitle() { const value = titleDraft.trim(); if (value && value !== conversation?.title) patch.mutate({ title: value }); setEditing(false); }
  function addTag() { const value = tagDraft.trim(); if (value && conversation && !conversation.tags.includes(value)) patch.mutate({ tags: [...conversation.tags, value] }); setTagDraft(''); setAddingTag(false); }
  function saveSettings() {
    try { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error(); const value = url.trim().replace(/\/$/, ''); api.baseUrl = value; api.mode = 'connecting'; localStorage.setItem('memvault-api-url', value); setSelected(null); setTag(''); setSource(''); setQuery(''); client.removeQueries({ queryKey: ['archive'] }); setSettings(false); setUrlError(''); void client.invalidateQueries(); } catch { setUrlError('Enter a valid http or https URL.'); }
  }
  return <>
    <div className="api-banner">{api.mode === 'sample' ? <><span className="source-dot" /> <span>Local API not running: showing sample data. Start it with <code>memvault ui</code></span></> : <><span className="source-dot" /><span>Connected to local archive</span></>}</div>
    <div className={`archive ${mobileOpen ? 'reader-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand-header flex items-center gap-3"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span className="wordmark">memvault</span></div>
        <div className="search-field"><Search size={14} /><input ref={searchRef} aria-label="Search archive" placeholder="Search your archive" value={query} onChange={e => setQuery(e.target.value)} />{query ? <Button variant="ghost" className="h-5 w-5 p-0" aria-label="Clear search" onClick={() => setQuery('')}><X /></Button> : <kbd>/</kbd>}</div>
        <div className="sidebar-scroll">
          <Button variant="ghost" className={`nav-item ${!tag && !source ? 'active' : ''}`} onClick={() => { setTag(''); setSource(''); }}><Archive size={14} />All conversations<span className="count">{archive.data.length}</span></Button>
          <div className="eyebrow mt-8 mb-3 px-2">Tags</div>
          <div className="tag-navigation">{tagsQuery.data?.map(t => <Button key={t.tag} variant="ghost" className={`nav-item ${tag === t.tag ? 'active' : ''}`} onClick={() => setTag(tag === t.tag ? '' : t.tag)}><Hash size={13} />{t.tag}<span className="count">{t.count}</span></Button>)}</div>
          <div className="eyebrow mt-8 mb-3 px-2">Sources</div>
          <div className="source-navigation">{sources.map(s => <Button key={s} variant="ghost" className={`nav-item ${source === s ? 'active' : ''}`} onClick={() => setSource(source === s ? '' : s)}><span className="source-dot" />{s}<span className="count">{archive.data.filter(c => c.source === s).length}</span></Button>)}</div>
        </div>
        <div className="sidebar-bottom">
          <div className="eyebrow px-2 mb-3">A little space for your thoughts.</div>
          <div className="footer-divider border-t border-border mb-3" />
          <div className="flex items-center justify-between text-muted-foreground w-full">
            <Button variant="ghost" size="icon" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'} onClick={changeTheme}>{dark ? <Sun /> : <Moon />}</Button>
            <div className="flex gap-1">
              <Popover open={settings} onOpenChange={setSettings}><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Settings" title="Settings"><Settings2 /></Button></PopoverTrigger><PopoverContent align="start" className="w-80 space-y-4"><h2 className="text-sm font-medium">Local connection</h2><label className="form-label">API base URL<input className="form-field" value={url} onChange={e => setUrl(e.target.value)} /></label>{urlError && <p className="text-xs text-destructive">{urlError}</p>}<Button size="sm" onClick={saveSettings}>Save connection<ArrowUpRight /></Button><p className="text-xs text-muted-foreground">Sample changes are kept for this session only.</p></PopoverContent></Popover>
              <Popover open={help} onOpenChange={setHelp}><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Keyboard shortcuts" title="Keyboard shortcuts"><CircleHelp /></Button></PopoverTrigger><PopoverContent align="start" className="space-y-3"><h2 className="text-sm font-medium">Keyboard shortcuts</h2>{[['/', 'Search'], ['j / k', 'Next / previous conversation'], ['Enter', 'Open conversation'], ['Esc', 'Close or clear search'], ['?', 'Show shortcuts']].map(([key, label]) => <div key={key} className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{label}</span><kbd>{key}</kbd></div>)}</PopoverContent></Popover>
            </div>
          </div>
        </div>
      </aside>
      <section className="list-pane" aria-label="Conversation list">
        <header className="list-heading"><div><h1>{debounced ? 'Search results' : tag ? `# ${tag}` : source || 'All conversations'}</h1><p className="text-[11px] text-muted-foreground mt-1">{rows.length} {rows.length === 1 ? 'conversation' : 'conversations'}{source && tag ? ` · ${source}` : ''}</p></div><Button variant="outline" size="sm" className="text-[11px] px-2.5" onClick={() => { setActionError(''); setNoteOpen(true); }}><Plus size={13} />New note</Button></header>
        <div className="conversation-list">{(tag || source) && <div className="px-6 pb-3 flex gap-2">{tag && <Button variant="ghost" size="sm" onClick={() => setTag('')}>#{tag}<X /></Button>}{source && <Button variant="ghost" size="sm" onClick={() => setSource('')}>{source}<X /></Button>}</div>}
          {listLoading ? <div className="p-6">{[1, 2, 3].map(i => <div key={i} className="py-4"><div className="skeleton-line" /><div className="skeleton-line w-2/3" /></div>)}</div> : listError ? <div className="empty-state"><p>{listError.message}</p><Button variant="link" onClick={refresh}>Try again</Button></div> : rows.length === 0 ? <div className="empty-state"><Search className="mx-auto mb-4" size={22} /><p>No conversations found.</p><Button variant="link" onClick={() => { setQuery(''); setTag(''); setSource(''); }}>Clear filters</Button></div> : rows.map((c, i) => <div key={c.id}>{(i === 0 || month(rows[i - 1]?.created_at ?? '') !== month(c.created_at)) && <div className="month-heading">{month(c.created_at)}</div>}<Button variant="ghost" className={`conversation-row ${selected === c.id ? 'selected' : ''}`} aria-label={`Open ${c.title}`} aria-current={selected === c.id ? 'true' : undefined} onClick={() => { setSelected(c.id); setMobileOpen(true); setEditing(false); setAddingTag(false); setActionError(''); }}><h2 className="row-title"><Highlight text={c.title} query={debounced} /></h2><div className="row-meta"><span>{shortDate(c.created_at)}</span><span>·</span><span>{c.source}</span></div><p className="row-snippet"><Highlight text={c.snippet} query={debounced} /></p><div className="flex gap-1.5 flex-wrap">{c.tags.map(t => <span className="tag-pill" key={t}>{t}</span>)}</div></Button></div>)}
        </div>
      </section>
      <main className="reader" aria-label="Conversation reader">
        <div className="reader-toolbar"><div className="flex items-center gap-2 text-muted-foreground"><Button variant="ghost" size="icon" className="mobile-back" aria-label="Back to conversations" onClick={() => setMobileOpen(false)}><ArrowLeft /></Button><FileText size={13} /><span className="text-[10px]">{conversation?.messages[0]?.role === 'note' ? 'Note' : 'Conversation'}</span></div><Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Conversation actions" title="Conversation actions" disabled={!conversation}><MoreHorizontal /></Button></PopoverTrigger><PopoverContent align="end" className="w-44 p-1"><Button variant="ghost" className="w-full justify-start text-destructive text-xs" onClick={() => { setActionError(''); setDeleteOpen(true); }}><Trash2 />Delete conversation</Button></PopoverContent></Popover></div>
        <div className="reader-scroll">{detail.isPending && selected ? <div><div className="skeleton-line w-3/4" /><div className="skeleton-line w-1/3" /><div className="mt-12">{[1, 2, 3, 4].map(i => <div className="skeleton-line" key={i} />)}</div></div> : detail.error ? <div className="empty-state"><p>{detail.error.message}</p><Button variant="link" onClick={() => detail.refetch()}>Try again</Button></div> : !conversation ? <div className="empty-state"><FileText className="mx-auto mb-4" /><p>Select a conversation to settle into.</p></div> : <div className="reader-content">
          {editing ? <input autoFocus className="reader-title title-edit" aria-label="Conversation title" value={titleDraft} onChange={e => setTitleDraft(e.target.value)} onBlur={saveTitle} onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { e.preventDefault(); setEditing(false); } }} /> : <h1 className="reader-title"><Button variant="ghost" className="text-inherit font-inherit h-auto p-0 block text-left whitespace-normal hover:bg-transparent" title="Edit title" aria-label="Edit conversation title" onClick={() => { setTitleDraft(conversation.title); setEditing(true); }}>{conversation.title}</Button></h1>}
          <div className="reader-metadata"><span>{longDate(conversation.created_at)}</span><span>·</span><span>{conversation.source}</span><span>·</span><span>{conversation.messages.length} {conversation.messages.length === 1 ? 'message' : 'messages'}</span></div>
          <div className="reader-tags">{conversation.tags.map(t => <span className="tag-pill" key={t}>{t}<Button variant="ghost" className="h-4 w-3 p-0 [&_svg]:size-2.5" aria-label={`Remove tag ${t}`} disabled={patch.isPending} onClick={() => patch.mutate({ tags: conversation.tags.filter(item => item !== t) })}><X /></Button></span>)}{addingTag ? <form className="flex items-center gap-1" onSubmit={e => { e.preventDefault(); addTag(); }}><input autoFocus className="bg-transparent border-b border-border text-[11px] w-24" aria-label="New tag" value={tagDraft} onChange={e => setTagDraft(e.target.value)} /><Button variant="ghost" className="h-5 w-5 p-0" aria-label="Save tag" type="submit"><Check /></Button></form> : <Button variant="ghost" className="h-6 px-1 text-[10px] text-muted-foreground gap-1" onClick={() => setAddingTag(true)}><Plus className="size-3" />Add tag</Button>}</div>
          {actionError && <p role="alert" className="text-xs text-destructive mt-4">{actionError}</p>}
          {conversation.messages.map((message, i) => <article className={`message ${message.role}`} key={i}><div className="message-label">{message.role === 'user' ? <UserRound /> : message.role === 'assistant' ? <Sparkles /> : <FileText />}<span>{message.role === 'user' ? 'You' : message.role === 'assistant' ? conversation.source : 'Note'}</span></div><div className="prose"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ table: ({ children }) => <div className="table-wrap"><table>{children}</table></div>, a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer">{children}</a> }}>{message.content}</ReactMarkdown></div></article>)}
          <div className="text-[10px] text-muted-foreground border-t border-border mt-10 pt-5 flex items-center gap-2"><Check size={11} />{api.mode === 'sample' ? 'Sample conversation' : 'Saved in your local archive'}</div>
        </div>}</div>
      </main>
    </div>
    <Dialog open={noteOpen} onOpenChange={setNoteOpen}><DialogContent aria-describedby="note-description" className="max-w-xl"><DialogTitle className="font-medium">New note</DialogTitle><DialogDescription id="note-description" className="text-xs">{api.mode === 'sample' ? 'Sample archive · this session only' : 'Your local archive'}</DialogDescription><form className="space-y-5" onSubmit={e => { e.preventDefault(); create.mutate(); }}><label className="form-label">Title<input required autoFocus className="form-field" placeholder="A thought worth keeping" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} /></label><label className="form-label">Note<textarea required className="form-field min-h-56 resize-y" placeholder="Write your note…" value={noteContent} onChange={e => setNoteContent(e.target.value)} /></label><label className="form-label">Tags<input className="form-field" placeholder="ideas, life" value={noteTags} onChange={e => setNoteTags(e.target.value)} /></label>{actionError && <p role="alert" className="text-xs text-destructive">{actionError}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setNoteOpen(false)}>Cancel</Button><Button type="submit" disabled={create.isPending || !noteTitle.trim() || !noteContent.trim()}><Check />{create.isPending ? 'Saving…' : 'Save note'}</Button></div></form></DialogContent></Dialog>
    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent><DialogTitle className="font-medium">Delete this conversation?</DialogTitle><DialogDescription>“{conversation?.title}” will be permanently removed from {api.mode === 'sample' ? 'this sample session' : 'your local archive'}. This cannot be undone.</DialogDescription>{actionError && <p role="alert" className="text-xs text-destructive">{actionError}</p>}<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setDeleteOpen(false)}>Keep conversation</Button><Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate()}><Trash2 />{remove.isPending ? 'Deleting…' : 'Delete'}</Button></div></DialogContent></Dialog>
  </>;
}
