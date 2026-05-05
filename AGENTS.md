# AGENTS.md

## 1. 目的

本文件只定义 `RoBox` 的基础工作规则，不重复承载完整产品方案。

- `AGENTS.md` 负责“怎么做”
- 项目文档负责“做什么”

开始任何实现前，先读项目文档，再动手。

---

## 2. 参考文档/文档索引

### 长期文档（版本控制）
- 仓库说明 D:\RoBox\README.md
- 本文件 `AGENTS.md`
- 启动文档 D:\RoBox\docs\setup.md
- 架构文档 D:\RoBox\docs\architecture.md
- 接入文档 D:\RoBox\docs\integration-guide.md
- 项目方案 D:\RoBox\RoBox 最终项目方案.md
- UI原型 D:\RoBox\RoBox_UI_Prototype   注意，该原型已经定稿了，请你不要进行调整，直接改为真实落地的UI

### 开发期文档（不进入版本控制）
- 分阶段计划 D:\RoBox\PLAN.md
- 开发计划/清单 D:\RoBox\docs\dev\

如果实现与项目文档冲突，以项目文档为准；如果项目文档本身不一致，先指出冲突，再继续。

---

## 3. Agent 开工规则

- 正式开发前，先查项目方案，不靠猜
- 需要看交互与视觉时，查 UI 原型，不自己脑补
- 不在 `AGENTS.md` 里重复抄数据库字段、页面清单、API 细节
- 如果要调整长期规则，先改文档，再改代码

---

## 4. 产品硬边界

`RoBox` 只做两类内容：

- `prompt`
- `skill`

核心流程只围绕：

- 保存
- 整理
- 搜索
- 复制使用

不要把项目做成通用知识库、Agent 平台或万能收藏箱。  
任何超出边界的需求，先回到项目方案核对，再决定是否扩展。

---

## 5. 结构与命名

- 目录结构必须清晰，按业务边界拆分
- 文件名、目录名、变量名、数据库字段名统一用英文
- 不创建含义模糊的目录或文件，例如 `misc`、`temp`、`backup`、`utils2`
- 新增长期目录约定时，先写文档，再落代码
- 第三方 CLI 二进制统一放在 `vendor_imports/tools/<tool>/<version>/`
- 第三方 CLI 的稳定入口统一放在 `scripts/<tool>.ps1` 或 `scripts/<tool>.cmd`，代码和文档都不要直接依赖版本化二进制路径
- `docs/` 负责面向接手者的启动、接入、运维文档
- `.worktrees/` 只用于隔离开发，不作为主交付目录或主文档来源

---

## 6. 工程纪律

- 优先做 MVP，不做超前设计
- 保留原始内容，不要让 AI 整理结果覆盖用户原文
- 不要为了跑通而注释报错、跳过校验或绕过类型问题
- 发现可复用的重复结构时再抽象，不为“看起来高级”而抽象
- 改完主动验证；如果仓库当前没有可运行验证手段，要明确说明
- 密钥、token、密码不进代码、不进 commit、不进日志

---

## 7. 红线操作

以下操作必须先说明原因和风险，再获得用户明确同意：

- 删除文件、目录或 git 历史
- 修改 `.env`、密钥、token、CI/CD 配置
- 数据库 schema 变更或数据迁移
- `git push`、`git rebase`、`git reset --hard`、强制推送
- 安装新的全局依赖或修改系统配置
- 公开发布或生产部署

---

## 8. 一句话原则

RoBox 追求的不是功能多，而是个人常用 Prompt / Skill 的使用路径短、查找快、复制顺。

---

## 9. 近期重要变更（供 Agent 快速同步）

### 2026-05-06 自定义分类功能

- **新增 `user_categories` 表**：按 `user_id` + `type`（prompt/skill）隔离，支持用户对 Prompt 和 Skill 分类分别自定义增删。`UNIQUE(user_id, type, name)` 防止重复，RLS 限制用户只能操作自己的分类。
- **移除 `items.category` CHECK 约束**：category 从固定 8 值枚举变为自由文本，应用层通过 `validateCategoryBelongsToUser` 校验。
- **Schema 变更**：`itemCategorySchema` 从 `z.enum([...])` 改为 `z.string().trim().min(1).max(32)`；`itemCategories` 常量改为 `DEFAULT_CATEGORIES`（仅用于 seed）。
- **新增数据访问层**：`src/server/db/categories.ts`，包含 `getUserCategories`、`getUserCategoryNames`、`ensureDefaultCategories`、`createUserCategory`、`deleteUserCategory`、`forceDeleteUserCategory`、`getCategoryUsageCount`、`reorderUserCategories`、`validateCategoryBelongsToUser`。
- **新增 API 路由**：`GET/POST /api/categories`、`DELETE /api/categories/[name]`、`PATCH /api/categories/reorder`。
- **设置页 UI 重构**：`settings-view.tsx` 从"固定分类"只读卡片改为"自定义分类"交互式管理区，含 Prompt/Skill Tab 切换；新增 `category-manager.tsx` 客户端组件。
- **表单与筛选更新**：`ItemForm` 和 `LibraryFilters` 的分类下拉框从 `itemCategories` 常量改为 `categories` prop，由页面路由组件查询用户分类后传入。
- **DeepSeek 分析适配**：`buildAnalyzePrompt` 接收动态 `categories` 参数；`parser.ts` 新增 `validateAnalysisCategory` 函数，校验返回的分类是否在用户自定义列表中，不合法则 fallback 为第一个分类。
- **GitHub 导入适配**：`createGithubSkillImport` 接收 `categories` 参数，默认分类取用户自定义列表的第一个而非硬编码 `"Agent"`。
- **Migration**：`supabase/migrations/202605060001_custom_categories.sql`，已推送到远程和本地 Supabase。

