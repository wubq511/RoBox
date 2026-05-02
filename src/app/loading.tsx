export default function LoadingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-5 py-4 text-sm text-muted-foreground">
        <span className="size-2 rounded-full bg-primary" />
        <span>正在加载 RoBox...</span>
      </div>
    </main>
  );
}
