# 项目架构说明

## 整体结构

网站采用前后端分离结构：

```text
前端（React / Vite）
        |
        v
Vercel 同域 /api 代理
        |
        v
后端（FastAPI）
        |
        +-- PostgreSQL / SQLite
        +-- 图片存储（本地目录或 Supabase Storage）
        +-- 日志记录
```

## 前端

前端负责：

- 页面展示
- 中英文切换
- 主题切换
- 登录页与内容编辑界面
- 日志页展示
- 调用后端接口

主要目录：

- `frontend/src/pages`：页面
- `frontend/src/components`：公共组件
- `frontend/src/api/client.ts`：接口请求封装
- `frontend/src/lib/i18n.ts`：文案与语言切换

## 后端

后端负责：

- 用户登录与会话校验
- 站点内容查询
- 章节、内容块、图片的编辑接口
- 日志写入与读取
- 邮件验证流程（按需启用）

主要目录：

- `backend/app/api`：接口路由
- `backend/app/services`：业务逻辑
- `backend/app/models`：数据库模型
- `backend/app/core`：配置、安全、日志

## 数据层

项目默认支持两种数据层：

- 本地开发：`SQLite`
- 线上部署：`PostgreSQL`

网站内容主要包括：

- 站点标题、标语、简介
- 小说章节
- 内容块（文字 / 图片）
- 用户信息
- 更新日志

## 登录与会话

- 登录接口写入 `HttpOnly` Cookie
- 前端通过 `/auth/me` 判断当前会话状态
- 登录成功后回到内容页，并在原页面直接进入编辑态

## 图片上传

图片上传优先使用：

- `Supabase Storage`

如果未配置 `Supabase Storage`，则回退到：

- `backend/uploads/`

## 日志

当前日志包括：

- 内容新增
- 内容修改
- 内容删除
- 最近更新展示

日志既用于站点页面展示，也用于管理员追踪内容变化。
