# RoBox UI Prototype

这是 RoBox 的本地可交互 UI 原型。

## 打开方式

直接双击 `index.html` 即可在浏览器中打开。

## 说明

- 这是前端交互原型，不连接数据库，也不真实调用 DeepSeek。
- 不依赖 npm、Vite、React 或外部 CDN。
- 所有交互逻辑都写在 `index.html` 内：搜索、筛选、收藏、删除、模拟智能整理、新增、复制预览等。

## 后续开发建议

正式开发时可将该原型拆分为：

- Next.js App Router 页面
- shadcn/ui 组件
- Supabase 数据表
- DeepSeek analyze API
- GitHub import API
