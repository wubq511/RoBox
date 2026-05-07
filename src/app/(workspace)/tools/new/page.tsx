import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { GitHubImportForm } from "@/components/library/github-import-form";
import { ItemForm } from "@/components/library/item-form";
import { WebImportForm } from "@/components/library/web-import-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAppUser } from "@/server/auth/session";
import { getUserCategoryNames, ensureDefaultCategories } from "@/server/db/categories";
import { createToolAction } from "@/server/items/actions";

export default async function NewToolPage() {
  const user = await requireAppUser();
  await ensureDefaultCategories(user.id);
  const categories = await getUserCategoryNames(user.id, "tool");

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-2">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" asChild>
          <Link href="/tools">
            <ArrowLeftIcon className="size-4" />
            返回列表
          </Link>
        </Button>
      </div>

      <Card className="rounded-3xl border-border/60 shadow-sm overflow-hidden">
        <CardContent className="px-6 py-6">
          <GitHubImportForm type="tool" />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60 shadow-sm overflow-hidden">
        <CardContent className="px-6 py-6">
          <WebImportForm />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="gap-4 border-b border-border/60 px-6 pb-6 pt-6">
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              TOOL
            </span>
            <CardTitle className="text-3xl font-semibold tracking-tight">
              新建 Tool
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-8">
          <ItemForm
            type="tool"
            action={createToolAction}
            submitLabel="保存 Tool"
            categories={categories}
            initialValues={{
              title: "",
              summary: "",
              category: categories[0] ?? "Other",
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
