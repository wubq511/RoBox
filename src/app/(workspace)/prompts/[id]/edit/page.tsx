import { notFound } from "next/navigation";

import { ItemForm } from "@/components/library/item-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <Card className="rounded-[28px] border-border/70">
        <CardHeader className="gap-3 border-b border-border/70 pb-5">
          <CardTitle className="text-3xl tracking-[-0.04em]">编辑 Prompt</CardTitle>
          <CardDescription className="text-sm leading-6">
            修改已保存的 Prompt，继续使用原有的详情和复制流程。
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
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
