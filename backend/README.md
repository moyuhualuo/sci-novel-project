# 后端使用说明

后端服务负责提供站点内容接口、管理员登录、内容编辑、图片上传和日志记录能力。

## 启动方式

### 方式一：本地脚本

```bat
cd /d D:\codex\backend
run_local.cmd
```

### 方式二：使用 uv

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

## 测试

```bat
cd /d D:\codex\backend
test_local.cmd
```

或：

```bash
cd backend
uv run pytest
```

## 常用地址

- 健康检查：`/api/v1/health`
- Swagger UI：`/docs`
- ReDoc：`/redoc`

## 主要能力

- 站点内容读取
- 管理员登录与退出
- 章节与内容块增删改查
- 图片上传
- 日志与更新记录
- 邮件验证接口（可选）

## 关键环境变量

- `SCIFI_DATABASE_URL`：数据库连接
- `SCIFI_FRONTEND_URL`：前端站点地址
- `SCIFI_ALLOWED_ORIGINS`：允许访问的前端域名
- `SCIFI_ADMIN_EMAIL`：默认管理员邮箱
- `SCIFI_ADMIN_PASSWORD`：默认管理员密码
- `SCIFI_SUPABASE_*`：图片存储相关配置
- `SCIFI_RESEND_*`：邮件验证相关配置

完整示例见：[backend/.env.example](D:/codex/backend/.env.example)
