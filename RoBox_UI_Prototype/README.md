# RoBox UI Prototype

这是 RoBox 的本地可交互 UI 原型。

当前正式实现已经落在仓库根目录的 Next.js 项目里；这里继续只作为交互和视觉参考。

## 打开方式

直接双击 `index.html` 即可在浏览器中打开。

## 说明

- 这是前端交互原型，不连接数据库，也不真实调用 DeepSeek。
- 不依赖 npm、Vite、React 或外部 CDN。
- 所有交互逻辑都写在 `index.html` 内：搜索、筛选、收藏、删除、模拟智能整理、新增、复制预览等。

## 对应关系

当前正式项目已经按下面的方向落地或预留：

- Next.js App Router 页面
- shadcn/ui 组件
- Supabase 数据表
- DeepSeek analyze API
- GitHub import API
