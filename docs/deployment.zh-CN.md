# 科幻小说介绍站部署文档（中文）

这份文档面向第一次部署本项目的使用者。当前仓库最稳妥、最适合新手的上线方案是：

- 代码仓库：GitHub
- 前端：Vercel
- 数据库：Supabase Postgres
- 后端：Render 或 Railway
- 图片上传：当前版本存到后端本地 `uploads/`，生产环境必须使用持久化磁盘或 Volume

当前版本已经支持：

- 使用真实邮箱注册编辑账号
- 通过验证邮件激活账号
- 验证通过后登录并直接编辑页面内容

注意：

- 不建议把当前后端部署在 Render Free 实例上
- 原因是当前项目同时依赖“持久化上传目录”和“SMTP 邮件验证”
- Render 官方文档说明：Persistent Disk 只支持付费服务；Free Web Service 也不支持在常见 SMTP 端口上发信

如果你后面准备把图片也云原生化，可以再把上传改到 `Supabase Storage`。但按当前代码结构，先用 “Vercel + Supabase + Render/Railway” 是最省心的。

## 1. 当前项目的推荐部署结构

建议采用下面这套结构：

1. `frontend/` 部署到 Vercel
2. `backend/` 部署到 Render 或 Railway
3. 数据库使用 Supabase Postgres
4. 前端通过 `VITE_API_BASE_URL` 调用后端 API
5. 后端通过 `SCIFI_DATABASE_URL` 连接 Supabase Postgres

这样做的原因是：

- 前端是标准 `React + Vite`，非常适合 Vercel
- 后端是 `FastAPI + Cookie 登录 + 图片上传`
- 当前图片上传不是对象存储，而是写入后端磁盘，所以更适合放在支持持久化文件目录的平台

## 2. 部署前先做本地检查

先确保本地版本能正常跑通。

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

如果这里不能通过，建议先不要上线。

## 3. 推送代码到 GitHub

如果仓库还没有推到 GitHub，可以参考：

```bat
cd /d D:\codex
git init
git add .
git commit -m "init sci-fi novel introduction"
git branch -M main
git remote add origin 你的 GitHub 仓库地址
git push -u origin main
```

如果仓库已经存在，按正常提交流程推送即可。

## 4. 创建 Supabase 数据库

1. 登录 Supabase
2. 创建一个新的 Project
3. 打开 `Project Settings -> Database`
4. 复制数据库连接串

后端部署时会用到：

```env
SCIFI_DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:PORT/postgres
```

注意：

- 本项目后端使用的是 `SQLAlchemy async + asyncpg`
- 所以连接串前缀要用 `postgresql+asyncpg://`

## 5. 部署后端到 Render 或 Railway

### 5.1 为什么后端不建议先放 Vercel

这个项目当前后端包含：

- Cookie 登录
- 图片上传
- 日志文件
- 静态上传目录挂载

这些特性都更适合部署到长期运行的 Python 服务，而不是直接塞进纯函数式的无状态环境。

另外，如果你使用 Render：

- 生产建议直接选择付费 Web Service
- Free 实例不适合这版项目

### 5.2 后端目录

后端部署时，Root Directory 设置为：

```text
backend
```

### 5.3 后端安装命令

推荐安装命令：

```bash
pip install .
```

因为后端已经有完整的 `pyproject.toml`。

### 5.4 后端启动命令

启动命令：

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 5.5 后端环境变量

至少需要配置这些：

