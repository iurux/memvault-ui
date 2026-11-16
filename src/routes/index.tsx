import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { Component, Suspense, type ReactNode } from 'react';
import Memvault, { ArchiveSkeleton } from '@/components/archive/memvault';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'memvault — Your personal archive' },
    { name: 'description', content: 'A quiet, local-first space for saved AI conversations and notes.' },
    { property: 'og:title', content: 'memvault — Your personal archive' },
    { property: 'og:description', content: 'A quiet, local-first space for saved AI conversations and notes.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Index,
});
class ArchiveBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  override state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  override render() { return this.state.error ? <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8"><div className="wordmark">memvault</div><p className="text-sm text-muted-foreground">{this.state.error.message}</p><Button variant="outline" onClick={() => window.location.reload()}>Try again</Button></div> : this.props.children; }
}
function Index() { return <ClientOnly fallback={<ArchiveSkeleton />}><ArchiveBoundary><Suspense fallback={<ArchiveSkeleton />}><Memvault /></Suspense></ArchiveBoundary></ClientOnly>; }