### 2026-05-04 智能分析 Bug 修复与环境变量优先级重构

- **AnalyzeButton 响应格式修复**：`analyze-button.tsx` 中 `data.ok` → `data.item`，匹配后端实际返回的 `{ item }` 格式；新增 `router.refresh()` 使分析完成后页面立即刷新。
- **CORS 403 修复**：`.env.local` 中 `NEXT_PUBLIC_APP_ORIGIN` 端口从 3004 修正为 3000，匹配实际 dev server 端口。
- **DEEPSEEK_MODEL 补全**：`.env.local` 缺少 `DEEPSEEK_MODEL` 行，导致 `readDeepSeekModel()` 抛异常；已补加 `DEEPSEEK_MODEL=deepseek-v4-flash`。
- **环境变量优先级重构**：新增 `src/lib/env.ts` 中的 `getServerEnv()` 函数，优先从 `.env.local` 文件读取配置，`process.env`（系统环境变量）作为 fallback。解决系统环境变量静默覆盖 `.env.local` 的问题。`deepseek.ts`、`github.ts`、`auth/service.ts` 中的直接 `process.env` 读取已全部改为 `getServerEnv()`。
- **env.test.ts 适配**：mock `node:fs` 避免测试读真实 `.env.local`，新增 `resetLocalEnvCache()` 清缓存。

### 2026-05-04 安全审计与加固

- **middleware.ts 位置与 Edge Runtime 适配**：Next.js 16 要求 middleware 文件在项目根目录且导出 `middleware` 函数。原 `proxy.ts` 已重命名为 `middleware.ts`，同时将 `src/lib/supabase/proxy.ts` 的环境变量读取从 `env.ts`（依赖 `node:fs`，无法在 Edge Runtime 运行）改为直接读取 `process.env`，解决了 Edge Runtime 兼容性问题。
- **API 路由鉴权**：`/api/items/[id]/analyze` 和 `/api/import/github` 已添加 `getOptionalAppUser` 显式鉴权，未登录返回 401。
- **安全响应头**：`next.config.ts` 已配置 X-Frame-Options、X-Content-Type-Options、Referrer-Policy、HSTS、CSP、Permissions-Policy。
- **ILIKE 注入修复**：`sanitizeSearchValue` 已转义 PostgreSQL ILIKE 特殊字符 `%` 和 `_`。
- **速率限制**：新增 `src/lib/rate-limit.ts`，GitHub import 10次/小时，Analyze 30次/小时。
- **请求体大小限制**：GitHub import URL 长度限制 2048 字符，请求体限制 4KB。
- **DeepSeek prompt 防注入**：添加内容边界标记和忽略指令注入的规则。
- **replacePromptVariables 归属校验**：删除变量前先通过 `getItemById` 确认 item 存在且属于当前用户。
- **错误信息脱敏**：生产环境 API 返回通用错误信息，不再泄露内部细节。
- **README 大小限制**：GitHub 导入 README 内容上限 100KB。
- **CORS 检查**：API 路由添加同源限制，拒绝跨域请求。
- **`.env.example` 清理**：移除未使用的 `SUPABASE_SERVICE_ROLE_KEY`。

### 2026-05-05 GitHub 导入 Skill 详情页展示优化

- **标题文案**：GitHub 导入的 Skill 详情页内容区标题从"内容"改为"安装/加载提示词"。
- **内容展示**：`<pre>` 块不再直接显示 `item.content`（原始 URL 文本），改为显示"请你安装/加载这个skill："加可点击的 `sourceUrl` 链接。
- **测试更新**：`item-detail-view.test.tsx` 断言已同步更新。

### 2026-05-05 全面性能优化

