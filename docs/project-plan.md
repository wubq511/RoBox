# RoBox 分阶段实施计划

## Key Changes / Phase Breakdown

### Phase 1：工程骨架与基础约束
状态：已完成（2026-05-01）

目标：把“方案仓库”变成“可开发项目”，先建立长期不返工的骨架。

任务清单：
- 初始化 Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui。
- 建立目录骨架
- 接入 Supabase 项目连接所需的本地开发约定，但不改动生产级 CI/CD。
- 补一份 `docs/setup`，说明本地启动、环境变量名、Supabase/DeepSeek/GitHub 依赖边界。

阶段交付物：
- 项目可本地启动。
- 目录结构符合文档要求。
- 有 Dashboard / Prompts / Skills / Settings 页面。

验收标准：
- 运行后能进入统一布局，页面路由完整可访问。
- 新成员只看仓库即可知道代码应该放哪里。

### Phase 2：认证、数据模型与服务端基础
状态：已完成（2026-05-01），已通过本地 Supabase runtime 联调验收

目标：先把“单用户、可持久化”的底座打稳。

任务清单：
- 落地 Supabase Auth，仅允许指定邮箱登录。
- 建立 `items`、`prompt_variables`、`usage_logs` 三张表及对应访问层。
- 明确统一 `item` 模型：Phase 2 时 `type` 为 `prompt|skill`，后续 Phase 9 已扩展为 `prompt|skill|tool`；`content` 保存原始输入，`is_analyzed` 替代错误命名。
- 实现服务端数据访问模块：创建、更新、查询列表、查询详情、收藏切换、复制计数。
- 建立基础校验 schema 和分类枚举：`Writing/Coding/Research/Design/Study/Agent/Content/Other`。
- 为后续 API 预留服务端边界：`server/auth`、`server/db`、`lib/schema`。

阶段交付物：
- 登录后可读写自己的数据。
- 数据表结构与方案一致，命名修正完成。

验收标准：
- 未登录不能进入主应用。
- 登录后能稳定创建和读取测试数据。
- 三张表关系清晰，无字段语义冲突。

### Phase 3：基础库体验 MVP
状态：已完成（2026-05-02），已合并并推送到 `main`

目标：先实现“保存 → 搜索 → 打开 → 编辑 → 复制”的最小闭环。

任务清单：
- 实现 Dashboard：全局搜索入口、最近使用、收藏、待整理、数量统计、快速新增。
- 实现 Prompt/Skill 列表页：关键词搜索、分类/标签/收藏筛选、最近使用/最近更新排序。
- 实现 Prompt 新建、详情、编辑。
- 实现 Skill 新建、详情、编辑。
- 实现统一删除、收藏、复制原文、复制日志写入。
- 实现 Prompt 的“变量区”占位逻辑：手动变量为空时仍可保存普通 Prompt。
- 处理空态、无结果、保存失败、复制反馈等基础交互。

阶段交付物：
- 可手动录入和管理 Prompt / Skill。
- 可完成方案要求的基础搜索与复制链路。

验收标准：
- 能手动保存至少 20 条 Prompt / Skill。
- 能快速搜索、打开详情、编辑、收藏、复制。
- `usage_logs` 和 `usage_count` 行为一致。

### Phase 4：DeepSeek 智能整理
状态：已完成（2026-05-02），已合并并推送到 `main`；已通过本地 `test/typecheck/lint/build` 与本地 Supabase + DeepSeek `deepseek-v4-flash` 真实联调

目标：把普通收藏库升级成“可结构化整理”的工具。

任务清单：
- 实现“点击智能整理”入口，不在保存时自动调用。
- 增加服务端分析接口，输入 `item` 原文，输出结构化 JSON。
- 实现 DeepSeek 返回的解析、JSON 修复/报错处理、字段回写。
- Prompt 场景写入 `prompt_variables`；Skill 场景不写变量。
- 支持用户在整理后继续手动修改标题、摘要、分类、标签、变量。
- 在详情页实现 Prompt 变量填写和 `copy_final`，保留 `copy_raw` 语义不变。
- 增加待整理状态流转：未整理、整理成功、整理失败可重试。

阶段交付物：
- Prompt 和 Skill 都能做智能整理。
- Prompt 可生成最终可复制版本。

验收标准：
- 粘贴复杂 Prompt 后，点击智能整理，能自动生成可用标题、摘要、标签和变量。
- DeepSeek 失败时不丢原文，不清空输入。
- Prompt 支持复制原始版和变量填充后的最终版。