```env
SCIFI_APP_NAME=Sci-Fi Novel Introduction
SCIFI_ENVIRONMENT=production
SCIFI_DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:PORT/postgres
SCIFI_ALLOWED_ORIGINS=https://你的前端正式域名
SCIFI_COOKIE_NAME=scifi_session
SCIFI_COOKIE_SECURE=true
SCIFI_COOKIE_SAMESITE=none
SCIFI_SESSION_SECRET=请替换为复杂随机字符串
SCIFI_VERIFICATION_TOKEN_TTL_MINUTES=1440
SCIFI_ADMIN_EMAIL=你的管理员邮箱
SCIFI_ADMIN_PASSWORD=你的管理员密码
SCIFI_LOG_PATH=logs/scifi_novel.log
SCIFI_UPLOAD_DIR=/opt/render/project/src/backend/uploads
SCIFI_UPLOAD_URL_PATH=/uploads
SCIFI_SMTP_HOST=smtp.example.com
SCIFI_SMTP_PORT=587
SCIFI_SMTP_USERNAME=你的发信账号
SCIFI_SMTP_PASSWORD=你的发信密码或授权码
SCIFI_SMTP_FROM_EMAIL=你的发信邮箱
SCIFI_SMTP_FROM_NAME=Sci-Fi Novel Introduction
SCIFI_SMTP_STARTTLS=true
```

关键说明：

- `SCIFI_ALLOWED_ORIGINS` 写前端正式域名，不要带多余空格
- 如果你有多个前端来源，可以用英文逗号分隔
- `SCIFI_COOKIE_SECURE=true` 用于 HTTPS
- `SCIFI_COOKIE_SAMESITE=none` 很重要
- `SCIFI_SMTP_*` 用于发送注册验证邮件
- `SCIFI_ADMIN_EMAIL` 可以直接写你的真实邮箱，不必继续用 `admin@scifi.local`

### 5.6 真实邮箱注册与验证邮件

如果你要在正式部署后使用真实邮箱注册和登录，必须配置 SMTP 发信。

最少要配置：

```env
SCIFI_SMTP_HOST=smtp.example.com
SCIFI_SMTP_PORT=587
SCIFI_SMTP_USERNAME=你的发信账号
SCIFI_SMTP_PASSWORD=你的发信密码或授权码
SCIFI_SMTP_FROM_EMAIL=你的发信邮箱
SCIFI_SMTP_FROM_NAME=Sci-Fi Novel Introduction
SCIFI_SMTP_STARTTLS=true
```

说明：

- 常见邮箱服务通常需要 SMTP 授权码，不一定是网页登录密码
- 如果没有配置 SMTP，本地开发仍可继续，但验证链接只会写入后端日志
- 正式生产环境建议务必把 SMTP 配好，否则访客无法正常完成邮箱验证

### 5.7 Cookie 跨域登录说明

当前项目前端和后端通常不在同一个域名下，例如：

- 前端：`https://your-site.vercel.app`
- 后端：`https://your-api.onrender.com`

这种场景下，浏览器要想在跨站请求里保留登录 Cookie，至少要满足：

1. 前端请求必须带 `credentials: "include"`
2. 后端 CORS 必须开启 `allow_credentials=True`
3. `SCIFI_ALLOWED_ORIGINS` 必须包含前端域名
4. `SCIFI_COOKIE_SECURE=true`
5. `SCIFI_COOKIE_SAMESITE=none`

本项目代码已经支持第 1、2 点。你部署时最容易漏的是第 3、4、5 点。

如果你上线后出现“登录接口返回成功，但刷新后还是未登录”，优先检查这里。

### 5.8 图片上传与持久化

当前项目上传图片时，文件保存在：

```text
/opt/render/project/src/backend/uploads
```

这意味着生产环境必须满足：

- Render：挂 Persistent Disk
- Railway：挂 Volume

如果你使用 Render，建议 Persistent Disk 的挂载路径也设为：

```text
/opt/render/project/src/backend/uploads
```

如果不挂持久化磁盘，应用重启或重新部署后，上传图片可能丢失。

## 6. 部署前端到 Vercel

### 6.1 导入项目

1. 登录 Vercel
2. 点击 `Add New -> Project`
3. 选择 GitHub 仓库
4. Root Directory 选择 `frontend`

### 6.2 构建配置

