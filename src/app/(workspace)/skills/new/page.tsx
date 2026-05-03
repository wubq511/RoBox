import { ItemForm } from "@/components/library/item-form";
import { GithubImportForm } from "@/components/library/github-import-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSkillAction } from "@/server/items/actions";

export default async function NewSkillPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6 lg:px-8 lg:py-8">
      <Card className="rounded-[28px] border-border/70">
        <CardContent className="pt-6">
          <GithubImportForm />
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-border/70">
        <CardHeader className="gap-3 border-b border-border/70 pb-5">
          <CardTitle className="text-3xl tracking-[-0.04em]">新建 Skill</CardTitle>
          <CardDescription className="text-sm leading-6">
            粘贴 SKILL.md 内容，先保存，之后再完善摘要和标签。
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ItemForm
            type="skill"
            action={createSkillAction}
            submitLabel="保存 Skill"
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
