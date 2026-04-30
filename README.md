# 科幻小说介绍网站

这是一个基于 `FastAPI + React + PostgreSQL` 的前后端分离网站，用于展示科幻小说设定、章节内容、图片素材和更新日志。网站支持中英文切换、主题切换、登录后原位编辑，以及图片上传与操作日志记录。

## 主要功能

- 中英文内容切换
- 白天、夜间、雾蓝、护眼黄主题切换
- 左侧章节导航与右侧子导航
- 登录后直接在内容页编辑文字和图片
- 图片上传与保存
- 更新日志页面
- 404 页面与基础异常提示

## 技术栈

- 后端：`FastAPI`、`SQLAlchemy`、`Pydantic`
- 前端：`React`、`TypeScript`、`Vite`
- 数据库：`PostgreSQL` 或本地 `SQLite`
- 图片存储：本地目录或 `Supabase Storage`
- 部署：`Vercel + Render + Supabase`

## 项目结构

```text
.
|-- backend/
|   |-- app/
|   |-- scripts/
|   |-- tests/
|   |-- run_local.cmd
|   `-- test_local.cmd
|-- docs/
|-- frontend/
|-- docker-compose.yml
`-- pnpm-workspace.yaml
```

## 本地启动

### 后端

Windows：

```bat
cd /d D:\codex\backend
run_local.cmd
```

如果你使用 `uv`：

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

接口文档：

- Swagger UI：`http://localhost:8000/docs`
- ReDoc：`http://localhost:8000/redoc`

### 前端

```bat
cd /d D:\codex\frontend
npm.cmd install
npm.cmd run dev
```

本地访问：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:8000`

## 默认管理员账号

- 邮箱：`admin@scifi.local`
- 密码：`ChangeMe123!`

如果已经在线上部署，请将管理员账号、会话密钥和数据库密码改成你自己的值。

## 常用命令

后端测试：

```bat
cd /d D:\codex\backend
test_local.cmd
```

前端构建：

```bat
cd /d D:\codex\frontend
npm.cmd run build
```

Docker 启动：

```bash
docker compose up --build
```

## 环境变量

示例文件：

- 前端：[frontend/.env.example](D:/codex/frontend/.env.example)
- 后端：[backend/.env.example](D:/codex/backend/.env.example)

本地开发至少需要确认：

- 后端数据库地址
- 管理员账号密码
- 前端站点地址

如果线上使用 `Supabase Storage` 或邮件验证，还需要补充对应服务的配置。

## 文档

- [项目架构](D:/codex/docs/architecture.md)
- [功能说明](D:/codex/docs/delivery-scope.md)
- [界面与交互说明](D:/codex/docs/ui-ux.md)
- [部署说明（中文）](D:/codex/docs/deployment.zh-CN.md)
- [后端使用说明](D:/codex/backend/README.md)

## 说明

- 生产环境推荐使用 `Vercel + Render + Supabase`
- 前端线上请求默认通过 Vercel 同域 `/api` 代理到后端服务
- 如果你只是单人使用网站，可以只保留管理员登录，不启用注册与邮件验证
