import { ItemForm } from "@/components/library/item-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createPromptAction } from "@/server/items/actions";

export default async function NewPromptPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <Card className="rounded-[28px] border-border/70">
        <CardHeader className="gap-3 border-b border-border/70 pb-5">
          <CardTitle className="text-3xl tracking-[-0.04em]">新建 Prompt</CardTitle>
          <CardDescription className="text-sm leading-6">
            粘贴原始 Prompt，先保存，之后再提炼变量和结构。
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ItemForm
            type="prompt"
            action={createPromptAction}
            submitLabel="保存 Prompt"
            initialValues={{
              title: "",
              summary: "",
              category: "Other",
              tags: [],
              content: "",
              sourceUrl: "",
              variables: [],
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
