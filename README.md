# RoBox

RoBox 是一个个人 Prompt 与 Skill 管理网页，用来保存、整理、搜索和快速复制你常用的 Prompt 模板与 Skill。

## 当前状态

- `2026-05-01`：Phase 1 已完成并已合并到 `main`
- `2026-05-01`：Phase 2 底座代码已落地，并已通过本地 Supabase runtime 的 magic link 联调
- `2026-05-02`：Phase 3 基础库体验 MVP 已完成、合并并推送到 `main`
- `2026-05-02`：Phase 4 DeepSeek 智能整理已完成、合并并推送到 `main`；已通过本地 `test/typecheck/lint/build` 与本地 Supabase + DeepSeek `deepseek-v4-flash` 真实 E2E 联调
- `2026-05-02`：Phase 5 GitHub Skill 导入与 MVP 收口已完成、合并并推送到 `main`；已通过本地 `test/typecheck/lint/build` 与本地 Supabase + DeepSeek + GitHub 真实浏览器验收
- `2026-05-03`：Phase A/B/C/D 上线流程全部完成，生产环境已部署到 `robox.vercel.app`
- `2026-05-04`：Phase 6 UI 打磨与模型环境变量化已完成；全页面去除开发注释、统一视觉体系；DeepSeek 模型与 Base URL 均改为从环境变量读取
- `2026-05-04`：安全审计与加固已完成；API 路由显式鉴权、安全响应头（CSP/HSTS/X-Frame-Options 等）、速率限制、ILIKE 注入修复、CORS 同源检查、错误信息脱敏、请求体大小限制
- `2026-05-04`：智能分析 Bug 修复（AnalyzeButton 响应格式 `data.ok`→`data.item`、CORS 端口修正、`DEEPSEEK_MODEL` 补全）；环境变量优先级重构——新增 `getServerEnv()` 优先读 `.env.local`，解决系统环境变量静默覆盖项目配置的问题
- 当前已落地：Next.js 16 App Router、统一工作台壳层、`/login`、`/auth/confirm`、工作台登录守卫、Supabase migration、`server/auth`、`server/db`、`server/items`、`lib/schema`
- 当前已落地：真实 Dashboard 聚合、Prompts / Skills 列表、详情、编辑、删除、收藏、复制原文与 `usage_logs` 写入
- 当前已落地：`POST /api/items/:id/analyze`、DeepSeek JSON 解析/修复、整理字段回写、Prompt 变量提取写入、详情页变量填写与 `copy_final`
- 当前已落地：`POST /api/import/github`、GitHub 仓库/README/raw URL 校验、README 抓取、导入为 Skill、基于 README 的智能整理、GitHub Skill 复制 `source_url`
- Supabase 本地 CLI 已改为仓库内安装方案，不依赖全局安装
- 生产环境：Supabase 云项目 `robox`（`ap-northeast-1`），Vercel 项目 `robox`，全站中文 UI

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
- `docs/architecture.md`：当前架构、数据流、DeepSeek 整理链路、复制语义
- `docs/integration-guide.md`：本地接入、环境变量、Route Handler 用法、MVP 冒烟流程
- `PLAN.md`：分阶段实施计划
- `RoBox 最终项目方案.md`：产品边界、数据模型和后续 API 方案
- `RoBox_UI_Prototype/`：已定稿的静态交互原型，仅作视觉与交互参考

## 目录说明

- `src/app`：App Router 路由与共享布局
- `src/app/api`：已实现的 Route Handlers，例如智能整理和 GitHub 导入接口
- `src/components`：按页面和通用 UI 拆分的组件
- `src/hooks`：共享客户端 hooks，包括 toast 通知系统
- `src/features/items`：Prompt / Skill 的类型与查询参数解析
- `src/lib`：环境变量、导航、Supabase 客户端工厂、校验 schema、速率限制、通用工具
- `src/server/auth`：allowlist、会话守卫、magic link actions
- `src/server/analyze`：DeepSeek prompt、模型调用、JSON 解析/修复、整理持久化
- `src/server/db`：`items` / `prompt_variables` / `usage_logs` 访问层
- `src/server/import`：GitHub Skill 导入解析、README 抓取和导入编排
- `src/server/items`：Prompt / Skill 表单解析与 Server Actions
- `supabase`：本地 Supabase 配置、migration、seed
- `supabase/templates`：本地 Supabase auth 邮件模板
- `scripts`：本地 Supabase CLI 安装与调用脚本
- `vendor_imports/tools/supabase`：仓库内 Supabase CLI 二进制，按版本隔离，已加入 git ignore
