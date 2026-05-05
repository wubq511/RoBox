# RoBox

RoBox 是一个个人 Prompt 与 Skill 管理工具，用来保存、整理、搜索和快速复制你常用的 Prompt 模板与 Skill。

核心定位很清晰：只做 `prompt` 和 `skill` 两类内容，围绕「保存 → 整理 → 搜索 → 复制使用」这一闭环，不扩展为通用知识库或 Agent 平台。

## 功能概览

| 功能 | 说明 |
|------|------|
| **工作台** | Dashboard 聚合展示最近使用、收藏、待整理的内容 |
| **Prompt 管理** | 创建、编辑、删除、收藏、搜索、分类、标签过滤 |
| **Skill 管理** | 同上，额外支持从 GitHub 仓库导入 Skill |
| **自定义分类** | 设置页按 Prompt/Skill 分别管理分类，支持增删和排序 |
| **智能整理** | 基于 DeepSeek 自动提取标题、摘要、分类、标签和 Prompt 变量 |
| **变量填充** | Prompt 详情页支持填写变量，预览并复制最终文本 |
| **GitHub 导入** | 粘贴 GitHub 仓库链接，自动抓取 README 并整理为 Skill |
| **复制追踪** | 区分「复制原文」与「复制最终文本」，记录使用日志 |
| **搜索与过滤** | 关键词搜索 + 分类/标签/收藏过滤 + 排序 |

## 技术栈

- **框架**：Next.js 16 (App Router) + React 19 + TypeScript
- **样式**：Tailwind CSS 4 + shadcn/ui
- **数据库**：PostgreSQL (Supabase) + Row Level Security
- **认证**：Supabase Auth (Magic Link) + 邮箱白名单
- **AI 整理**：DeepSeek API (模型可配置)
- **部署**：Vercel

## 架构简介

```
src/
├── app/                    # Next.js App Router 路由与布局
│   └── api/                # Route Handlers (analyze / import/github)
├── components/             # 页面组件与共享 UI
├── hooks/                  # 客户端共享 hooks (toast 等)
├── features/items/         # Prompt / Skill 类型与查询参数解析
├── lib/                    # 环境变量、校验 schema、Supabase 客户端工厂、工具函数
├── server/
│   ├── auth/               # 会话守卫、邮箱白名单、Magic Link
│   ├── db/                 # items / prompt_variables / usage_logs / user_categories 数据访问层
│   ├── items/              # 表单解析与 Server Actions
│   ├── analyze/            # DeepSeek 调用、JSON 修复、整理持久化
│   └── import/             # GitHub URL 校验、README 抓取、导入编排
```

数据模型围绕四张表：

- `items` — Prompt / Skill 统一实体
- `user_categories` — 用户自定义分类（按 type 隔离，新用户自动 seed 8 个默认分类）
- `prompt_variables` — Prompt 专属变量定义
- `usage_logs` — 复制行为记录 (`copy_raw` / `copy_final`)

关键设计原则：

- 用户原始内容保存在 `items.content`，AI 整理结果只写入元数据，不覆盖原文
- 数据库层通过 RPC 原子操作减少往返（`toggle_favorite`、`increment_usage_count`、`get_latest_copied_at`）
- 服务端环境变量优先从 `.env.local` 读取，避免系统环境变量静默覆盖项目配置

## 快速开始

### 环境要求

- Node.js `20.9+`
- npm `10+`
- Docker Desktop（如需本地运行 Supabase）

### 1. 安装依赖

```bash
npm ci
```

### 2. 配置环境变量

复制示例文件：

```bash
cp .env.example .env.local
```

按需填写以下变量：

**Supabase（必需）**

```text
NEXT_PUBLIC_SUPABASE_URL=          # Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # 公开 API Key
ALLOWED_EMAILS=                    # 登录白名单，逗号分隔，如 you@example.com
```

**DeepSeek（智能整理与 GitHub 导入分析必需）**

```text
DEEPSEEK_API_KEY=                  # DeepSeek API Key
DEEPSEEK_MODEL=deepseek-v4-flash   # 模型名称
DEEPSEEK_API_BASE_URL=             # 可选，默认 https://api.deepseek.com
```

**GitHub（可选）**

```text
GITHUB_TOKEN=                      # 提升 GitHub 导入接口的速率限制
```

**生产环境额外需要**

```text
NEXT_PUBLIC_APP_ORIGIN=https://your-domain.com
```

本地开发可省略 `NEXT_PUBLIC_APP_ORIGIN`，默认回退到 `http://localhost:3000`。

### 3. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000/login

根路由 `/` 会自动跳转到 `/dashboard`；未登录时工作台路由会再跳转到 `/login`。

### 4. 本地 Supabase（可选）

如果你需要本地 Auth 和持久化数据：

```bash
# 首次安装本地 CLI
npm run supabase:install

# 启动本地 Supabase 栈
npm run supabase:start

# 查看状态并获取本地 URL 和 Key
npm run supabase:status
```

本地服务端口约定：

| 服务 | 地址 |
|------|------|
| API | http://127.0.0.1:55421 |
| Studio | http://127.0.0.1:55423 |
| Mailpit | http://127.0.0.1:55424 |
| Postgres | postgresql://postgres:postgres@127.0.0.1:55432/postgres |

将 `supabase:status` 输出的 `API URL` 和 `anon key` 填入 `.env.local` 的 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。

常用命令：

```bash
npm run supabase:status
npm run supabase:stop
```

> 本地 Supabase CLI 安装在仓库内 `vendor_imports/tools/supabase/<version>/`，不依赖全局安装。

## 验证

```bash
npm run test        # 运行测试
npm run lint        # 代码检查
npm run typecheck   # 类型检查
npm run build       # 构建
```

## 生产部署

生产环境部署在 Vercel，使用 Supabase 云项目（`ap-northeast-1`）。

**必需环境变量**

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 必须含 `https://` 前缀 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → API 获取 |
| `NEXT_PUBLIC_APP_ORIGIN` | 生产域名，如 `https://robox.vercel.app` |
| `ALLOWED_EMAILS` | 登录白名单 |
| `DEEPSEEK_API_KEY` | 服务端专用 |
| `DEEPSEEK_MODEL` | 如 `deepseek-v4-flash` |

**Supabase Auth 配置**

- Site URL: `https://robox.vercel.app`
- Redirect URLs: `https://robox.vercel.app/auth/confirm`

## 文档索引

| 文档 | 内容 |
|------|------|
| `docs/setup.md` | 本地启动、环境变量、Supabase 开发约定、目录说明 |
| `docs/architecture.md` | 系统边界、数据流、DeepSeek 整理链路、GitHub 导入链路、安全层 |
| `docs/integration-guide.md` | Route Handler 用法、MVP 冒烟流程 |
| `PLAN.md` | 分阶段实施计划 |
| `RoBox 最终项目方案.md` | 产品边界、数据模型、后续 API 方案 |
| `RoBox_UI_Prototype/` | 静态交互原型（视觉与交互参考） |
