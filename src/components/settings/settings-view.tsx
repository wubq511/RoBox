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
    description:
      "保存时不调用模型；手动智能整理和 GitHub 导入整理才请求 DeepSeek。",
    detail:
      "服务端环境变量：DEEPSEEK_API_KEY。可选：DEEPSEEK_MODEL 默认 deepseek-v4-flash，DEEPSEEK_API_BASE_URL 默认 https://api.deepseek.com。",
    icon: SparklesIcon,
  },
  {
    title: "固定分类",
    description:
      "固定分类，不开放动态分类配置，避免第一版变成通用知识库。",
    detail:
      "允许分类：Writing, Coding, Research, Design, Study, Agent, Content, Other。标签仍然可以按条目手动编辑。",
    icon: DatabaseIcon,
  },
  {
    title: "GitHub 导入",
    description:
      "只允许 GitHub 仓库、README 链接和 raw README/SKILL.md 链接。",
    detail:
      "允许域名：github.com 和 raw.githubusercontent.com。可选 GITHUB_TOKEN 只放服务端，用于降低 API 限流影响。",
    icon: GitBranchIcon,
  },
  {
    title: "数据导出",
    description:
      "导出 JSON / Markdown 是后续优化项，本阶段只保留清晰占位。",
    detail: "仅占位：MVP 收口阶段还没有实现 JSON / Markdown 导出。",
    icon: FolderDownIcon,
  },
];

export function SettingsView() {
  return (
    <section className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">设置</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          MVP 保留外部服务、固定分类和导出占位说明；当前不引入多用户配置面板。
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
