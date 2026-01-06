# 部署指南

本项目采用 **Vercel + Render + Supabase** 架构部署。

## 架构概览

- **前端**: Vercel（Next.js）
- **后端**: Render（FastAPI）
- **数据库**: Supabase（PostgreSQL）
- **认证**: Supabase Auth（Google 登录）
- **支付**: Creem

---

## 一、Supabase 配置

### 1.1 创建项目

1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目，记录：
   - Project URL: `https://xxx.supabase.co`
   - Anon Key: `eyJhbGc...`
   - Service Role Key: `eyJhbGc...`（后端使用）

### 1.2 配置 Google OAuth

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建 OAuth 2.0 客户端 ID：
   - 应用类型：Web 应用
   - 授权重定向 URI：
     ```
     https://xxx.supabase.co/auth/v1/callback
     https://your-domain.vercel.app/auth/callback
     http://localhost:3000/auth/callback  (开发环境)
     ```
3. 复制 Client ID 和 Client Secret

4. 在 Supabase Dashboard 中配置：
   - 进入 Authentication → Providers → Google
   - 启用 Google provider
   - 填入 Client ID 和 Client Secret
   - 保存

### 1.3 配置重定向 URL

在 Supabase Dashboard → Authentication → URL Configuration：
- Site URL: `https://your-domain.vercel.app`
- Redirect URLs: 添加所有允许的回调地址

---

## 二、Render 后端部署

### 2.1 连接 GitHub

1. 访问 [render.com](https://render.com)
2. 用 GitHub 登录
3. 点击 "New +" → "Web Service"
4. 连接你的 GitHub 仓库

### 2.2 配置服务

Render 会自动检测 `backend/render.yaml`，或手动配置：

- **Name**: `prompt-optimizer-backend`
- **Region**: Oregon (或离你最近的)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: Python 3.11
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 2.3 添加环境变量

在 Render Dashboard → Environment：

```bash
# 数据库
DATABASE_URL=postgresql://user:pass@host:5432/db  # 从 Supabase 获取

# DeepSeek API
DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-service-role-key  # 注意：使用 Service Role Key

# JWT
JWT_SECRET=your-random-secret-string

# CORS（重要！）
ALLOWED_ORIGINS=https://your-domain.vercel.app,https://preview-xxx.vercel.app

# 环境
ENVIRONMENT=production
```

### 2.4 获取后端 URL

部署完成后，复制你的服务 URL：
```
https://prompt-optimizer-backend.onrender.com
```

---

## 三、Vercel 前端部署

### 3.1 导入项目

1. 访问 [vercel.com](https://vercel.com)
2. 用 GitHub 登录
3. 点击 "Add New..." → "Project"
4. 导入你的 GitHub 仓库

### 3.2 配置项目

- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### 3.3 添加环境变量

在 Vercel Dashboard → Settings → Environment Variables：

```bash
# 后端 API（使用 Render 的 URL）
NEXT_PUBLIC_API_URL=https://prompt-optimizer-backend.onrender.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key  # 注意：使用 Anon Key

# 站点 URL
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 3.4 部署

点击 "Deploy"，等待部署完成。

---

## 四、验证部署

### 4.1 检查后端

访问：`https://your-backend.onrender.com/docs`
- 应该看到 Swagger API 文档
- 测试 `/health` 端点

### 4.2 检查前端

访问：`https://your-domain.vercel.app`
- 点击 "使用 Google 登录"
- 应该跳转到 Google 登录页面
- 登录后应该返回首页并显示用户信息

### 4.3 检查 API 调用

打开浏览器开发者工具（F12）：
- Network 标签：检查 API 请求是否成功
- Console 标签：检查是否有错误

---

## 五、常见问题

### 5.1 CORS 错误

**症状**: `Access-Control-Allow-Origin` 错误

**解决**:
1. 确认 Render 环境变量 `ALLOWED_ORIGINS` 包含你的 Vercel 域名
2. 重新部署后端

### 5.2 认证失败

**症状**: Google 登录后返回错误

**解决**:
1. 检查 Google OAuth 重定向 URI 是否正确
2. 检查 Supabase 的 Redirect URLs 配置
3. 确认环境变量 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 正确

### 5.3 后端冷启动慢

**症状**: 首次请求需要 30-60 秒

**解决**:
- Render 免费版会在 15 分钟无活动后休眠
- 升级到付费版（$7/月）保持常驻
- 或使用 cron 服务定时 ping 保持唤醒

### 5.4 数据库连接失败

**症状**: 后端无法连接数据库

**解决**:
1. 检查 `DATABASE_URL` 格式是否正确
2. 在 Supabase Dashboard → Settings → Database 获取正确的连接字符串
3. 确保使用 `postgresql://` 而不是 `postgres://`

---

## 六、环境变量总结

### Frontend (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### Backend (Render)
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGc...  # Service Role Key
JWT_SECRET=your-random-secret
ALLOWED_ORIGINS=https://your-domain.vercel.app
ENVIRONMENT=production
```

---

## 七、本地开发

### 7.1 安装依赖

```bash
# 前端
cd frontend
npm install

# 后端
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 7.2 配置环境变量

创建 `frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

创建 `backend/.env`:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-service-role-key
JWT_SECRET=dev-secret
ALLOWED_ORIGINS=http://localhost:3000
ENVIRONMENT=development
```

### 7.3 启动服务

```bash
# 后端（终端 1）
cd backend
uvicorn app.main:app --reload

# 前端（终端 2）
cd frontend
npm run dev
```

访问 `http://localhost:3000`

---

## 八、更新部署

### 自动部署

推送到 GitHub 后，Vercel 和 Render 会自动部署：

```bash
git add .
git commit -m "更新功能"
git push origin main
```

### 手动部署

- **Vercel**: Dashboard → Deployments → Redeploy
- **Render**: Dashboard → Manual Deploy → Deploy latest commit

---

## 九、监控和日志

### Vercel
- Dashboard → Deployments → 查看构建日志
- Dashboard → Analytics → 查看访问统计

### Render
- Dashboard → Logs → 查看实时日志
- Dashboard → Metrics → 查看性能指标

### Supabase
- Dashboard → Database → 查看数据库状态
- Dashboard → Auth → 查看用户列表

---

## 十、成本估算

| 服务 | 免费额度 | 付费价格 |
|------|---------|---------|
| Vercel | 100GB 带宽/月 | $20/月起 |
| Render | 750 小时/月 | $7/月起 |
| Supabase | 500MB 数据库 | $25/月起 |
| **总计** | **完全免费** | **$52/月起** |

对于 MVP 阶段，免费额度完全够用！

---

需要帮助？查看各平台文档：
- [Vercel 文档](https://vercel.com/docs)
- [Render 文档](https://render.com/docs)
- [Supabase 文档](https://supabase.com/docs)
