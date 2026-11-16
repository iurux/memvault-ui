import { describe, expect, it, vi, afterEach } from 'vitest';
import { ArchiveApi, ApiError } from './api';
afterEach(() => vi.unstubAllGlobals());
describe('local archive contract', () => {
  it('uses 12 sample conversations only when the local API cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    const api = new ArchiveApi();
    expect(await api.connect()).toHaveLength(12);
    expect(api.mode).toBe('sample');
  });
  it('does not disguise HTTP errors as sample data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
    await expect(new ArchiveApi().connect()).rejects.toBeInstanceOf(ApiError);
  });
  it('combines tag and source filters and sorts newest first', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError()));
    const api = new ArchiveApi(); await api.connect();
    const list = await api.list({ tag: 'learning', source: 'claude' });
    expect(list.map(c => c.id)).toEqual(['os']);
    const all = await api.list(); expect(all[0]?.id).toBe('soup');
  });
  it('searches Chinese content and limits search to 20 results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError()));
    const api = new ArchiveApi(); await api.connect();
    expect((await api.search('番茄')).map(c => c.conversation_id)).toEqual(['recipe']);
    for (let i = 0; i < 22; i++) await api.note({ title: `Needle ${i}`, content: 'Needle', tags: [] });
    expect(await api.search('Needle')).toHaveLength(20);
  });
  it('creates, edits and deletes notes without touching the local API in sample mode', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError()); vi.stubGlobal('fetch', fetchMock);
    const api = new ArchiveApi(); await api.connect();
    const { id } = await api.note({ title: 'New note', content: 'Hello', tags: ['test'] });
    await api.patch(id, { title: 'Changed', tags: ['life'] });
    expect((await api.get(id)).title).toBe('Changed');
    expect((await api.get(id)).tags).toEqual(['life']);
    await api.delete(id); await expect(api.get(id)).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('sends the specified search and mutation contract to the configured API', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response('[]')); vi.stubGlobal('fetch', fetchMock);
    const api = new ArchiveApi('http://localhost:8765/'); await api.connect(); await api.search('bread');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('http://localhost:8765/api/search?q=bread&k=20');
    await api.patch('soup', { title: 'Updated' });
    expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({ method: 'PATCH', body: '{"title":"Updated"}' });
  });
});
