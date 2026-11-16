import { createSampleConversations, type Conversation, type ConversationSummary } from './mock-data';
export type { Conversation, ConversationSummary, Message, Source } from './mock-data';
export interface TagCount { tag: string; count: number }
export interface SearchResult { conversation_id: string; title: string; snippet: string; score: number }
export interface Filters { tag?: string; source?: string; limit?: number; archived?: boolean | 'all' }
export class ApiError extends Error {}
export class ArchiveApi {
  baseUrl: string;
  mode: 'connecting' | 'local' | 'sample' = 'connecting';
  private samples: Conversation[] = createSampleConversations();
  constructor(baseUrl = 'http://localhost:8765') { this.baseUrl = baseUrl.replace(/\/$/, ''); }
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, { ...options, signal: AbortSignal.timeout(4000), headers: { 'Content-Type': 'application/json', ...options.headers } });
    } catch { throw new TypeError('Local API is unreachable'); }
    if (!response.ok) throw new ApiError(`Local API returned ${response.status}. Please try again.`);
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
  async connect(): Promise<ConversationSummary[]> {
    if (this.mode === 'sample') return this.list({ archived: 'all' });
    try {
      const rows = await this.request<ConversationSummary[]>('/api/conversations?archived=all&limit=1000');
      this.mode = 'local'; return rows;
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      this.mode = 'sample'; return this.list({ archived: 'all' });
    }
  }
  async list(filters: Filters = {}): Promise<ConversationSummary[]> {
    const archived = filters.archived ?? false;
    if (this.mode === 'sample') return this.samples.filter(c => (archived === 'all' || Boolean(c.archived) === archived) && (!filters.tag || c.tags.includes(filters.tag)) && (!filters.source || c.source === filters.source)).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, filters.limit ?? 1000).map(({ messages, ...summary }) => ({ ...summary, tags: [...summary.tags] }));
    const params = new URLSearchParams({ limit: String(filters.limit ?? 1000) });
    if (archived !== false) params.set('archived', String(archived));
    if (filters.tag) params.set('tag', filters.tag);
    if (filters.source) params.set('source', filters.source);
    return this.request(`/api/conversations?${params}`);
  }
  async get(id: string): Promise<Conversation> {
    if (this.mode !== 'sample') return this.request(`/api/conversations/${encodeURIComponent(id)}`);
    const found = this.samples.find(c => c.id === id);
    if (!found) throw new ApiError('This conversation is no longer in the archive.');
    return { ...found, tags: [...found.tags], messages: found.messages.map(m => ({ ...m })) };
  }
  async tags(): Promise<TagCount[]> {
    if (this.mode !== 'sample') return this.request('/api/tags');
    const counts = new Map<string, number>();
    this.samples.forEach(c => c.tags.forEach(t => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => a.tag.localeCompare(b.tag));
  }
  async search(q: string, includeArchived = false): Promise<SearchResult[]> {
    if (this.mode !== 'sample') return this.request(`/api/search?${new URLSearchParams({ q, k: '20', ...(includeArchived ? { include_archived: 'true' } : {}) })}`);
    const term = q.toLocaleLowerCase();
    return this.samples.filter(c => (includeArchived || !c.archived) && `${c.title} ${c.tags.join(' ')} ${c.messages.map(m => m.content).join(' ')}`.toLocaleLowerCase().includes(term)).slice(0, 20).map(c => {
      const content = [c.snippet, ...c.messages.map(m => m.content)].find(s => s.toLocaleLowerCase().includes(term)) ?? c.snippet;
      const index = content.toLocaleLowerCase().indexOf(term);
      const start = Math.max(0, index - 45);
      return { conversation_id: c.id, title: c.title, snippet: `${start ? '…' : ''}${content.slice(start, start + 160).replace(/\n/g, ' ')}`, score: 1 };
    });
  }
  async patch(id: string, changes: { title?: string; tags?: string[]; archived?: boolean }): Promise<void> {
    if (this.mode !== 'sample') { await this.request(`/api/conversations/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(changes) }); return; }
    const found = this.samples.find(c => c.id === id);
    if (!found) throw new ApiError('Conversation not found.');
    Object.assign(found, changes);
    if (changes.archived !== undefined) found.archived_at = changes.archived ? new Date().toISOString() : null;
  }
  async delete(id: string): Promise<void> {
    if (this.mode !== 'sample') { await this.request(`/api/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' }); return; }
    this.samples = this.samples.filter(c => c.id !== id);
  }
  async note(input: { title: string; content: string; tags: string[] }): Promise<{ id: string }> {
    if (this.mode !== 'sample') return this.request('/api/notes', { method: 'POST', body: JSON.stringify(input) });
    const id = crypto.randomUUID(); const created_at = new Date().toISOString();
    this.samples.unshift({ id, title: input.title, tags: input.tags, source: 'manual', created_at, archived: false, archived_at: null, snippet: input.content.replace(/[#*`\n]/g, ' ').slice(0, 160), messages: [{ role: 'note', content: input.content, created_at }] });
    return { id };
  }
}
let browserApi: ArchiveApi | undefined;
export function getApi(): ArchiveApi {
  if (typeof window === 'undefined') throw new Error('The local archive is browser-only.');
  browserApi ??= new ArchiveApi(window.localStorage.getItem('memvault-api-url') ?? undefined);
  return browserApi;
}
export const archiveOptions = () => ({ queryKey: ['archive', 'all'], queryFn: () => getApi().connect(), staleTime: Infinity, retry: false });
