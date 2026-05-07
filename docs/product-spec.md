# RoBox 最终项目方案

---

# 1. 最终定位

## 产品名

# **RoBox**

## 产品定义

> **RoBox 是一个个人 Prompt / Skill / Tool 管理网页，用来保存、整理、搜索和快速复制你常用的 Prompt 模板、Skill 与工具链接。**
> 

## 一句话说明

> **RoBox：管理你的 Prompt、Skill 与 Tool。**
> 

---

# 2. 产品边界

## 只做三类内容

| 类型 | 说明 |
| --- | --- |
| **Prompt** | 提示词、提示词模板、可填变量的 Prompt |
| **Skill** | `SKILL.md`、子 skill、Claude Skill、可复制使用的 Skill 文档 |
| **Tool** | 好用工具的 GitHub 仓库、官网链接、安装/使用入口与简短说明 |

---

## 不做这些

```
不做 Workflow
不做 Snippet
不做 Reference
不做社区
不做多人协作
不做 Skill 执行器
不做 MCP 调用
不做 Agent 运行平台
不做浏览器插件
不做通用网页收藏箱
不做爬虫平台
```

第一版核心非常明确：

> **保存 → 整理 → 搜索 → 复制使用。**
> 

---

# 3. 使用方式

## Prompt 使用流程

```
新建 Prompt
↓
粘贴 Prompt 原文
↓
先保存
↓
点击“智能整理”
↓
DeepSeek 生成标题 / 摘要 / 分类 / 标签 / 变量
↓
填写变量
↓
生成最终 Prompt
↓
一键复制
```

---

## Skill 使用流程

```
新建 Skill
↓
粘贴 SKILL.md 或 GitHub skill链接
↓
保存原文
↓
点击“智能整理”
↓
DeepSeek 生成名称 / 摘要 / 使用场景 / 分类 / 标签
↓
查看原文
↓
一键复制完整 Skill
```

---

## Tool 使用流程

```
新建 Tool
↓
粘贴 GitHub 仓库或公共 HTTPS 网站
↓
保存链接
↓
点击“智能整理”或使用导入时自动整理
↓
DeepSeek 生成名称 / 摘要 / 使用场景 / 分类 / 标签
↓
打开来源或一键复制工具链接
```

---

# 4. 技术方案

## 最终技术栈

```
Next.js
+ Supabase
+ DeepSeek API
+ Vercel
```

| 模块 | 技术 |
| --- | --- |
| 前端 | Next.js App Router |
| UI | Tailwind CSS + shadcn/ui |
| 数据库 | Supabase Postgres |
| 登录 | Supabase Auth，限制单用户 |
| 模型 | DeepSeek |
| 部署 | Vercel Hobby |
| 搜索 | 第一版关键词搜索 + 分类 / 标签筛选 |
| GitHub 导入 | 服务端读取 GitHub README/SKILL.md 内容 |
| 网站导入 | 服务端读取公共 HTTPS 页面文本，限 Tool 使用 |

---

# 5. 登录策略

虽然你只给自己用，但网页部署到公网后仍然要保护。

## 推荐方案

> **使用 Supabase Auth，但只允许你自己的邮箱登录。**
> 

实现方式：

```
用户访问 RoBox
↓
登录页
↓
邮箱登录
↓
校验是否为允许邮箱
↓
进入 RoBox
```

这样比完全无登录更安全，也比复杂权限系统简单。

---

# 6. DeepSeek 使用策略

你选择的是：

> **先保存原文，点击“智能整理”才调用 DeepSeek。**
> 

这是很适合个人使用的方案。

---

## DeepSeek 处理内容

点击“智能整理”后，系统请求 DeepSeek 输出结构化 JSON：

```json
{
  "title": "论文结构化整理 Prompt",
  "type": "prompt",
  "summary": "用于将论文 PDF 整理成中文结构化学习文档。",
  "category": "Research",
  "tags": ["论文", "PDF", "中文整理", "思维导图", "学术"],
  "variables": [
    {
      "name": "paper",
      "description": "需要整理的论文 PDF 或论文内容",
      "required": true,
      "default_value": ""
    },
    {
      "name": "output_format",
      "description": "期望输出格式，例如 PDF、Markdown、Word",
      "required": false,
      "default_value": "PDF"
    }
  ]
}
```

---

# 7. 页面结构

```
RoBox
├── Dashboard
│   ├── 搜索栏
│   ├── 最近使用
│   ├── 收藏内容
│   ├── 待整理内容
│   └── 快速新增
│
├── Prompts
│   ├── Prompt 列表
│   ├── 新建 Prompt
│   ├── Prompt 详情
│   └── Prompt 编辑
│
├── Skills
│   ├── Skill 列表
│   ├── 新建 Skill
│   ├── GitHub 导入
│   ├── Skill 详情
│   └── Skill 编辑
│
├── Tools
│   ├── Tool 列表
│   ├── 新建 Tool
│   ├── GitHub 导入
│   ├── 网站导入
│   ├── Tool 详情
│   └── Tool 编辑
│
└── Settings
    ├── DeepSeek API 设置
    ├── 分类设置
    └── 数据导出
```

