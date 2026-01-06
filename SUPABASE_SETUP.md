# Supabase 配置指南

## 问题：test.supabase.co 连接失败

你的 `.env.local` 文件中使用的是测试数据：
```
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
```

这些是无效的配置，需要替换成你真实的 Supabase 项目配置。

---

## 获取真实的 Supabase 配置

### 步骤 1：登录 Supabase

1. 访问 [supabase.com](https://supabase.com)
2. 使用 GitHub 或 Google 账号登录

### 步骤 2：创建项目（如果还没有）

1. 点击 "New Project"
2. 填写项目信息：
   - **Name**: prompt-optimizer（或任意名称）
   - **Database Password**: 设置一个强密码（记住它！）
   - **Region**: 选择离你最近的区域（如 Singapore）
3. 点击 "Create new project"
4. 等待 1-2 分钟，项目创建完成

### 步骤 3：获取 API 配置

1. 在项目 Dashboard，点击左侧菜单的 **Settings** (齿轮图标)
2. 点击 **API**
3. 你会看到：

```
Project URL
https://xxxxxxxxxxxxx.supabase.co

Project API keys
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 步骤 4：配置 Google OAuth

1. 在 Supabase Dashboard，进入 **Authentication** → **Providers**
2. 找到 **Google**，点击展开
3. 启用 Google provider
4. 你需要配置 Google OAuth 客户端：

#### 4.1 创建 Google OAuth 客户端

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 进入 **APIs & Services** → **Credentials**
4. 点击 **Create Credentials** → **OAuth 2.0 Client ID**
5. 应用类型选择 **Web application**
6. 添加授权重定向 URI：
   ```
   https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
   http://localhost:3001/auth/callback
   ```
   （替换 `xxxxxxxxxxxxx` 为你的 Supabase 项目 ID）

7. 复制 **Client ID** 和 **Client Secret**

#### 4.2 在 Supabase 中配置

1. 回到 Supabase → Authentication → Providers → Google
2. 粘贴 **Client ID** 和 **Client Secret**
3. 点击 **Save**

### 步骤 5：配置重定向 URL

1. 在 Supabase Dashboard，进入 **Authentication** → **URL Configuration**
2. 设置：
   - **Site URL**: `http://localhost:3001`（开发环境）
   - **Redirect URLs**: 添加
     ```
     http://localhost:3001/**
     http://localhost:3000/**
     ```

### 步骤 6：更新 .env.local

将你获取的真实配置更新到 `frontend/.env.local`：

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase Configuration - 替换成你的真实配置
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### 步骤 7：重启开发服务器

```bash
# 停止当前服务器（Ctrl+C）
# 重新启动
cd frontend
npm run dev
```

---

## 验证配置

1. 访问 http://localhost:3001
2. 点击右上角的 "登录" 按钮
3. 应该看到登录弹窗
4. 勾选服务条款
5. 点击 "使用 Google 登录"
6. 应该跳转到 Google 登录页面（不是 test.supabase.co）

---

## 常见问题

### Q: 点击登录后显示 "Invalid login credentials"
A: 检查 Google OAuth 的重定向 URI 是否正确配置

### Q: 登录后没有跳转回来
A: 检查 Supabase 的 Redirect URLs 配置

### Q: 显示 "CORS error"
A: 确保在 Google Cloud Console 中添加了正确的授权来源

---

## 生产环境配置

部署到 Vercel 后，需要：

1. 在 Vercel 环境变量中设置相同的配置
2. 更新 Google OAuth 重定向 URI：
   ```
   https://your-domain.vercel.app/auth/callback
   ```
3. 更新 Supabase Redirect URLs：
   ```
   https://your-domain.vercel.app/**
   ```
4. 更新 Supabase Site URL：
   ```
   https://your-domain.vercel.app
   ```

---

需要帮助？查看官方文档：
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Google OAuth 配置](https://supabase.com/docs/guides/auth/social-login/auth-google)