- **感知速度**：新增 `(workspace)/loading.tsx` 骨架屏，消除 workspace 页面数据加载期间的空白等待；详情页/编辑页添加 Suspense 边界，页面 shell 立即显示、内容区流式加载。
- **数据库原子操作**：`toggleFavorite` 从先读后写（2 次往返）改为 RPC `toggle_favorite`（1 次原子 NOT）；`recordCopyAction` 从 3 次往返改为 RPC `increment_usage_count`（1 次原子 +1 含 usage_logs 插入）；`selectLatestCopiedAtByItemId` 从 JS 层 reduce 改为 RPC `get_latest_copied_at`（SQL 聚合）。
- **Dashboard 查询优化**：`getDashboardSnapshot()` 从全量加载改为 6 条并行查询 + limit，只取需要的数据。
- **数据库索引**：新增 `(user_id, is_favorite, updated_at DESC)` 复合索引和 `title` 列 `pg_trgm` GIN 索引。
- **React.memo**：`ItemCard`、`VariableCard`、`MetricCard`、`MiniListCard` 均用 `React.memo` 包裹，减少操作后的不必要重渲染。
- **共享工具**：`formatDate` 从 `library-list.tsx` 和 `item-detail-view.tsx` 中提取到 `src/lib/format.ts`。
- **BatchAnalyzeButton 并发**：从串行改为并发 3 请求，只在全部完成后 `router.refresh()` 一次。
- **DeleteItemButton 修复**：从不存在的 `DELETE /api/items/${id}` 改为 `deleteItemAction` Server Action。
- **LibraryFilters 客户端导航**：从 `<form action>` 全页面导航改为 `useRouter` + `useSearchParams` 客户端导航。
- **缓存头**：`/_next/static/` 添加 `Cache-Control: immutable`；API 路由添加 `Cache-Control: no-store`。
- **Migration**：`supabase/migrations/202605050001_performance_rpc_indexes.sql`，已推送到远程和本地 Supabase。

### 2026-05-05 GitHub OAuth 登录

- **GitHub OAuth 登录**：新增 GitHub OAuth 作为主要登录方式，Magic Link 保留为备选。登录页显示「GitHub 登录」按钮 + "或" 分隔线 + 邮箱 Magic Link 表单。
- **Service 层**：`service.ts` 新增 `buildGitHubOAuthUrl()`，手动拼接 GoTrue authorize URL（SSR 环境下 `signInWithOAuth` 无法正确传递 `redirect_to`）。
- **Server Action**：`actions.ts` 新增 `signInWithGitHubAction`，构建 OAuth URL 后 `redirect()`。
- **Supabase 配置**：`config.toml` 启用 `[auth.external.github]`，`redirect_uri` 设为 `http://127.0.0.1:55421/auth/v1/callback`（GoTrue v2.189.0 要求显式设置，否则报 "missing redirect URI"）。
- **GitHub OAuth App**：已创建，Client ID/Secret 存于 `.env.local` 的 `SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID` / `SECRET`。
- **Supabase CLI**：安装到 `vendor_imports/tools/supabase/latest/`，稳定入口 `scripts/supabase.cmd`。
- **⚠️ 禁止 `supabase config push`**：`config.toml` 的 `site_url` 等配置服务于本地开发，全量推送会覆盖云项目配置。云项目配置通过 Supabase Dashboard 管理。
- **顺带修复**：`github.ts` 中 `requestDeepSeekAnalysis` 缺失 `categories` 参数，补上 `[...DEFAULT_CATEGORIES]`。

### 2026-05-04 UI 打磨与模型固定

- **UI 全面优化**：登录页、Dashboard、Prompts/Skills 列表页、详情页、新建/编辑页均已完成视觉与交互优化。核心原则：去除开发阶段注释与小字说明，保持简洁专业；统一间距、字体层级、圆角与阴影体系。
- **Button 组件修复**：`src/components/ui/button.tsx` 已显式处理 `asChild` 属性，解决 React "does not recognize the `asChild` prop on a DOM element" 报错。
- **模型与 Base URL 环境变量化**：`src/server/analyze/deepseek.ts` 中模型和 Base URL 均从环境变量读取（`DEEPSEEK_MODEL`、`DEEPSEEK_API_BASE_URL`），支持通过 `.env.local` 配置，不再硬编码。
- **新增/重构的组件**：
  - `item-form.tsx`：新增 FormSection/FormDivider/RequiredLabel/OptionalLabel/FieldDescription 等辅助组件，分区展示表单。
  - `prompt-variables-editor.tsx`：重构为 VariableCard 子组件，优化空状态和变量卡片视觉。
  - `github-import-form.tsx`：添加标题区、统一输入框高度、使用内联 SVG 替代不存在的 GithubIcon。
