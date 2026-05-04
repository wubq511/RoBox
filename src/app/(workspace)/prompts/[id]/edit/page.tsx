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
import { updatePromptAction } from "@/server/items/actions";

type Params = {
  id: string;
};

export default async function EditPromptPage({
  params,
}: Readonly<{
  params: Promise<Params>;
}>) {
  const { id } = await params;
  const item = await getItemDetail(id);

  if (!item || item.type !== "prompt") {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" asChild>
          <Link href={`/prompts/${item.id}`}>
            <ArrowLeftIcon className="size-4" />
            返回详情
          </Link>
        </Button>
      </div>

      <Card className="rounded-3xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="gap-4 border-b border-border/60 px-6 pb-6 pt-6">
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              PROMPT
            </span>
            <CardTitle className="text-3xl font-semibold tracking-tight">
              编辑 Prompt
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-8">
          <ItemForm
            type="prompt"
            action={updatePromptAction.bind(null, item.id)}
            submitLabel="更新 Prompt"
            initialValues={{
              title: item.title,
              summary: item.summary,
              category: item.category,
              tags: item.tags,
              content: item.content,
              sourceUrl: item.sourceUrl,
              variables: item.variables,
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
