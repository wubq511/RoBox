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

const settingsCards = [
  {
    title: "DeepSeek API",
    description: "配置 AI 模型用于智能整理内容。",
    detail: "在服务端环境变量中设置 DEEPSEEK_API_KEY 即可启用。",
    icon: SparklesIcon,
  },
  {
    title: "固定分类",
    description: "使用预设分类管理你的 Prompt 和 Skill。",
    detail: "支持 Writing、Coding、Research、Design、Study、Agent、Content、Other 分类。",
    icon: DatabaseIcon,
  },
  {
    title: "GitHub 导入",
    description: "从 GitHub 仓库导入 Skill 文件。",
    detail: "支持 github.com 和 raw.githubusercontent.com 链接。",
    icon: GitBranchIcon,
  },
  {
    title: "数据导出",
    description: "导出你的 Prompt 和 Skill 数据。",
    detail: "即将支持 JSON 和 Markdown 格式导出。",
    icon: FolderDownIcon,
  },
];

export function SettingsView() {
  return (
    <section className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">设置</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          配置外部服务和数据管理选项。
        </p>
      </div>

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
