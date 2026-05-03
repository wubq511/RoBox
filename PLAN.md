# RoBox 分阶段实施计划

## Key Changes / Phase Breakdown

### Phase 1：工程骨架与基础约束
状态：已完成（2026-05-01）

目标：把“方案仓库”变成“可开发项目”，先建立长期不返工的骨架。

任务清单：
- UI原型已经设计好，不要进行任何改动，直接参考原型进行真实UI落地：D:\RoBox\RoBox_UI_Prototype
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
- 明确统一 `item` 模型：`type` 仅 `prompt|skill`，`content` 保存原始输入，`is_analyzed` 替代错误命名。
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
- 实现 Prompt/Skill 列表页：关键词搜索、类型/分类/标签/收藏筛选、最近使用/最近更新排序。
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
状态：已完成（2026-05-02），已合并并推送到 `main`；已通过本地 `test/typecheck/lint/build` 与本地 Supabase + DeepSeek + GitHub 真实浏览器验收；生产环境已部署到 `robox.vercel.app`（2026-05-03）

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
  - 当前复制日志通过 Server Actions 写入；`POST /api/items/:id/copy` 仅作为后续外部 API 需求的预留名称
- 前端页面
  - Dashboard
  - Prompts：列表 / 新建 / 详情 / 编辑
  - Skills：列表 / 新建 / 详情 / 编辑 / GitHub 导入
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
- `RoBox_UI_Prototype` 仅作为交互参考，不作为代码迁移源。
- 阶段优先顺序固定，不建议跳过 Phase 2 直接做页面，否则后续会返工数据模型和权限边界。
