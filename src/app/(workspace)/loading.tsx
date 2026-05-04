export default function WorkspaceLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="fixed left-0 top-0 hidden h-screen w-[260px] flex-col overflow-y-auto border-r border-border/60 bg-sidebar lg:flex">
          <div className="flex h-[60px] items-center gap-3 px-6">
            <div className="size-[34px] animate-pulse rounded-xl bg-muted" />
            <div className="space-y-1.5">
              <div className="h-4 w-14 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <nav className="grid gap-1 px-3 pt-4 pb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex h-10 items-center gap-3 rounded-[10px] px-3">
                <div className="size-[18px] animate-pulse rounded bg-muted" />
                <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col lg:pl-[260px]">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
            <div className="flex h-16 items-center justify-center gap-4 px-4 lg:px-6">
              <div className="w-full max-w-xl">
                <div className="h-8 w-full animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8">
              <div className="space-y-4">
                <div className="rounded-[28px] border border-border/70 p-6">
                  <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                  <div className="mt-4 h-10 w-full animate-pulse rounded-[24px] bg-muted" />
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-40 animate-pulse rounded-[24px] bg-muted" />
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
