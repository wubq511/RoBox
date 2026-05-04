import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { ItemForm } from "@/components/library/item-form";
import { GitHubImportForm } from "@/components/library/github-import-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSkillAction } from "@/server/items/actions";

export default async function NewSkillPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-2">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" asChild>
          <Link href="/skills">
            <ArrowLeftIcon className="size-4" />
            返回列表
          </Link>
        </Button>
      </div>

      <Card className="rounded-3xl border-border/60 shadow-sm overflow-hidden">
        <CardContent className="px-6 py-6">
          <GitHubImportForm />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="gap-4 border-b border-border/60 px-6 pb-6 pt-6">
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              SKILL
            </span>
            <CardTitle className="text-3xl font-semibold tracking-tight">
              新建 Skill
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-8">
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
