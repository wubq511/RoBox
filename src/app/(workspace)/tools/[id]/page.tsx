import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ItemDetailView } from "@/components/library/item-detail-view";
import { getItemDetail } from "@/server/db/items";

type Params = {
  id: string;
};

function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="space-y-6">
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="rounded-[28px] border border-border/70 p-6 space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted" />
          <div className="h-40 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export async function ToolDetailContent({ id }: { id: string }) {
  const item = await getItemDetail(id);

  if (!item || item.type !== "tool") {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <ItemDetailView item={item} returnPath="/tools" />
    </main>
  );
}

export default async function ToolDetailPage({
  params,
}: Readonly<{
  params: Promise<Params>;
}>) {
  const { id } = await params;

  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ToolDetailContent id={id} />
    </Suspense>
  );
}
