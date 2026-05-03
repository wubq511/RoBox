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
import { updateSkillAction } from "@/server/items/actions";

type Params = {
  id: string;
};

export default async function EditSkillPage({
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
      <Card className="rounded-[28px] border-border/70">
        <CardHeader className="gap-3 border-b border-border/70 pb-5">
          <CardTitle className="text-3xl tracking-[-0.04em]">编辑 Skill</CardTitle>
          <CardDescription className="text-sm leading-6">
            修改已保存的 Skill、来源链接和元数据，不影响复制流程。
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ItemForm
            type="skill"
            action={updateSkillAction.bind(null, item.id)}
            submitLabel="更新 Skill"
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