---

# 8. 核心页面设计

## Dashboard

首页重点是快速找东西。

### 内容

```
全局搜索
最近复制过的 Prompt / Skill / Tool
收藏内容
待整理内容
Prompt / Skill / Tool 数量统计
快速新增按钮
```

---

## Prompt 列表页

支持：

```
按标题搜索
按内容搜索
按分类筛选
按标签筛选
按收藏筛选
按最近使用排序
按最近更新排序
```

卡片结构：

```
[Prompt] 论文结构化整理
用于将论文 PDF 整理成中文学习文档

Research
论文 / PDF / 中文整理 / 思维导图

复制    编辑    收藏
```

---

## Prompt 详情页

重点是“变量填写 + 复制”。

```
标题
摘要
分类
标签

变量填写区
最终 Prompt 预览

按钮：
- 复制最终 Prompt
- 复制原始 Prompt
- 智能整理
- 编辑
- 收藏
```

---

## Skill 列表页

卡片结构：

```
[Skill] think
用于在构建项目之前进行方案验证和风险分析

Agent
架构设计 / 方案验证 / 风险分析

复制    编辑    收藏
```

---

## Skill 详情页

```
标题
摘要
分类
标签

使用场景
skill链接/SKILL.md原文

按钮：
- 复制完整 Skill/链接
- 智能整理
- 编辑
- 收藏
```

---

# 9. 分类体系

第一版固定这些分类，不要太多。

| 分类 | 适用内容 |
| --- | --- |
| Writing | 写作、润色、改写、文案 |
| Coding | 编程、调试、架构、Codex |
| Research | 搜索、论文、资料整理 |
| Design | UI、视觉、生图、品牌 |
| Study | 课程学习、知识点整理 |
| Agent | Agent、Skill、工具调用 |
| Content | 小红书、公众号、视频脚本 |
| Other | 其他 |

标签由 DeepSeek 自动生成，用户可以手动改。

---

# 10. 数据库设计

## `items`

统一存 Prompt、Skill 和 Tool。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid | 主键 |
| user_id | uuid | 用户 ID |
| type | text | `prompt` / `skill` / `tool` |
| title | text | 标题 |
| summary | text | 摘要 |
| content | text | 原文/链接 |
| category | text | 一级分类 |
| tags | text[] | 标签 |
| source_url | text | GitHub 或网站来源链接，可为空 |
| is_favorite | boolean | 是否收藏 |
| is整理ed | boolean | 是否已经智能整理 |
| usage_count | integer | 使用次数 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

字段名建议用英文，避免混用：

```
is_analyzed
```

而不是 `is整理ed`。

---

## `prompt_variables`

只给 Prompt 使用。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid | 主键 |
| item_id | uuid | 对应 Prompt |
| name | text | 变量名 |
| description | text | 变量说明 |
| default_value | text | 默认值 |
| required | boolean | 是否必填 |
| sort_order | integer | 排序 |

---

## `usage_logs`

记录复制行为。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid | 主键 |
| item_id | uuid | 内容 ID |
| action | text | `copy_raw` / `copy_final` |
| created_at | timestamp | 使用时间 |

---

# 11. GitHub / 网站导入逻辑

第一版支持 GitHub Skill 和 Tool 链接导入。

对于以链接形式导入的 Skill / Tool，不保存 README 原文，只显示仓库链接和根据 README 文件总结的使用场景与摘要。

网站导入只支持 Tool。系统抓取公共 HTTPS 页面文本并交给 DeepSeek 分析；数据库只保存用户提交链接和最终来源链接，不保存网页正文。

---

## 安全限制

为了避免乱抓网页，第一版只允许这些域名：

```
github.com
raw.githubusercontent.com
```

普通网站抓取只允许公共 HTTPS 页面，拒绝 localhost、内网、IP 字面量和非 HTTPS URL；每次重定向后重新校验目标，并限制响应大小、超时、重定向次数和 Content-Type。

---

# 12. 搜索方案

第一版不做向量搜索。

## 第一版搜索

```
标题搜索
摘要搜索
原文搜索
分类筛选
标签筛选
收藏筛选
类型筛选：Prompt / Skill / Tool
```

## 第二版再做

```
Embedding
语义搜索
相似 Prompt / Skill / Tool 推荐
```

原因：个人使用初期，关键词 + 标签已经够用。

---

# 13. UI 风格

> **Linear / Vercel 风格。**
> 

## 视觉关键词