建议配置如下：

- Root Directory：`frontend`
- Install Command：`npm install`
- Build Command：`npm run build`
- Output Directory：`dist`

项目里已经带了 [frontend/vercel.json](D:/codex/frontend/vercel.json)，用于把 `/admin`、`/logs`、`/section/...` 这类前端路由重写到 `index.html`，避免刷新后出现 404。

### 6.3 前端环境变量

参考文件：

- [frontend/.env.example](D:/codex/frontend/.env.example)

生产环境至少需要：

```env
VITE_API_BASE_URL=https://你的后端正式域名/api/v1
VITE_SITE_URL=https://你的前端正式域名
```

说明：

- `VITE_API_BASE_URL`：给前端调用后端 API
- `VITE_SITE_URL`：给 SEO、canonical、Open Graph、分享图使用

## 7. SEO 和分享卡片

本项目前端已经接好了：

- `title`
- `description`
- `canonical`
- `theme-color`
- `Open Graph`
- `Twitter Card`

默认分享图文件在：

- [frontend/public/og-cover.svg](D:/codex/frontend/public/og-cover.svg)

正式部署时，请务必把：

```env
VITE_SITE_URL=https://你的前端正式域名
```

设置成真实域名，否则：

- `canonical` 可能不正确
- `og:url` 可能不正确
- 分享图链接可能仍按本地地址推断

## 8. 上线后检查清单

部署完成后，建议按顺序检查：

1. 首页是否能正常打开
2. `/logs` 是否能正常显示
3. `/admin` 是否能正常登录
4. 登录后是否能直接在页面里编辑文字和图片
5. 新注册账号是否能收到验证邮件
6. 点击验证链接后是否能正常回到 `/admin`
7. 是否能新增章节
8. 是否能新增内容块
9. 是否能上传本地图片
10. 刷新页面后登录态是否仍然存在
11. `/uploads/...` 的图片地址是否能正常打开
12. 404 页面是否正常显示
13. 分享链接时标题、简介、封面是否正常

## 9. 常见问题

### 9.1 前端能打开，但登录后立刻掉线

优先检查：

- `SCIFI_ALLOWED_ORIGINS`
- `SCIFI_COOKIE_SECURE=true`
- `SCIFI_COOKIE_SAMESITE=none`
- 前端是否走 HTTPS
- 前端请求是否还保留 `credentials: include`

### 9.2 图片上传成功，但重启后丢失

原因通常是：

- 后端平台没有挂持久化磁盘

解决方式：

- Render 挂 Persistent Disk
- Railway 挂 Volume

### 9.3 页面能打开，但前端请求后端报 CORS

优先检查：

- `SCIFI_ALLOWED_ORIGINS` 是否写成了前端正式域名
- 域名是否带了错误的路径
- 是否多写了结尾斜杠

推荐写法：

```env
SCIFI_ALLOWED_ORIGINS=https://your-site.vercel.app
```

不推荐写法：

```env
SCIFI_ALLOWED_ORIGINS=https://your-site.vercel.app/
SCIFI_ALLOWED_ORIGINS=https://your-site.vercel.app/some-path
```

## 10. 当前最推荐的新手部署路线

对这个仓库来说，我建议你直接走：

1. GitHub 托管代码
2. Vercel 部署前端
3. Supabase 提供 PostgreSQL
4. Render 或 Railway 部署后端
5. 给后端挂持久化磁盘，保证图片不丢

这是当前最贴近你这个项目实际架构、成功率也最高的一条路。

## 11. 以后可以继续升级的方向

如果后面你要把这套站点继续推到更完整的生产版，优先建议：

1. 把图片上传从本地目录迁移到 `Supabase Storage`
2. 增加正式的用户系统和密码重置
3. 接入 Alembic 数据库迁移
4. 增加监控、告警和错误上报
5. 为每个章节单独生成 SEO 描述和分享图
