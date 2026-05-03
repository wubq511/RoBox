# RoBox 上线清单

> 目标：将 RoBox 从本地开发状态推到可正常使用的线上环境。
> 前提：Phase 1-5 功能开发已完成，代码在 `main` 分支。

---

## Phase A：Supabase 云项目（✅ 已完成 2026-05-03）

### A1. 创建 Supabase 云项目

- 在 [supabase.com](https://supabase.com) 创建新项目，项目名 `robox`，选择离用户近的区域
- 记录以下值，后续配置要用：
  - `Project URL`（形如 `https://xxxx.supabase.co`）
  - `Publishable Key`（在 Project Settings → API 里找）
  - `Service Role Key`（同上，仅备用，当前代码未使用）

### A2. 执行数据库迁移

- 在 Supabase Dashboard → SQL Editor 中，逐条执行 `supabase/migrations/202605010001_phase2_foundation.sql` 的内容
- 执行完后在 Table Editor 确认三张表已创建：`items`、`prompt_variables`、`usage_logs`
- 确认 RLS 已启用（每张表的 Auth → RLS 应显示为 enabled）

### A3. 配置 Auth URL

- Supabase Dashboard → Authentication → URL Configuration
- `Site URL` 设置为生产域名（如 `https://robox.vercel.app`，先填 Vercel 分配的域名，绑了自定义域名后再改）
- `Redirect URLs` 添加：`https://robox.vercel.app/auth/confirm`
- 如果后续绑了自定义域名，两个地方都要同步更新

### A4. 配置邮件模板（可选）

- Supabase Dashboard → Authentication → Email Templates → Magic Link
- 当前项目有自定义模板 `supabase/templates/mmagic_link.html`，可以粘贴进去替换默认模板
- 注意：模板里 `{{ .Token }}` 会暴露原始验证码，建议只保留 `{{ .ConfirmationURL }}` 链接形式
- 免费版 Supabase 每小时发信限额约 3-4 封，够单用户用；量大时需配置自定义 SMTP（Resend / SendGrid）

---

## Phase B：代码修复（✅ 已完成 2026-05-03）

### B1. 创建标准 middleware.ts

当前状态：`src/lib/supabase/proxy.ts` 里写了 `updateSession` 但从未接入 Next.js middleware pipeline。项目根目录的 `proxy.ts` 不是标准做法。

需要做：
- 在项目根目录或 `src/` 下创建标准的 `middleware.ts`
- 内容参考 `src/lib/supabase/proxy.ts` 中的 `updateSession` 逻辑
- 确保 matcher 配置排除静态资源（`_next/static`、`_next/image`、`favicon.ico`）
- 参考 Supabase SSR 官方文档：https://supabase.com/docs/guides/auth/server-side/nextjs

### B2. 确认 NEXT_PUBLIC_APP_ORIGIN 的 fallback

- 检查 `src/lib/env.ts`，确保当 `NEXT_PUBLIC_APP_ORIGIN` 未设置时不会 fallback 到 `localhost`
- 或者在 Vercel 环境变量中确保该变量一定被设置（推荐后者，更简单）

### B3. 轮换 DeepSeek API Key（如果仓库曾公开）

- `.env.local` 中的 `sk-3e0aa52ced704b58b9bb4eaaba5a50f0` 如果曾被 commit 到 git 历史中，需要在 DeepSeek 控制台轮换
- 确认 `.gitignore` 包含 `.env.local`（已确认包含）

### B4. 补齐错误与加载页面

创建以下文件，提供基本的用户体验：

- `src/app/not-found.tsx` — 自定义 404 页面
- `src/app/error.tsx` — 全局错误边界（需要 `"use client"`）
- `src/app/loading.tsx` — 全局加载态（可选，或在 `(workspace)/loading.tsx` 做）

### B5. 补齐 favicon 和静态资源

- 创建 `public/` 目录
- 放入 `favicon.ico`（可以用文字生成工具生成一个简单的）
- 可选：`public/icon.png`、`public/apple-touch-icon.png`

### B6. 统一 UI 语言

当前中英混杂，需要统一。建议统一为中文（因为用户是中国学生），涉及文件：

- `src/app/layout.tsx` — `lang="zh-CN"` 已正确，但需要检查 `<title>` 等
- `src/components/dashboard/dashboard-view.tsx` — 描述文字已是中文，确认一致性
- `src/components/settings/settings-view.tsx` — 英文描述改为中文
- `src/components/layout/app-sidebar.tsx` — "Library health: 72%" 是硬编码假数据，删除或替换为真实统计
- `src/app/login/page.tsx` — 检查登录页语言一致性

### B7. 清理侧边栏假数据

- `src/components/layout/app-sidebar.tsx` 中 "Library health: 72%" 和 "OK" 状态是硬编码的装饰数据
- 删除这段内容，或者替换为真实的统计数据（如 total items 数量）

---

## Phase C：Vercel 部署（✅ 已完成 2026-05-03）

### C1. 连接仓库

- 在 [vercel.com](https://vercel.com) 新建项目
- Import 你的 GitHub 仓库
- Framework Preset 自动识别为 Next.js，保持默认

### C2. 配置环境变量

在 Vercel 项目 Settings → Environment Variables 中添加：

| Key | Value | 说明 |
|-----|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | A1 拿到的 Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb-xxxx` | A1 拿到的 Publishable Key |
| `NEXT_PUBLIC_APP_ORIGIN` | `https://robox.vercel.app` | Vercel 分配的域名 |
| `ALLOWED_EMAILS` | `你的真实邮箱` | 登录白名单，逗号分隔多个 |
| `DEEPSEEK_API_KEY` | `sk-xxxx` | DeepSeek API Key |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` | 保持默认 |
| `DEEPSEEK_API_BASE_URL` | `https://api.deepseek.com` | 保持默认 |
| `GITHUB_TOKEN` | `ghp_xxxx` | 可选，GitHub PAT，避免 API 限流 |

### C3. 首次部署

- Vercel 会自动触发 build
- 如果 build 失败，检查 Vercel 的 Build Logs
- 常见问题：
  - TypeScript 类型错误 → 本地先跑 `npm run typecheck` 确认
  - 环境变量缺失 → 确认所有变量都配了
  - Node 版本不兼容 → 在 Vercel Settings → General → Node Version 设为 20.x

### C4. 部署后验证

- 访问生产域名，确认能打开登录页
- 输入白名单邮箱，确认能收到 magic link
- 点击链接，确认能登录进入 Dashboard
- 测试新建 Prompt、搜索、编辑、删除、收藏、复制
- 测试新建 Skill、GitHub 导入、智能整理
- 测试 Settings 页面能正常显示

---

## Phase D：上线后收口（✅ 已完成 2026-05-03）

### D1. 安全响应头

在 `next.config.ts` 中添加 `headers` 配置：

```ts
headers: [
  {
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ],
  },
],
```

### D2. API 路由显式鉴权

当前 `/api/items/[id]/analyze` 和 `/api/import/github` 依赖下游隐式鉴权。建议在路由 handler 开头加显式 auth 检查：

```ts
const user = await getOptionalAppUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### D3. 清理 .env.example

- 删除 `SUPABASE_SERVICE_ROLE_KEY`（代码未使用）
- 删除 `GITHUB_TOKEN` 如果确认不需要
- 或者保留作为文档，标注为可选

### D4. 列表分页（后续迭代）

- Prompts/Skills 列表当前最多返回 50 条
- 数据量增长后需要实现分页或无限滚动

---

## 验收 Checklist

完成上述所有步骤后，逐项确认：

- [x] 生产域名可访问，登录页正常显示
- [x] 白名单邮箱能收到 magic link 并完成登录
- [x] Dashboard 数据统计正确
- [x] 新建 / 编辑 / 删除 Prompt 正常
- [x] 新建 / 编辑 / 删除 Skill 正常
- [x] 搜索、筛选、排序、收藏正常
- [x] 智能整理（DeepSeek）正常返回结构化结果
- [x] GitHub Skill 导入正常
- [x] 复制原始版 / 最终版正常，usage_logs 有记录
- [x] 无中英文混杂，语言统一
- [x] 无硬编码假数据（如 Library health 72%）
- [x] 浏览器 tab 有 favicon 图标
- [x] 遇到错误时有友好提示，不是白屏
