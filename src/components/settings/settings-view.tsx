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
      "保存时不调用模型；只有点击智能整理时才请求 DeepSeek。API Key 只放服务端环境变量。",
    icon: SparklesIcon,
  },
  {
    title: "Categories",
    description:
      "固定 Writing、Coding、Research、Design、Study、Agent、Content、Other 八类。标签由模型生成，用户可手改。",
    icon: DatabaseIcon,
  },
  {
    title: "GitHub import",
    description:
      "只允许 github.com 和 raw.githubusercontent.com，第一版不抓任意 URL。",
    icon: GitBranchIcon,
  },
  {
    title: "Data export",
    description:
      "导出 JSON / Markdown 作为后续优化项，当前先保留入口和说明，不做完整备份系统。",
    icon: FolderDownIcon,
  },
];

export function SettingsView() {
  return (
    <section className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">Settings</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          MVP 只保留必要设置入口，不在第一阶段引入多余复杂度。真正的外部服务接入从 Phase 2 和 Phase 4 开始。
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
                  Phase 1 先把入口放稳，具体功能在后续阶段接真实数据和服务端逻辑。
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
