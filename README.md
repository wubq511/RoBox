# RoBox

RoBox 是一个个人 Prompt 与 Skill 管理网页，用来保存、整理、搜索和快速复制你常用的 Prompt 模板与 Skill。

## 当前状态

- `2026-05-01`：Phase 1 已完成并已合并到 `main`
- 当前已落地：Next.js 16 App Router、统一工作台壳层、`/dashboard`、`/prompts`、`/skills`、`/settings`
- 当前仍是静态样例数据阶段：还没有接入 Auth、数据库读写和 DeepSeek 调用
- Supabase 本地 CLI 已改为仓库内安装方案，不依赖全局安装

## 快速开始

```bash
npm ci
npm run dev
```

打开：

```text
http://localhost:3000/dashboard
```

根路由 `/` 会自动跳转到 `/dashboard`。

## 常用命令

```bash
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
- `src/features/items`：Prompt / Skill 的类型与静态样例数据
- `src/lib`：环境变量、导航、Supabase 客户端工厂、通用工具
- `scripts`：本地 Supabase CLI 安装与调用脚本
- `.tools/supabase`：仓库内 Supabase CLI 二进制，已加入 git ignore