```
黑白灰
极简
高密度
清晰
冷静
开发者工具感
少装饰
强排版
轻边框
克制动效
```

---

## 视觉建议

| 项目 | 设计 |
| --- | --- |
| 背景 | `#FAFAFA` 或 `#FFFFFF` |
| 主文本 | 接近黑色 |
| 次级文本 | 灰色 |
| 边框 | 浅灰 |
| 卡片 | 白底、细边框、轻微阴影 |
| 按钮 | 黑色主按钮 + 灰色次按钮 |
| 圆角 | 8px - 12px |
| 字体 | Inter / Geist / system-ui |
| 图标 | Lucide Icons |

---

# 14. MVP 功能清单

## 必须完成

```
登录
新增 Prompt
新增 Skill
新增 Tool
手动粘贴内容保存
GitHub SKILL.md / README 链接导入
公共 HTTPS 网站导入 Tool
内容列表
内容详情
编辑
删除
收藏
最近使用
关键词搜索
分类筛选
标签筛选
DeepSeek 智能整理
Prompt 变量识别
Prompt 变量填写
复制原始 Prompt
复制最终 Prompt
复制完整 Skill
```

---

## 暂不做

```
语义搜索
批量导入
公开分享
团队协作
浏览器插件
Skill 执行
MCP
版本对比
复杂统计分析
```

---

# 15. 开发阶段

具体见 D:\RoBox\docs\project-plan.md

# 16. 关键 API 设计

## 新建内容

```
POST /api/items
```

请求：

```json
{
  "type": "prompt",
  "content": "你的 Prompt 原文",
  "title": "可选标题"
}
```

---

## 智能整理

```
POST /api/items/:id/analyze
```

流程：

```
读取 item 原文
↓
调用 DeepSeek
↓
解析 JSON
↓
更新 item
↓
如果是 Prompt，写入 prompt_variables
```

---

## GitHub 导入

```
POST /api/import/github
```

请求：

```json
{
  "url": "https://github.com/tw93/Waza",
  "type": "tool"
}
```

流程：

```
校验 URL
↓
转换 raw URL
↓
抓取README
↓
保存为 Skill 或 Tool
↓
返回 item id
```

## 网站导入

```
POST /api/import/web
```

请求：

```json
{
  "url": "https://example.com"
}
```

流程：

```
校验公共 HTTPS URL
↓
抓取并清洗网页文本
↓
保存为 Tool
↓
DeepSeek 整理
↓
返回 item id
```

---

## 复制记录

```
POST /api/items/:id/copy
```

用途：

```
更新 usage_count
写入 usage_logs
更新最近使用
```

---

# 17. DeepSeek Prompt 设计

## 智能整理 Prompt

```
你是一个严谨的信息整理助手。请根据用户提供的内容，判断它是 Prompt 还是 Skill，并输出结构化 JSON。

要求：
1. 只能输出 JSON，不要输出 Markdown。
2. type 只能是 "prompt"、"skill" 或 "tool"。
3. category 必须从以下分类中选择：
   Writing, Coding, Research, Design, Study, Agent, Content, Other
4. tags 输出 3-8 个中文标签。
5. 如果是 Prompt，请识别其中需要用户填写的变量。
6. 如果是 Skill 或 Tool，variables 输出空数组；如果 Prompt 没有明显变量，variables 也输出空数组。
7. summary 用中文，控制在 80 字以内。
8. title 简短清晰，不超过 30 字。

输出格式：
{
  "type": "prompt",
  "title": "",
  "summary": "",
  "category": "",
  "tags": [],
  "variables": [
    {
      "name": "",
      "description": "",
      "default_value": "",
      "required": true
    }
  ]
}

用户内容：
{{content}}
```

---

# 18. 风险与处理

| 风险 | 处理 |
| --- | --- |
| DeepSeek 输出不是 JSON | 做 JSON 修复或提示重新整理 |
| DeepSeek 分类不准 | 用户可手动修改 |
| GitHub / 网站导入失败 | 保留手动粘贴入口 |
| Prompt 变量识别错误 | 变量可编辑 |
| 内容重复 | 提示可能重复，但允许保存 |
| 数据库写入失败 | 不清空输入框 |
| 内容太长 | 先保存原文，整理失败也不影响 |
| 未登录访问 | 跳转登录页 |

---

# 19. 最终架构图

```
┌──────────────────────────┐
│        Browser           │
│        RoBox UI          │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│       Next.js App         │
│ Pages / Server Actions    │
│ Route Handlers            │
└───────┬──────────┬───────┘
        │          │
        ▼          ▼
┌──────────────┐  ┌────────────────┐
│  Supabase    │  │   DeepSeek API  │
│ Auth + DB    │  │ Analyze Content │
└──────┬───────┘  └────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Prompt / Skill / Tool Library │
│ Search / Filter / Copy    │
└──────────────────────────┘
```