### Phase 5：GitHub Skill 导入与上线前收口
状态：已完成（2026-05-02），已合并并推送到 `main`；已通过本地 `test/typecheck/lint/build` 与本地 Supabase + DeepSeek + GitHub 真实浏览器验收；生产环境已部署到 `robox-beta.vercel.app`（2026-05-03）

目标：补齐 Skill 的核心差异化入口，并把 MVP 收到可长期使用。

任务清单：
- 实现 GitHub Skill 导入接口：仅允许 `github.com` 和 `raw.githubusercontent.com`。
- 实现 URL 校验、raw URL 转换、README 抓取、保存为 `skill`、记录 `source_url`。
- 明确 GitHub 导入 Skill 的 `content` 语义：保存用户提交的链接，不伪装成抓取正文。
- 导入后接入智能整理，基于 README/仓库信息生成摘要与使用场景。
- 详情页区分复制语义：手动 Skill 复制原文，GitHub 导入 Skill 复制 `source_url`。
- Settings 补齐 DeepSeek API 说明、分类说明、数据导出占位。
- 做一次 MVP 收口：关键交互修边、错误提示统一、部署前检查。

阶段交付物：
- 支持通过 GitHub 链接保存 Skill。
- MVP 全链路完整：保存、整理、搜索、复制、导入。

验收标准：
- 粘贴 `https://github.com/tw93/Waza` 后，可以导入、整理、查看、复制。
- GitHub 导入失败时，手动粘贴 Skill 入口仍可正常使用。
- Settings 至少具备说明和占位，不留断头入口。

## Important APIs / Interfaces / Types

当前已经固定或预留的核心接口如下：

- `Item`
  - 统一实体，字段至少包含：`id`、`user_id`、`type`、`title`、`summary`、`content`、`category`、`tags`、`source_url`、`is_favorite`、`is_analyzed`、`usage_count`、`created_at`、`updated_at`
- `PromptVariable`
  - 字段至少包含：`item_id`、`name`、`description`、`default_value`、`required`、`sort_order`
- `UsageLog`
  - `action` 仅允许：`copy_raw`、`copy_final`
- 服务端接口
  - 已实现：`POST /api/items/:id/analyze`
  - 已实现：`POST /api/import/github`
  - 已实现：`POST /api/import/web`
  - 当前复制日志通过 Server Actions 写入；`POST /api/items/:id/copy` 仅作为后续外部 API 需求的预留名称
- 前端页面
- Dashboard
- Favorites：全部收藏列表
- Prompts：列表 / 新建 / 详情 / 编辑
- Skills：列表 / 新建 / 详情 / 编辑 / GitHub 导入
- Tools：列表 / 新建 / 详情 / 编辑 / GitHub 导入 / 网站导入
- Settings

## Test Plan

每阶段都要有对应验证，不等到最后一起补。

- Phase 1
  - 项目能本地启动，主路由不报错。
  - 主要页面壳可访问，移动端和桌面端布局不崩。
- Phase 2
  - Auth 允许白名单邮箱，拒绝非白名单。
  - 数据表读写正常，`type/category/action` 枚举校验有效。
  - 基础查询、详情、更新、收藏、复制计数通过。
- Phase 3
  - 新增/编辑/删除 Prompt 与 Skill 正常。
  - 搜索、筛选、排序、收藏、复制闭环正常。
  - Dashboard 的最近使用、待整理、统计与数据一致。
- Phase 4
  - Analyze 成功时正确回写 `items` 和 `prompt_variables`。
  - Analyze 返回坏 JSON、超时、失败时有可恢复反馈。
  - Prompt 的 `copy_raw` 与 `copy_final` 语义正确。
- Phase 5
  - GitHub URL 校验覆盖仓库链接、README 链接、raw 链接、非法域名。
  - 导入后的 Skill 可查看、整理、复制。
  - 整体跑一次 MVP 冒烟：登录 → 新建 → 搜索 → 整理 → 复制 → GitHub 导入。

## Assumptions

- 当前按方案默认只做单用户，不引入多租户或角色系统。
- 当前以 MVP 为目标，不加入语义搜索、向量库、分享、社区、执行器。
- Settings 中的“数据导出”本轮只做入口或占位，不扩展成完整备份系统。
- 阶段优先顺序固定，不建议跳过 Phase 2 直接做页面，否则后续会返工数据模型和权限边界。

### Phase 6：UI 打磨与模型环境变量化
状态：已完成（2026-05-04）

目标：对 MVP 全链路 UI 进行专业级打磨，去除开发阶段痕迹，并将 DeepSeek 模型与 Base URL 改为环境变量配置。

