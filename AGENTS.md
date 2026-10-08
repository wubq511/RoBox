# AGENTS.md

RoBox 是个人 Prompt / Skill / Tool 管理器：只存 `prompt`、`skill`、`tool` 三类内容，只跑「保存 → 整理 → 搜索 → 复制使用」一条闭环。取舍准绳是使用路径短、查找快、复制顺。

本文件是工作规则（怎么做）；`docs/` 是需求与设计（做什么）。

## 开工顺序

1. **查方案**：动手前读 `docs/product-spec.md`，再看 `docs/project-plan.md` 里相关的 Phase。
   完成判据：能说清这次改动落在哪条产品边界内、受哪些既有约定约束；不靠猜。
2. **先改文档，再改代码**：长期规则、目录约定、数据库结构要变，先改 `docs/` 再落实现。
   完成判据：文档与代码在同一批改动里一起提交。
3. **实现**：遵守下面的产品边界、结构与命名、工程纪律。
   完成判据：没有为跑通而注释报错、跳过校验或绕过类型；`items.content` 里的用户原文没被覆盖。
4. **验证**：跑 `npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`，基线见 `docs/architecture.md` 的 Verification Baseline。
   完成判据：四条全绿；跑不动的要说明原因。
5. **发布**：生产发布 = 推 `main`，由 Vercel Git 集成自动部署，不手动跑 `vercel --prod`。
   完成判据：推之前已按「红线操作」拿到明确同意。

## 文档地图

- 产品边界、数据模型、后续 API → `docs/product-spec.md`
- 分阶段计划与已完成阶段的变更记录 → `docs/project-plan.md`
- 本地启动、环境变量、Supabase 开发约定 → `docs/setup.md`
- 系统边界、链路、安全层、性能、部署区域 → `docs/architecture.md`
- Route Handler 用法与冒烟清单 → `docs/integration-guide.md`
- 代码结构与模块索引 → `docs/code-wiki.md`
- 面向使用者的仓库说明与部署步骤 → `README.md`
- 线上 504 / Supabase 免费项目被暂停 → `README.md` 的生产部署章节、`docs/architecture.md` 的 Deployment Region 一节
- 开发期计划与清单（不进版本控制） → `docs/dev/`

实现与文档冲突时以文档为准；文档之间冲突时先指出冲突，再继续。AGENTS.md 只放规则：数据库字段、页面清单、API 细节写在 `docs/` 里。

## 产品边界

只做 `prompt` / `skill` / `tool` 三类内容，和「保存 → 整理 → 搜索 → 复制使用」一条闭环。

通用知识库、爬虫平台、Agent 平台、万能收藏箱都在边界外；要扩边界先回 `docs/product-spec.md` 改方案，再动手。

## 结构与命名

- 目录按业务边界拆分；文件名、目录名、变量名、数据库字段名统一英文。
- 命名直接说明内容，不用 `misc`、`temp`、`backup`、`utils2` 这类含糊名。
- 新增长期目录约定：先写文档，再落代码。
- 第三方 CLI：二进制放 `vendor_imports/tools/<tool>/<version>/`，稳定入口放 `scripts/<tool>.ps1` 或 `scripts/<tool>.cmd`；代码和文档只引用稳定入口。
- `docs/` 放面向接手者的启动、接入、运维文档；`.worktrees/` 只用于隔离开发，不作为交付目录或文档来源。

## 工程纪律

- 用户原文保存在 `items.content`；AI 整理结果只写元数据，不覆盖原文。
- 优先做 MVP；同一结构重复出现第二次再抽象。
- 密钥只放 `.env.local` 和部署平台的环境变量，不进代码、commit、日志。

## 红线操作

先说明原因和风险，拿到明确同意再执行：

- 删除文件、目录或 git 历史
- 修改 `.env`、密钥、token、CI/CD 配置
- 数据库 schema 变更或数据迁移
- `git push`、`git rebase`、`git reset --hard`、强制推送
- 安装新的全局依赖或修改系统配置
- 公开发布或生产部署
