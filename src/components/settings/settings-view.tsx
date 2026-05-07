"use client";

import { useState } from "react";
import {
  DatabaseIcon,
  FolderDownIcon,
  GitBranchIcon,
  SparklesIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryManager } from "@/components/settings/category-manager";
import type { ItemType } from "@/lib/schema/items";

const settingsCards = [
  {
    title: "DeepSeek API",
    description: "配置 AI 模型用于智能整理内容。",
    detail: "在服务端环境变量中设置 DEEPSEEK_API_KEY 即可启用。",
    icon: SparklesIcon,
  },
  {
    title: "GitHub 导入",
    description: "从 GitHub 仓库导入 Skill 或 Tool。",
    detail: "支持 github.com 和 raw.githubusercontent.com 链接。",
    icon: GitBranchIcon,
  },
  {
    title: "数据导出",
    description: "导出你的 Prompt、Skill 和 Tool 数据。",
    detail: "即将支持 JSON 和 Markdown 格式导出。",
    icon: FolderDownIcon,
  },
];

type CategoryTab = "prompt" | "skill" | "tool";

export function SettingsView() {
  const [categoryTab, setCategoryTab] = useState<CategoryTab>("prompt");

  return (
    <section className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">设置</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          配置外部服务和数据管理选项。
        </p>
      </div>

      <Card className="rounded-[28px] border-border/70 shadow-[0_18px_42px_-34px_rgba(17,17,17,0.28)]">
        <CardHeader className="gap-4">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <DatabaseIcon className="size-5" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl">自定义分类</CardTitle>
            <CardDescription className="text-sm leading-6">
              分别管理 Prompt、Skill 和 Tool 的分类，支持自定义增删和排序。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1">
              <button
                onClick={() => setCategoryTab("prompt")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  categoryTab === "prompt"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Prompt 分类
              </button>
              <button
                onClick={() => setCategoryTab("skill")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  categoryTab === "skill"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Skill 分类
              </button>
              <button
                onClick={() => setCategoryTab("tool")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  categoryTab === "tool"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Tool 分类
              </button>
            </div>
            <CategoryManager type={categoryTab as ItemType} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card
              key={card.title}
              className="rounded-[28px] border-border/70 shadow-[0_18px_42px_-34px_rgba(17,17,17,0.28)]"
            >
              <CardHeader className="gap-4">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-foreground">
                  <Icon className="size-5" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                  <CardDescription className="text-sm leading-6">
                    {card.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  {card.detail}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