任务清单：
- 登录页：标题不换行、副标题精简、去除开发注释。
- Dashboard：去除 MetricCard 小字说明、侧边栏去除"Library health"等注释、统计数字右对齐。
- 列表页：时间格式统一为"YYYY-MM-DD"、筛选按钮文案精简、元信息展示去冗余。
- 详情页：时间格式优化、操作按钮布局重构、元信息去冗余、Badge 改为大写格式（PROMPT/CONTENT）。
- 新建/编辑页：表单分区（FormSection + 左侧竖线装饰）、统一输入框高度 h-11、内容区 min-h-[400px]、变量卡片重构（VariableCard + 序号圆角背景）。
- Button 组件：显式处理 `asChild` 属性，修复 React DOM 报错。
- 模型环境变量化：`DEEPSEEK_MODEL` 和 `DEEPSEEK_API_BASE_URL` 均从环境变量读取，默认不再硬编码，同步更新 `.env.example`、测试文件、全部文档。

阶段交付物：
- 全页面 UI 达到可交付标准，无开发阶段注释与小字说明。
- DeepSeek 模型与 Base URL 可通过环境变量灵活配置。

验收标准：
- 各页面在浏览器中视觉协调、信息层级清晰、交互反馈明确。
- 控制台无 `asChild` 相关 React 报错。
- 代码中模型和 Base URL 均从环境变量读取，无硬编码值。

### Phase 7：安全审计与加固
状态：已完成（2026-05-04）

目标：全面扫描项目安全风险，修复至部署上线安全标准。

任务清单：
- proxy.ts 位置修正：Next.js 16 要求 proxy 文件在项目根目录，已从 `src/proxy.ts` 迁移到根目录 `proxy.ts`。
- API 路由显式鉴权：`/api/items/[id]/analyze` 和 `/api/import/github` 添加 `getOptionalAppUser()` 检查，未登录返回 401。
- 安全响应头：`next.config.ts` 配置 X-Frame-Options、X-Content-Type-Options、Referrer-Policy、HSTS、CSP、Permissions-Policy。
- ILIKE 注入修复：`sanitizeSearchValue` 转义 PostgreSQL ILIKE 特殊字符 `%` 和 `_`。
- 速率限制：新增 `src/lib/rate-limit.ts`，GitHub import 10次/小时，Analyze 30次/小时。
- 请求体大小限制：GitHub import URL 长度限制 2048 字符，请求体限制 4KB。
- DeepSeek prompt 防注入：添加内容边界标记和忽略指令注入的规则。
- replacePromptVariables 归属校验：删除变量前先通过 `getItemById` 确认 item 存在且属于当前用户。
- 错误信息脱敏：生产环境 API 返回通用错误信息，不再泄露内部细节。
- README 大小限制：GitHub 导入 README 内容上限 100KB。
- CORS 检查：API 路由添加同源限制，拒绝跨域请求。
- `.env.example` 清理：移除未使用的 `SUPABASE_SERVICE_ROLE_KEY`。

阶段交付物：
- 项目达到部署上线安全标准。
- 所有 API 端点有鉴权、速率限制、输入校验。
- 安全响应头完整配置。

验收标准：
- 未认证请求无法调用 API 端点。
- 安全响应头在所有响应中存在。
- 搜索特殊字符不会导致异常匹配。
- 速率超限返回 429。
- `npm run typecheck && npm run lint && npm run test && npm run build` 全部通过。

### Phase 8：全面性能优化
状态：已完成（2026-05-05）

目标：消除页面加载空白等待、减少数据库往返、减少客户端不必要重渲染，不牺牲功能。

任务清单：
- 新增 `(workspace)/loading.tsx` 骨架屏，消除 workspace 页面数据加载期间的空白等待。
- 详情页/编辑页添加 Suspense 边界，页面 shell 立即显示、内容区流式加载。
- `getDashboardSnapshot()` 从全量加载改为 6 条并行查询 + limit。
- `toggleFavorite` 改为 RPC `toggle_favorite` 原子操作（1 次往返替代 2 次）。
- `recordCopyAction` 改为 RPC `increment_usage_count` 原子操作（1 次往返替代 3 次）。
- `selectLatestCopiedAtByItemId` 改为 RPC `get_latest_copied_at` SQL 聚合。
- 新增数据库索引：`(user_id, is_favorite, updated_at DESC)` 复合索引 + `title` pg_trgm GIN 索引。
- `ItemCard`、`VariableCard`、`MetricCard`、`MiniListCard` 用 `React.memo` 包裹。
- `formatDate` 提取到 `src/lib/format.ts` 共享。
- `BatchAnalyzeButton` 从串行改为并发 3 请求，只在全部完成后 `router.refresh()` 一次。
- `DeleteItemButton` 修复：从不存在的 `DELETE /api/items/${id}` 改为 `deleteItemAction` Server Action。
- `LibraryFilters` 从 `<form action>` 全页面导航改为 `useRouter` + `useSearchParams` 客户端导航。
- 静态资源添加 `Cache-Control: immutable`；API 路由添加 `Cache-Control: no-store`。

