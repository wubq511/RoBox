import { notFound } from "next/navigation";

import { ItemDetailView } from "@/components/library/item-detail-view";
import { getItemDetail } from "@/server/db/items";

type Params = {
  id: string;
};

export default async function SkillDetailPage({
  params,
}: Readonly<{
  params: Promise<Params>;
}>) {
  const { id } = await params;
  const item = await getItemDetail(id);

  if (!item || item.type !== "skill") {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <ItemDetailView item={item} returnPath="/skills" />
    </main>
  );
}
