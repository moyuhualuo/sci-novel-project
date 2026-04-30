# 部署说明（中文）

本文档用于说明如何将本项目部署到线上环境，并保证登录、图片上传和内容编辑功能正常工作。

当前推荐的部署结构：

- 代码仓库：GitHub
- 前端：Vercel
- 后端：Render
- 数据库：Supabase Postgres
- 图片存储：Supabase Storage（推荐）

## 1. 部署前准备

在开始部署前，请先准备以下内容：

- GitHub 仓库
- Vercel 账号
- Render 账号
- Supabase 账号

如果你只打算自己使用网站：

- 可以只保留管理员登录
- 不必启用注册与邮件验证
- 不必配置 Resend

## 2. 本地检查

部署前建议先确认本地可以正常运行。

### 后端测试

```bat
cd /d D:\codex\backend
test_local.cmd
```

### 前端开发启动

```bat
cd /d D:\codex\frontend
npm.cmd run dev
```

## 3. 推送代码到 GitHub

如果还没有推送仓库：

```bat
cd /d D:\codex
git init
git add .
git commit -m "init project"
git branch -M main
git remote add origin 你的 GitHub 仓库地址
git push -u origin main
```

## 4. 创建 Supabase 项目

### 4.1 创建数据库

在 Supabase 控制台中新建项目后，记录以下信息：

- `Project URL`
- 数据库连接串
- `service_role key`

后端数据库连接使用示例：

```env
SCIFI_DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:PORT/postgres
```

注意：

- 必须使用 `postgresql+asyncpg://`
- 推荐优先使用 `pooler` 连接串

### 4.2 创建图片 Bucket

进入 `Storage`，创建公开 bucket：

```text
story-images
```

这个名称与当前项目默认配置一致。

## 5. 部署后端到 Render

### 5.1 创建服务

在 Render 中新建 `Web Service`，使用 Python 运行时。

推荐配置：

- Branch：`main`
- Root Directory：`backend`
- Build Command：

```bash
pip install .
```

- Start Command：

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 5.2 后端环境变量

至少需要配置：

```env
SCIFI_APP_NAME=Sci-Fi Novel Introduction
SCIFI_ENVIRONMENT=production
SCIFI_DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:PORT/postgres
SCIFI_FRONTEND_URL=https://你的前端域名
SCIFI_ALLOWED_ORIGINS=https://你的前端域名
SCIFI_COOKIE_NAME=scifi_session
SCIFI_COOKIE_SECURE=true
SCIFI_COOKIE_SAMESITE=none
SCIFI_SESSION_SECRET=请替换为随机字符串
SCIFI_ADMIN_EMAIL=你的管理员邮箱
SCIFI_ADMIN_PASSWORD=你的管理员密码
SCIFI_LOG_PATH=logs/scifi_novel.log
SCIFI_SUPABASE_URL=https://你的项目ID.supabase.co
SCIFI_SUPABASE_SERVICE_ROLE_KEY=你的 service_role key
SCIFI_SUPABASE_STORAGE_BUCKET=story-images
SCIFI_SUPABASE_STORAGE_PATH_PREFIX=scifi
SCIFI_SUPABASE_STORAGE_PUBLIC=true
```

如果你要启用邮件验证，再额外配置：

```env
SCIFI_RESEND_API_KEY=你的 Resend API Key
SCIFI_RESEND_FROM_EMAIL=你的发信邮箱
SCIFI_RESEND_FROM_NAME=Sci-Fi Novel Introduction
```

如果暂时不用邮件验证，可以不填 `SCIFI_RESEND_*`。

### 5.3 后端检查

部署完成后先确认：

- `https://你的-render-域名/api/v1/health`
- `https://你的-render-域名/api/v1/site`

如果这两个地址都能正常返回，说明后端已经可用。

## 6. 部署前端到 Vercel

### 6.1 创建项目

在 Vercel 中导入 GitHub 仓库，选择：

- Root Directory：`frontend`
- Install Command：`npm install`
- Build Command：`npm run build`
- Output Directory：`dist`

### 6.2 前端环境变量

示例文件：

- [frontend/.env.example](D:/codex/frontend/.env.example)

线上至少需要：

```env
VITE_SITE_URL=https://你的前端域名
```

说明：

- 本项目线上默认通过同域 `/api` 代理访问后端
- 本地开发时才使用 `VITE_API_BASE_URL`

### 6.3 Vercel API 代理

当前项目使用 [frontend/vercel.json](D:/codex/frontend/vercel.json) 将：

```text
/api/*
```

代理到 Render 后端。

如果你更换了 Render 服务域名，请同步修改该文件中的后端地址后重新部署前端。

## 7. Cookie 与登录说明

为了保证登录后页面仍然保持登录态，需要确认：

- 前端使用 HTTPS
- 后端设置：

```env
SCIFI_COOKIE_SECURE=true
SCIFI_COOKIE_SAMESITE=none
```

- `SCIFI_ALLOWED_ORIGINS` 与前端正式域名一致

如果登录成功后刷新页面立刻掉线，优先检查这三项。

## 8. 图片上传说明

当前项目上传图片时，优先保存到：

- `Supabase Storage`

只有在未配置 `SCIFI_SUPABASE_URL` 和 `SCIFI_SUPABASE_SERVICE_ROLE_KEY` 时，才会回退到本地目录：

```text
backend/uploads/
```

线上环境推荐始终使用 `Supabase Storage`。

## 9. 上线后检查清单

建议按顺序检查：

1. 首页是否能正常打开
2. `/logs` 是否正常
3. `/admin` 是否能打开
4. 管理员登录后是否进入编辑态
5. 首页是否出现“编辑站点资料”
6. 章节页是否能编辑文字和图片
7. 图片上传后刷新是否仍然存在
8. 404 页面是否正常
9. 退出登录是否正常

如果启用了注册与邮件验证，再额外检查：

10. 注册是否成功
11. 验证邮件是否送达
12. 验证链接是否能跳回 `/admin`

## 10. 常见问题

### 10.1 前端能打开，但一直显示本地快照

通常优先检查：

- Render 后端是否正在运行
- `frontend/vercel.json` 中的代理目标是否仍指向正确的 Render 域名
- Vercel 是否已重新部署最新代码

### 10.2 登录成功后仍然像访客

优先检查：

- 是否已经使用 Vercel 同域 `/api` 代理
- `SCIFI_ALLOWED_ORIGINS` 是否正确
- `SCIFI_COOKIE_SECURE=true`
- `SCIFI_COOKIE_SAMESITE=none`

### 10.3 图片上传成功但刷新后丢失

通常说明当前仍在使用本地上传目录，而不是 `Supabase Storage`。

请检查：

- `SCIFI_SUPABASE_URL`
- `SCIFI_SUPABASE_SERVICE_ROLE_KEY`
- `SCIFI_SUPABASE_STORAGE_BUCKET`

## 11. 当前推荐使用方式

如果是单人使用站点，推荐：

- 只保留管理员登录
- 关闭或忽略注册流程
- 使用 `Supabase Storage`
- 不启用邮件验证

如果后续要开放注册，再补充：

- 自定义域名
- Resend 发信域名验证