阶段交付物：
- 页面加载有骨架屏反馈，不再空白。
- 数据库操作减少往返次数。
- 客户端操作后重渲染范围缩小。
- Migration 已推送到远程和本地 Supabase。

验收标准：
- `npm run test && npm run build` 全部通过。
- 浏览器中页面加载有骨架屏过渡。
- 收藏、复制操作响应更快。
- 批量分析并发执行，不再逐个刷新页面。

### Phase 9：Tools 独立栏目
状态：已完成（2026-05-07），已合并并推送到 `main`；本地和远程 Supabase 迁移已应用；生产已部署到 `https://robox-beta.vercel.app`

目标：将 Tools 作为 RoBox 第三类独立内容，补齐工具链接、GitHub 仓库和公共 HTTPS 网站的保存、整理、搜索、复制链路。

任务清单：
- 更新产品边界为 `prompt | skill | tool`，仍限定在保存、整理、搜索、复制使用。
- 扩展 `itemTypeSchema`、`items.type`、`user_categories.type`，加入 `tool`。
- 为现有用户 seed Tool 默认分类，Settings 分类管理增加 Tool Tab。
- 新增 `/tools`、`/tools/new`、`/tools/[id]`、`/tools/[id]/edit`。
- Dashboard、侧边栏、列表、详情、新建、编辑、搜索、收藏、复制链路支持 Tool。
- `POST /api/import/github` 支持 `type?: "skill" | "tool"`，默认仍为 Skill。
- 新增 `POST /api/import/web`，只允许公共 HTTPS 页面，限制重定向、大小、超时和 Content-Type。
- DeepSeek 分析支持 Tool，Tool 与 Skill 一样不生成 Prompt 变量。
- GitHub README/SKILL.md 和网页正文只作为分析上下文，不覆盖 `items.content`。

阶段交付物：
- Tools 成为独立栏目，不依附在 Skills 分类下。
- GitHub 仓库可作为 Tool 导入并分析。
- 公共 HTTPS 网站可作为 Tool 导入并分析。
- Tool 详情页以来源链接作为主要打开/复制对象。

验收标准：
- `npm run test`、`npm run typecheck`、`npm run lint`、`npm run build` 全部通过。
- 本地和远程 Supabase 都已应用 `202605070001_add_tools_item_type.sql`。
- 生产部署 `dpl_DYZAvL7FR32FdpBPpBofc9kix5cD` 对应提交 `75f040f`，状态 `READY`。
- 未登录访问 Tools 页面和 API 不出现全局错误页，API 返回预期 `401`。

### Phase 10：收藏页与 Dashboard 收藏卡片优化
状态：已完成（2026-05-07），已合并并推送到 `main`；生产已部署到 `https://robox-beta.vercel.app`

目标：解决 Dashboard 收藏卡片自适应变高后只展示 3 条导致大面积留白的问题，并提供完整收藏列表入口。

任务清单：
- `getDashboardSnapshot()` 收藏查询从 3 条提升到 8 条，让 Dashboard 摘要卡片能填充更多可用空间。
- Dashboard 收藏卡片标题区和底部 CTA 跳转到 `/favorites`。
- 新增 `/favorites` 工作区页面，统一展示全部收藏的 Prompt / Skill / Tool。
- 新增 `FavoritesList`，支持收藏范围内搜索、类型筛选和最近更新/最近使用排序。
- 左侧导航和移动导航通过 `navigationItems` 新增“收藏”入口。
- `toggleFavoriteAction()` 和 Analyze route 增加 `revalidatePath("/favorites")`，避免收藏页在收藏切换或智能整理后缓存滞后。
- 同步 README、setup、architecture、integration-guide、product-spec、code-wiki 与 AGENTS 近期变更。

阶段交付物：
- Dashboard 收藏摘要卡片不再因为固定 3 条数据而显著留白。
- 用户可以从 Dashboard 或导航进入 `/favorites` 查看全部收藏。

验收标准：
- `npm run typecheck`、`npm run lint`、`npm run test`、`npm run build` 全部通过。
- 生产部署 `dpl_CFstKgSi6RgjrTFiv4otz69XBfJ9` 对应提交 `15d7abe1`，状态 `READY`。
- 生产 `/favorites` 返回 HTTP 200，Vercel production error logs 在部署后一小时窗口内无错误。
