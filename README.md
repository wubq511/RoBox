# RoBox

RoBox 是一个个人 Prompt 与 Skill 管理网页，用来保存、整理、搜索和快速复制你常用的 Prompt 模板与 Skill。

## 当前状态

- `2026-05-01`：Phase 1 已完成并已合并到 `main`
- `2026-05-01`：Phase 2 底座代码已落地，并已通过本地 Supabase runtime 的 magic link 联调
- `2026-05-02`：Phase 3 基础库体验 MVP 已完成、合并并推送到 `main`
- `2026-05-02`：Phase 4 DeepSeek 智能整理代码已落地，并通过本地 `test/typecheck/lint/build`；真实模型联调需要配置 `DEEPSEEK_API_KEY`
- 当前已落地：Next.js 16 App Router、统一工作台壳层、`/login`、`/auth/confirm`、工作台登录守卫、Supabase migration、`server/auth`、`server/db`、`server/items`、`lib/schema`
- 当前已落地：真实 Dashboard 聚合、Prompts / Skills 列表、详情、编辑、删除、收藏、复制原文与 `usage_logs` 写入
- 当前已落地：`POST /api/items/:id/analyze`、DeepSeek JSON 解析/修复、整理字段回写、Prompt 变量提取写入、详情页变量填写与 `copy_final`
- Supabase 本地 CLI 已改为仓库内安装方案，不依赖全局安装

## 快速开始

```bash
npm ci
npm run dev
```

打开：

```text
http://localhost:3000/login
```

根路由 `/` 会自动跳转到 `/dashboard`；未登录时工作台路由会再跳转到 `/login`。

如果你要跑本地 Supabase runtime，当前约定端口是：

```text
API     http://127.0.0.1:55421
Studio  http://127.0.0.1:55423
Mailpit http://127.0.0.1:55424
DB      postgresql://postgres:postgres@127.0.0.1:55432/postgres
```

## 常用命令

```bash
npm run test
npm run lint
npm run typecheck
npm run build
npm run supabase:install
npm run supabase:version
npm run supabase:init
npm run supabase:start
npm run supabase:status
npm run supabase:stop
```

## 文档索引

- `docs/setup.md`：本地启动、环境变量、Supabase 本地开发约定
- `PLAN.md`：分阶段实施计划
- `RoBox 最终项目方案.md`：产品边界、数据模型和后续 API 方案
- `RoBox_UI_Prototype/`：已定稿的静态交互原型，仅作视觉与交互参考

## 目录说明

- `src/app`：App Router 路由与共享布局
- `src/components`：按页面和通用 UI 拆分的组件
- `src/features/items`：Prompt / Skill 的类型与查询参数解析
- `src/lib`：环境变量、导航、Supabase 客户端工厂、校验 schema、通用工具
- `src/server/auth`：allowlist、会话守卫、magic link actions
- `src/server/db`：`items` / `prompt_variables` / `usage_logs` 访问层
- `src/server/items`：Prompt / Skill 表单解析与 Server Actions
- `supabase`：本地 Supabase 配置、migration、seed
- `supabase/templates`：本地 Supabase auth 邮件模板
- `scripts`：本地 Supabase CLI 安装与调用脚本
- `vendor_imports/tools/supabase`：仓库内 Supabase CLI 二进制，按版本隔离，已加入 git ignore
