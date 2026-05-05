import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { ItemForm } from "@/components/library/item-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getItemDetail } from "@/server/db/items";
import { getUserCategoryNames, ensureDefaultCategories } from "@/server/db/categories";
import { requireAppUser } from "@/server/auth/session";
import { updateSkillAction } from "@/server/items/actions";

type Params = {
  id: string;
};

function EditSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <div className="h-9 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="rounded-3xl border border-border/60 overflow-hidden">
        <div className="space-y-2 border-b border-border/60 px-6 py-6">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-4 px-6 py-8">
          <div className="h-10 animate-pulse rounded bg-muted" />
          <div className="h-10 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export async function EditSkillContent({ id }: { id: string }) {
  const item = await getItemDetail(id);

  if (!item || item.type !== "skill") {
    notFound();
  }

  const user = await requireAppUser();
  await ensureDefaultCategories(user.id);
  const categories = await getUserCategoryNames(user.id, "skill");

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" asChild>
          <Link href={`/skills/${item.id}`}>
            <ArrowLeftIcon className="size-4" />
            返回详情
          </Link>
        </Button>
      </div>

      <Card className="rounded-3xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="gap-4 border-b border-border/60 px-6 pb-6 pt-6">
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              SKILL
            </span>
            <CardTitle className="text-3xl font-semibold tracking-tight">
              编辑 Skill
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-8">
          <ItemForm
            type="skill"
            action={updateSkillAction.bind(null, item.id)}
            submitLabel="更新 Skill"
            categories={categories}
            initialValues={{
              title: item.title,
              summary: item.summary,
              category: item.category,
              tags: item.tags,
              content: item.content,
              sourceUrl: item.sourceUrl,
              variables: [],
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}

export default async function EditSkillPage({
  params,
}: Readonly<{
  params: Promise<Params>;
}>) {
  const { id } = await params;

  return (
    <Suspense fallback={<EditSkeleton />}>
      <EditSkillContent id={id} />
    </Suspense>
  );
}
